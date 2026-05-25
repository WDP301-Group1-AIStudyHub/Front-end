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
    <aside className="auth-split-glow celestial-card tone-surface tone-violet flex min-h-[430px] flex-col justify-between p-12">
      <div>
        <span className="mb-6 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-gold)]">{eyebrow}</span>
        <h1 className="celestial-title m-0 mb-6 text-[clamp(48px,5vw,64px)] font-[200] leading-none">{title}</h1>
        <p className="m-0 max-w-[330px] text-lg leading-[1.6] text-muted-foreground">
          The scholarly cosmos is vast. Re-establish your orbit and regain access to your intellectual archives.
        </p>
      </div>
      <div className="flex items-center gap-[10px] text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <AuthIcon name="auto_awesome" className="w-5 h-5" />
        <span>{footer}</span>
      </div>
    </aside>
  )
}
