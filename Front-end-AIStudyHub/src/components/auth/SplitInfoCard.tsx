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
    <aside className="celestial-card flex min-h-[430px] flex-col justify-between p-12">
      <div>
        <span className="mb-6 block text-sm font-semibold text-primary">{eyebrow}</span>
        <h1 className="celestial-title m-0 mb-6 text-[clamp(42px,5vw,58px)] leading-none">{title}</h1>
        <p className="m-0 max-w-[330px] text-lg leading-[1.6] text-muted-foreground">
          Recover access to your study library and continue working with your saved material.
        </p>
      </div>
      <div className="flex items-center gap-[10px] text-xs font-semibold text-muted-foreground">
        <AuthIcon name="auto_awesome" className="w-5 h-5" />
        <span>{footer}</span>
      </div>
    </aside>
  )
}
