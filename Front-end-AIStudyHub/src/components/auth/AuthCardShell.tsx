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
    <section className="relative overflow-hidden w-[min(100%,500px)] min-h-[460px] p-11 rounded-[18px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-[0_0_40px_rgba(0,0,0,0.24)]">
      <AuthIcon name="flare" className="absolute top-8 right-8 w-28 h-28 text-white/[0.12] [stroke-width:1.1]" />
      <div className="mb-0">
        <h2 className="m-0 mb-2 text-white text-[32px] font-light leading-[1.2]">{title}</h2>
        <p className="m-0 text-[rgba(196,199,200,0.74)] text-xs font-semibold tracking-[0.12em] uppercase">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}
