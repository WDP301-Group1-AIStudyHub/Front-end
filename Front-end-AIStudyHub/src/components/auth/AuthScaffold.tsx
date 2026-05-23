import type { ReactNode } from 'react'
import GalaxyBackground from '../shared/GalaxyBackground'
import AuthFooter from './AuthFooter'
import AuthHeader from './AuthHeader'

const mainCentered = 'grid grid-cols-[minmax(260px,380px)_minmax(360px,500px)] items-center justify-center gap-12 min-h-[calc(100svh-72px)]'
const mainSplit    = 'grid grid-cols-[minmax(320px,480px)_minmax(320px,480px)] items-center justify-center gap-6 min-h-[660px]'

export default function AuthScaffold({
  action,
  children,
  mode,
  showFooter = false,
}: {
  action: 'Sign Up' | 'Sign In' | 'Register'
  children: ReactNode
  mode: 'centered' | 'split'
  showFooter?: boolean
}) {
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-x-hidden text-[#e5e2e1]">
      <GalaxyBackground />
      <AuthHeader action={action} />
      <main className={`relative z-[1] flex-1 w-full px-[clamp(20px,6vw,80px)] pt-24 pb-12 ${mode === 'centered' ? mainCentered : mainSplit}`}>
        {children}
      </main>
      {showFooter || mode === 'split' ? <AuthFooter compact={mode === 'split'} /> : null}
    </div>
  )
}
