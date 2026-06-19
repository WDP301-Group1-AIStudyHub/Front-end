import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'sapphire' | 'teal' | 'gold' | 'mist' | 'coral' | 'emerald' | 'cyan'

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
    <div className={cn('moonlit-loader', `tone-${tone}`, `moonlit-loader-${size}`, className)} role="status">
      <span className="moonlit-loader-mark" aria-hidden="true" />
      <span className="moonlit-loader-label">{label}</span>
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
      <span className="moonlit-shimmer-text">{label}</span>
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
      className={cn('moonlit-skeleton', `tone-${tone}`, className)}
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
    <div className={cn('moonlit-progress-wrap', `tone-${tone}`, className)}>
      {label ? <div className="moonlit-progress-label">{label}</div> : null}
      <div className="moonlit-progress-track" aria-hidden="true">
        <span className="moonlit-progress-comet" />
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
    <div className={cn('moonlit-card tone-surface grid min-h-40 place-items-center p-6', `tone-${tone}`, className)}>
      <CelestialLoader label={label} tone={tone} />
    </div>
  )
}
