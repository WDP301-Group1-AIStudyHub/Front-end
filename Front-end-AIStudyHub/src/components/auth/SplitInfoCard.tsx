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
    <aside className="botanical-bento flex min-h-[430px] flex-col justify-between p-10 md:p-12">
      <div className="relative z-10">
        <span className="botanical-kicker mb-6">{eyebrow}</span>
        <h1 className="moonlit-title m-0 mb-6 text-[clamp(42px,5vw,58px)] leading-[0.98]">{title}</h1>
        <p className="m-0 max-w-[330px] text-lg leading-[1.6] text-muted-foreground">
          Recover access to your study library and continue working with your saved material.
        </p>
      </div>
      <div className="moonlit-media-frame relative z-10 my-8 h-40">
        <img
          alt="Quiet botanical library shelf"
          className="moonlit-image"
          src="/landing-assets/moonlit-library-still.webp"
        />
      </div>
      <div className="relative z-10 flex items-center gap-[10px] text-xs font-semibold text-muted-foreground">
        <AuthIcon name="auto_awesome" className="w-5 h-5" />
        <span>{footer}</span>
      </div>
    </aside>
  )
}
