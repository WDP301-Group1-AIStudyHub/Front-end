import type { ReactNode } from 'react'

export default function AuthCardShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <section className="w-[min(100%,520px)] border border-border bg-white p-7 sm:p-10">
      <div className="mb-0">
        <h2 className="m-0 mb-2 text-3xl font-semibold leading-tight tracking-[-0.02em]">{title}</h2>
        <p className="m-0 text-sm font-medium text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}
