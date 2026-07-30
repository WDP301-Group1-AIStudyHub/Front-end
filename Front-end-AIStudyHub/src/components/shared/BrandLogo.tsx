import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BrandLogo({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5 font-bold tracking-tight', compact && '[&_.brand-mark]:size-7', className)}>
      <span className="brand-mark inline-grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-[#f8f4df] shadow-[inset_0_-10px_18px_rgb(72_106_77/0.06)]" aria-hidden="true">
        <Leaf className="size-4 text-primary shrink-0" />
      </span>
      {!compact ? <span className="overflow-hidden text-ellipsis whitespace-nowrap">AI Study Hub</span> : null}
    </span>
  )
}
