import { useEffect, useState } from 'react'
import { FileText, HeartPulse, MessageSquare, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '../../components/shared/CelestialLoading'
import { getDashboardStats } from '../../services/adminApi'
import type { DashboardStats } from '../../types/admin'
import { AdminPageHeader, AdminStatCard, formatDateTime, StatusBadge } from './adminPageUtils'
import { Link } from 'react-router-dom'

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'User Login',
  USER_REGISTER: 'User Register',
  DOCUMENT_UPLOAD: 'Document Upload',
  DOCUMENT_DELETE: 'Document Delete',
  LOGIN: 'Login',
  REGISTER: 'Register',
  OTHER: 'Other Action',
}

function formatActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    getDashboardStats()
      .then((data) => {
        if (mounted) setStats(data)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const usage = stats?.usageStatistics
  const health = stats?.platformHealth
  const activities = stats?.recentActivities ?? []

  return (
    <main className="botanical-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        actions={<Button asChild><Link to="/admin/users">Review users</Link></Button>}
        description="System-wide usage statistics and overall platform health at a glance."
        eyebrow="Admin workspace"
        title="Admin Dashboard"
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={<Users />} label="Total users" value={isLoading ? '...' : String(usage?.totalUsers ?? 0)} tone="blue" />
        <AdminStatCard icon={<FileText />} label="Total documents" value={isLoading ? '...' : String(usage?.totalDocuments ?? 0)} tone="gold" />
        <AdminStatCard icon={<MessageSquare />} label="Chat threads" value={isLoading ? '...' : String(usage?.totalChatThreads ?? 0)} tone="teal" />
        <AdminStatCard icon={<BookOpen />} label="Study materials" value={isLoading ? '...' : String(usage?.totalStudyMaterials ?? 0)} tone="coral" />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="botanical-bento moonlit-table tone-surface tone-sapphire overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 p-5">
            <div>
              <h2 className="text-lg font-semibold">Recent activity stream</h2>
              <p className="text-sm text-muted-foreground">Latest admin and platform events from the server.</p>
            </div>
            <Button variant="outline" asChild><Link to="/admin/activity">Open activity</Link></Button>
          </div>
          <div className="divide-y divide-border/60">
            {isLoading ? (
              <div className="p-5">
                <LoadingState label="Loading admin signals..." tone="sapphire" />
              </div>
            ) : activities.length === 0 ? (
              <div className="grid min-h-48 place-items-center p-5 text-muted-foreground">
                <p>No recent activities.</p>
              </div>
            ) : activities.slice(0, 6).map((activity) => (
              <div className="grid gap-3 p-5 transition-colors hover:bg-muted/35 md:grid-cols-[160px_1fr_auto]" key={activity._id}>
                <span className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
                <div>
                  <p className="font-medium">{activity.details?.action as string ?? formatActionLabel(activity.action)}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.userId?.fullName ?? 'System'}
                    {!['USER_LOGIN', 'USER_REGISTER'].includes(activity.action) && activity.entityType ? ` → ${activity.entityType}` : ''}
                  </p>
                </div>
                <StatusBadge severity="info">{formatActionLabel(activity.action)}</StatusBadge>
              </div>
            ))}
          </div>
        </article>

        <aside className="botanical-bento p-5 space-y-5">
          <div className="admin-icon-badge admin-tone-mist">
            <HeartPulse />
          </div>
          <h2 className="text-lg font-semibold">Platform Health</h2>
          {isLoading ? (
            <LoadingState label="Loading health..." tone="gold" />
          ) : health ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3">
                <span>Overall status</span>
                <StatusBadge severity={health.status === 'Healthy' ? 'success' : 'warning'}>
                  {health.status}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3">
                <span>Database</span>
                <StatusBadge severity={health.databaseConnected ? 'success' : 'critical'}>
                  {health.databaseConnected ? 'Connected' : 'Disconnected'}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3">
                <span>Chunks processed</span>
                <strong>{health.documentProcessing.totalChunksProcessed}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3">
                <span>Successful extractions</span>
                <StatusBadge severity="success">{health.documentProcessing.completedExtractions}</StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3">
                <span>Extractions failed</span>
                <StatusBadge severity={health.documentProcessing.failedExtractions > 0 ? 'warning' : 'success'}>
                  {health.documentProcessing.failedExtractions}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3">
                <span>Failure rate</span>
                <span className="font-medium">{health.documentProcessing.failureRatePercentage}%</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No health data available.</p>
          )}
        </aside>
      </section>
    </main>
  )
}
