import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { IconTile } from '@/components/shared/IconTile'
import { Badge } from '@/components/ui/badge'
import { CelestialSkeleton } from '@/components/shared/CelestialLoading'

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
    <Card className="p-5">
      <CardContent className="p-0">
        <IconTile tone={tone === 'coral' ? 'destructive' : tone === 'gold' ? 'warning' : 'info'} size="lg">
          {icon}
        </IconTile>
        <p className="mt-5 text-sm font-medium text-muted-foreground">
          {label}
        </p>
        {value === '...' ? (
          <CelestialSkeleton className="mt-3 h-8 w-24" tone={tone === 'blue' ? 'sapphire' : tone} />
        ) : (
          <strong className="mt-2 block text-3xl font-semibold tracking-tight">{value}</strong>
        )}
      </CardContent>
    </Card>
  )
}

const severityVariantMap: Record<string, "success" | "warning" | "info" | "failed" | "secondary" | "default" | "outline"> = {
  active: 'success',
  completed: 'success',
  indexed: 'success',
  processing: 'info',
  info: 'info',
  pending: 'warning',
  warning: 'warning',
  failed: 'failed',
  error: 'failed',
  inactive: 'secondary',
}

export function StatusBadge({
  children,
  severity = 'info',
}: {
  children?: ReactNode
  severity?: string
}) {
  const variant = severityVariantMap[(severity || '').toLowerCase()] || 'outline'
  return <Badge variant={variant}>{children || severity}</Badge>
}
