import { ChevronDown } from 'lucide-react'
import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'

type PublicNavProps = {
  ctaHref?: string
  ctaLabel?: string
  dashboardHref?: string
  showLogin?: boolean
}

export default function PublicNav({
  ctaHref = '/register',
  ctaLabel = 'Sign Up',
  dashboardHref = '#dashboard',
  showLogin = true,
}: PublicNavProps) {
  return (
    <nav className="public-nav fixed left-0 right-0 top-6 z-50">
      <div className="mx-auto flex w-[calc(100%-48px)] max-w-[1240px] items-center justify-between gap-4 rounded-[28px] border border-white/14 bg-black/18 px-5 py-3 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.92)] backdrop-blur-[24px] sm:px-6">
        <a className="min-w-0" href="/">
          <BrandLogo />
        </a>

        <div className="hidden items-center gap-[30px] md:flex">
          {[
            { href: dashboardHref, label: 'Dashboard' },
            { href: '/about', label: 'About Us' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-3 text-sm font-medium text-white/78 transition-colors hover:text-white"
            >
              <span>{item.label}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle compact />
          {showLogin ? (
            <a
              href="/login"
              className="hidden bg-transparent p-0 text-xs font-semibold uppercase tracking-[0.15em] text-white/68 transition-colors hover:text-white sm:inline-flex"
            >
              Login
            </a>
          ) : null}
          <a
            href={ctaHref}
            className="lp-pulsing-btn inline-flex min-h-[42px] items-center justify-center rounded-full px-5 text-sm font-medium transition-all sm:px-[29px]"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  )
}
