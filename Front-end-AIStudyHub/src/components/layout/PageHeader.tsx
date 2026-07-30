import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  compact = false,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        <h1
          className={cn(
            'font-bold tracking-tight text-foreground',
            compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="text-sm font-medium text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
