import type { ReactNode } from 'react'
import AuthIcon from './AuthIcon'

export default function SplitInfoCard({
  eyebrow,
  footer,
  title,
}: {
  eyebrow: string
  footer: string
  title: ReactNode
  variant: 'lost' | 'found'
}) {
  return (
    <aside className="auth-split-glow flex flex-col justify-between min-h-[430px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-[0_0_40px_rgba(0,0,0,0.24)] rounded-[18px] p-12">
      <div>
        <span className="block mb-6 text-[rgba(196,199,200,0.6)] text-xs font-semibold tracking-[0.2em] uppercase">{eyebrow}</span>
        <h1 className="m-0 mb-6 text-white text-[clamp(48px,5vw,64px)] font-[200] leading-none">{title}</h1>
        <p className="max-w-[330px] m-0 text-[rgba(196,199,200,0.8)] text-lg leading-[1.6]">
          The scholarly cosmos is vast. Re-establish your orbit and regain access to your intellectual archives.
        </p>
      </div>
      <div className="flex items-center gap-[10px] text-[rgba(229,226,225,0.6)] text-xs font-semibold tracking-[0.14em] uppercase">
        <AuthIcon name="auto_awesome" className="w-5 h-5" />
        <span>{footer}</span>
      </div>
    </aside>
  )
}
