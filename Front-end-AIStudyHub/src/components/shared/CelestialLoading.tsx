import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function CelestialLoader({
  className,
  label = 'Loading...',
  size = 'md',
}: {
  className?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: string
}) {
  const iconSize = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-6' : 'size-4'
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm font-medium text-muted-foreground', className)} role="status">
      <Loader2 className={cn('animate-spin text-primary', iconSize)} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </div>
  )
}

export function CelestialInlineLoader({
  className,
  label,
}: {
  className?: string
  label: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm font-medium text-muted-foreground', className)}>
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export function CelestialSkeleton({
  className,
  tone: _tone,
  ...props
}: React.ComponentProps<'div'> & { tone?: string }) {
  return <Skeleton className={className} {...props} />
}

export function CelestialProgress({
  className,
  label,
  tone: _tone,
  value,
}: {
  className?: string
  label?: string
  tone?: string
  value?: number
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      {label ? <div className="text-xs font-semibold text-muted-foreground">{label}</div> : null}
      <Progress value={value ?? 50} />
    </div>
  )
}

export function LoadingState({
  className,
  label = 'Loading...',
  tone: _tone,
}: {
  className?: string
  label?: string
  tone?: string
}) {
  return (
    <Card className={cn('grid min-h-40 place-items-center p-6', className)}>
      <CelestialLoader label={label} />
    </Card>
  )
}
