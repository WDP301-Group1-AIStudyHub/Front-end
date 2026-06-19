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
    <section className="botanical-bento relative min-h-[460px] w-[min(100%,520px)] overflow-hidden p-8 sm:p-11">
      <AuthIcon name="flare" className="absolute right-8 top-8 h-24 w-24 text-primary opacity-10 [stroke-width:1.1]" />
      <div className="mb-0">
        <h2 className="moonlit-title m-0 mb-2 text-[34px] leading-[1.05]">{title}</h2>
        <p className="m-0 text-sm font-medium text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}
