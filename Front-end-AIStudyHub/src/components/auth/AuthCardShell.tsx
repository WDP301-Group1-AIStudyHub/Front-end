import type { ReactNode } from 'react'
import AuthIcon from './AuthIcon'

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
    <section className="celestial-card relative min-h-[460px] w-[min(100%,500px)] overflow-hidden p-8 sm:p-11">
      <AuthIcon name="flare" className="absolute right-8 top-8 h-28 w-28 text-muted-foreground/20 [stroke-width:1.1]" />
      <div className="mb-0">
        <h2 className="m-0 mb-2 text-[32px] font-light leading-[1.2]">{title}</h2>
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}
