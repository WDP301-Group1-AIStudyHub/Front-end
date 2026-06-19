import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CelestialSkeleton } from '../../components/shared/CelestialLoading'
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
    <header className="botanical-page-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="botanical-kicker">
          {eyebrow}
        </p>
        <h1 className="moonlit-title mt-2 text-3xl md:text-5xl">{title}</h1>
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
  tone?: 'blue' | 'coral' | 'gold' | 'teal' | 'mist'
  value: string
}) {
  return (
    <article className={cn('botanical-bento p-5', `tone-${tone === 'blue' ? 'sapphire' : tone}`)}>
      <div className={cn('admin-icon-badge', `admin-tone-${tone}`)}>{icon}</div>
      <p className="mt-5 text-sm font-medium text-muted-foreground">
        {label}
      </p>
      {value === '...' ? (
        <CelestialSkeleton className="mt-3 h-8 w-24" tone={tone === 'blue' ? 'sapphire' : tone} />
      ) : (
        <strong className="mt-2 block text-3xl font-semibold tracking-tight">{value}</strong>
      )}
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
