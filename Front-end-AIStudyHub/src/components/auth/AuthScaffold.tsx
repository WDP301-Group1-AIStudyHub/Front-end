import type { ReactNode } from 'react'
import CelestialBackdrop from '../shared/CelestialBackdrop'
import AuthFooter from './AuthFooter'
import AuthHeader from './AuthHeader'

const mainCentered = 'grid grid-cols-1 lg:grid-cols-[minmax(260px,380px)_minmax(360px,500px)] items-center justify-center gap-12 min-h-[calc(100svh-72px)]'
const mainSplit = 'grid grid-cols-1 lg:grid-cols-[minmax(320px,480px)_minmax(320px,480px)] items-center justify-center gap-6 min-h-[660px]'

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
    <div className="celestial-page flex min-h-svh flex-col overflow-x-hidden">
      <CelestialBackdrop intensity="dramatic" />
      <AuthHeader action={action} />
      <main className={`relative z-[1] w-full flex-1 px-[clamp(20px,6vw,80px)] pb-12 pt-32 ${mode === 'centered' ? mainCentered : mainSplit}`}>
        {children}
      </main>
      {showFooter || mode === 'split' ? <AuthFooter compact={mode === 'split'} /> : null}
    </div>
  )
}
