import { cn } from '@/lib/utils'

export default function BrandLogo({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <span className={cn('brand-logo', compact && 'brand-logo-compact', className)}>
      <span className="brand-logo-mark" aria-hidden="true">
        <span className="brand-logo-core" />
      </span>
      {!compact ? <span className="brand-logo-text">AI Study Hub</span> : null}
    </span>
  )
}
