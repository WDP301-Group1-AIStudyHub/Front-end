import type { ReactNode } from 'react'
import AuthFooter from './AuthFooter'
import AuthHeader from './AuthHeader'

const mainCentered = 'grid grid-cols-1 lg:grid-cols-[minmax(280px,390px)_minmax(360px,520px)] items-center justify-center gap-10 lg:gap-20 min-h-[calc(100svh-72px)]'
const mainSplit = 'grid grid-cols-1 lg:grid-cols-[minmax(320px,500px)_minmax(320px,500px)] items-center justify-center gap-6 min-h-[660px]'

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
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-[#f7f8f7]">
      <AuthHeader action={action} />
      <main className={`w-full flex-1 px-5 pb-12 pt-24 sm:px-8 lg:px-12 ${mode === 'centered' ? mainCentered : mainSplit}`}>
        {children}
      </main>
      {showFooter || mode === 'split' ? <AuthFooter compact={mode === 'split'} /> : null}
    </div>
  )
}
