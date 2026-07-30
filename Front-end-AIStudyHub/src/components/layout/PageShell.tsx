import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-h-svh overflow-y-auto p-5 md:p-8', className)}>
      {children}
    </div>
  )
}
