import { useEffect, useMemo, useState } from 'react'
import { Activity, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '../../components/shared/CelestialLoading'
import { listSystemActivities } from '../../services/adminApi'
import type { SystemActivity } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | SystemActivity['severity']>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SystemActivity['type']>('all')

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

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        description="Monitor account events, document processing signals, and system health activities from the admin usecase."
        eyebrow="Admin activity"
        title="System Activity"
      />

      <section className="celestial-card celestial-table tone-surface tone-coral mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actor, target, or activity"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'info', 'success', 'warning', 'critical'] as const).map((severity) => (
              <Button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                size="sm"
                type="button"
                variant={severityFilter === severity ? 'default' : 'outline'}
              >
                {severity}
              </Button>
            ))}
            {(['all', 'auth', 'user', 'document', 'system'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setTypeFilter(type)}
                size="sm"
                type="button"
                variant={typeFilter === type ? 'default' : 'outline'}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-5">
              <LoadingState label="Loading activities..." tone="coral" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center text-muted-foreground">
              <div>
                <Filter className="mx-auto mb-3 size-8" />
                <p>No activity matches the current filters.</p>
              </div>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <article className="grid gap-4 p-5 transition-colors hover:bg-muted/35 lg:grid-cols-[180px_1fr_130px_120px]" key={activity.id}>
                <div className="text-sm text-muted-foreground">{formatDateTime(activity.createdAt)}</div>
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="admin-icon-badge admin-tone-blue mt-0.5 size-9">
                      <Activity className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold">{activity.description}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.actor} {'->'} {activity.target}
                      </p>
                    </div>
                  </div>
                </div>
                <StatusBadge severity={activity.severity}>{activity.severity}</StatusBadge>
                <StatusBadge severity="info">{activity.type}</StatusBadge>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
