import { useEffect, useMemo, useState } from 'react'
import { Activity, Filter, Search, Eye, Clock, User, Globe, MonitorSmartphone, Database, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingState } from '../../components/shared/CelestialLoading'
import { listSystemActivities } from '../../services/adminApi'
import type { SystemActivity } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [viewingActivity, setViewingActivity] = useState<SystemActivity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | SystemActivity['severity']>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SystemActivity['type']>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    listSystemActivities()
      .then(setActivities)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return activities.filter((activity) => {
      const matchesQuery =
        !normalizedQuery ||
        [activity.actor, activity.description, activity.target]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesSeverity = severityFilter === 'all' || activity.severity === severityFilter
      const matchesType = typeFilter === 'all' || activity.type === typeFilter

      return matchesQuery && matchesSeverity && matchesType
    })
  }, [activities, query, severityFilter, typeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, severityFilter, typeFilter])

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredActivities, currentPage])

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE)

  return (
    <main className="botanical-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        description="Monitor account events, document processing signals, and system activity from the backend."
        eyebrow="Admin activity"
        title="Activity Log"
      />

      <section className="botanical-bento moonlit-table tone-surface tone-coral mt-8 overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by actor, description, or target..."
              value={query}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Severity:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
              >
                <option value="all">All severities</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Category:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              >
                <option value="all">All categories</option>
                <option value="auth">Authentication</option>
                <option value="user">User</option>
                <option value="document">Document</option>
                <option value="system">System</option>
              </select>
            </div>
            <StatusBadge severity="info">{filteredActivities.length} logs</StatusBadge>
          </div>
        </div>

        {/* ── Table header ── */}
        <div className="hidden lg:grid lg:grid-cols-[160px_1fr_120px_110px_90px] gap-4 border-b border-border/50 bg-muted/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Timestamp</span>
          <span>Activity</span>
          <span>Severity</span>
          <span>Category</span>
          <span className="text-right">Actions</span>
        </div>

        {/* ── Rows ── */}
        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-5">
              <LoadingState label="Loading activities..." tone="coral" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Filter className="mb-3 size-12 text-muted-foreground/30" />
              <p>No activity matches the current filters.</p>
            </div>
          ) : (
            paginatedActivities.map((activity) => (
              <article className="grid gap-4 p-5 transition-colors hover:bg-muted/35 lg:grid-cols-[160px_1fr_120px_110px_90px]" key={activity.id}>
                <div className="text-sm text-muted-foreground">{formatDateTime(activity.createdAt)}</div>
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="admin-icon-badge admin-tone-blue mt-0.5 size-9">
                      <Activity className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold">{activity.description}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.actor}
                        {!['Account', 'Platform'].includes(activity.target) && ` → ${activity.target}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <StatusBadge severity={activity.severity}>{activity.severity}</StatusBadge>
                </div>
                <div className="flex items-center text-sm">
                  <StatusBadge severity="info">{activity.type}</StatusBadge>
                </div>
                <div className="flex items-center justify-end">
                  <Button onClick={() => setViewingActivity(activity)} size="sm" type="button" variant="secondary">
                    <Eye className="size-4 mr-2" />
                    View
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-4 bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredActivities.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredActivities.length, currentPage * ITEMS_PER_PAGE)} of {filteredActivities.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={Boolean(viewingActivity)} onOpenChange={(open) => !open && setViewingActivity(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden bg-background border-border/60 shadow-2xl">
          {viewingActivity && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Header Section */}
              <div className="bg-muted/40 p-6 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-primary">
                      <Activity className="size-6" />
                    </span>
                    <div>
                      <DialogTitle className="text-xl font-bold tracking-tight">
                        {viewingActivity.description}
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="size-3.5" />
                        {formatDateTime(viewingActivity.createdAt)}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge severity={viewingActivity.severity}>{viewingActivity.severity}</StatusBadge>
                    <StatusBadge severity="info">{viewingActivity.type}</StatusBadge>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-8">
                {/* General Info Grid */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
                    <User className="size-4 text-primary/70" /> General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Actor</p>
                      <p className="font-medium">{viewingActivity.actor}</p>
                    </div>
                    {viewingActivity.entityType && (
                      <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Entity Affected</p>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Tag className="size-3.5 text-muted-foreground" />
                          <span>{viewingActivity.entityType}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate" title={viewingActivity.entityId}>
                          ID: {viewingActivity.entityId}
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Technical Info */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground/80 mb-4 flex items-center gap-2">
                    <Globe className="size-4 text-primary/70" /> Technical Details
                  </h3>
                  <div className="bg-muted/20 border border-border/50 rounded-xl p-0 divide-y divide-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4">
                      <div className="sm:w-32 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Database className="size-4" /> Log ID
                      </div>
                      <div className="font-mono text-sm break-all">{viewingActivity.id}</div>
                    </div>
                    {viewingActivity.ipAddress && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4">
                        <div className="sm:w-32 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Globe className="size-4" /> IP Address
                        </div>
                        <div className="font-mono text-sm">{viewingActivity.ipAddress}</div>
                      </div>
                    )}
                    {viewingActivity.userAgent && (
                      <div className="flex flex-col sm:flex-row gap-2 p-4">
                        <div className="sm:w-[150px] flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
                          <MonitorSmartphone className="size-4" /> Device & Browser
                        </div>
                        <div className="text-sm break-words">{viewingActivity.userAgent}</div>
                      </div>
                    )}
                  </div>
                </section>


              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
