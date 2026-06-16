import type { ReactNode } from 'react'

export function EmptyState({
  action,
  description,
  icon,
  title,
}: {
  action?: ReactNode
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border p-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
