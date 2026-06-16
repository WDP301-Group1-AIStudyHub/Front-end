import { ChevronDown } from 'lucide-react'
import BrandLogo from './BrandLogo'

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
    <nav className="public-nav fixed left-0 right-0 top-4 z-50">
      <div className="mx-auto flex w-[calc(100%-32px)] max-w-[1180px] items-center justify-between gap-4 rounded-xl border border-border bg-card/95 px-4 py-3 text-foreground  sm:px-5">
        <a className="flex min-w-0 items-center gap-2" href="/">
          <BrandLogo />
        </a>

        <div className="hidden items-center gap-2 md:flex">
          {[
            { href: dashboardHref, label: 'Dashboard' },
            { href: '/about', label: 'About Us' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
            >
              <span>{item.label}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showLogin ? (
            <a
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Login
            </a>
          ) : null}
          <a
            href={ctaHref}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] sm:px-5"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  )
}
