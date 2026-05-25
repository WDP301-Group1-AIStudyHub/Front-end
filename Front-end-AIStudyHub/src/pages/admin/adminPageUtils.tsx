import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { SystemActivitySeverity } from '../../types/admin'

export function formatDateTime(value?: string) {
  if (!value) return 'Never'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function AdminPageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500">
          {eyebrow}
        </p>
        <h1 className="celestial-title mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function AdminStatCard({
  icon,
  label,
  tone = 'blue',
  value,
}: {
  icon: ReactNode
  label: string
  tone?: 'blue' | 'coral' | 'gold' | 'teal' | 'violet'
  value: string
}) {
  return (
    <article className={cn('celestial-card tone-surface p-5', `tone-${tone === 'blue' ? 'sapphire' : tone}`)}>
      <div className={cn('admin-icon-badge', `admin-tone-${tone}`)}>{icon}</div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <strong className="mt-2 block text-3xl font-semibold tracking-tight">{value}</strong>
    </article>
  )
}

export function StatusBadge({
  children,
  severity = 'info',
}: {
  children: ReactNode
  severity?: SystemActivitySeverity | 'active' | 'inactive' | 'processing' | 'indexed' | 'failed'
}) {
  return <span className={cn('status-badge', `status-${severity}`)}>{children}</span>
}
