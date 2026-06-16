import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'sapphire' | 'teal' | 'gold' | 'violet' | 'coral' | 'emerald' | 'cyan'

export function CelestialLoader({
  className,
  label = 'Loading...',
  size = 'md',
  tone = 'sapphire',
}: {
  className?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: Tone
}) {
  return (
    <div className={cn('celestial-loader', `tone-${tone}`, `celestial-loader-${size}`, className)} role="status">
      <span className="celestial-loader-mark" aria-hidden="true" />
      <span className="celestial-loader-label">{label}</span>
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
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className="size-4 animate-spin text-current" aria-hidden="true" />
      <span className="celestial-shimmer-text">{label}</span>
    </span>
  )
}

export function CelestialSkeleton({
  className,
  tone = 'sapphire',
  ...props
}: React.ComponentProps<'div'> & { tone?: Tone }) {
  return (
    <div
      data-slot="skeleton"
      className={cn('celestial-skeleton', `tone-${tone}`, className)}
      {...props}
    />
  )
}

export function CelestialProgress({
  className,
  label,
  tone = 'cyan',
}: {
  className?: string
  label?: string
  tone?: Tone
}) {
  return (
    <div className={cn('celestial-progress-wrap', `tone-${tone}`, className)}>
      {label ? <div className="celestial-progress-label">{label}</div> : null}
      <div className="celestial-progress-track" aria-hidden="true">
        <span className="celestial-progress-comet" />
      </div>
    </div>
  )
}

export function LoadingState({
  className,
  label = 'Loading...',
  tone = 'sapphire',
}: {
  className?: string
  label?: string
  tone?: Tone
}) {
  return (
    <div className={cn('celestial-card tone-surface grid min-h-40 place-items-center p-6', `tone-${tone}`, className)}>
      <CelestialLoader label={label} tone={tone} />
    </div>
  )
}
