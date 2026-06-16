import { useEffect, useMemo, useState } from 'react'
import { Activity, Database, FileText, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '../../components/shared/CelestialLoading'
import { listAdminDocuments, listAdminUsers, listSystemActivities } from '../../services/adminApi'
import type { AdminDocument, AdminUser, SystemActivity } from '../../types/admin'
import { AdminPageHeader, AdminStatCard, formatDateTime, StatusBadge } from './adminPageUtils'
import { Link } from 'react-router-dom'

export default function AdminDashboardPage() {
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    let mounted = true

    Promise.all([listAdminUsers(), listAdminDocuments(), listSystemActivities()])
      .then(([nextUsers, nextDocuments, nextActivities]) => {
        if (!mounted) return
        setUsers(nextUsers)
        setDocuments(nextDocuments)
        setActivities(nextActivities)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.isActive).length
    const indexedDocuments = documents.filter((document) => document.indexedStatus === 'indexed').length
    const criticalActivities = activities.filter((activity) => activity.severity === 'critical').length

    return { activeUsers, criticalActivities, indexedDocuments }
  }, [activities, documents, users])

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        actions={<Button asChild><Link to="/admin/users">Review users</Link></Button>}
        description="Control accounts, review document metadata, and monitor the system health signals described by the admin usecase."
        eyebrow="Admin workspace"
        title="Admin Dashboard"
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={<Users />} label="Total users" value={isLoading ? '...' : String(users.length)} tone="blue" />
        <AdminStatCard icon={<ShieldCheck />} label="Active users" value={isLoading ? '...' : String(stats.activeUsers)} tone="teal" />
        <AdminStatCard icon={<FileText />} label="Indexed documents" value={isLoading ? '...' : String(stats.indexedDocuments)} tone="gold" />
        <AdminStatCard icon={<Activity />} label="Critical events" value={isLoading ? '...' : String(stats.criticalActivities)} tone="coral" />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="celestial-card celestial-table tone-surface tone-sapphire overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 p-5">
            <div>
              <h2 className="text-lg font-semibold">System activity stream</h2>
              <p className="text-sm text-muted-foreground">Recent admin and platform events.</p>
            </div>
            <Button variant="outline" asChild><Link to="/admin/activity">Open activity</Link></Button>
          </div>
          <div className="divide-y divide-border/60">
            {isLoading ? (
              <div className="p-5">
                <LoadingState label="Loading admin signals..." tone="sapphire" />
              </div>
            ) : activities.slice(0, 6).map((activity) => (
              <div className="grid gap-3 p-5 transition-colors hover:bg-muted/35 md:grid-cols-[160px_1fr_auto]" key={activity.id}>
                <span className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-muted-foreground">{activity.actor} {'->'} {activity.target}</p>
                </div>
                <StatusBadge severity={activity.severity}>{activity.severity}</StatusBadge>
              </div>
            ))}
          </div>
        </article>

        <aside className="celestial-card p-5">
          <div className="admin-icon-badge admin-tone-violet">
            <Database />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Usecase coverage</h2>
          <div className="mt-5 space-y-3 text-sm">
            {['View user list', 'Active/Inactive user account', 'Update user information', 'Edit metadata', 'Monitor system activities'].map((item) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/45 p-3 " key={item}>
                <span>{item}</span>
                <StatusBadge severity="success">ready</StatusBadge>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
