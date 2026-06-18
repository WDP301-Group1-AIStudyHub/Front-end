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
      <div className="mx-auto flex w-[calc(100%-32px)] max-w-[1180px] items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md px-4 py-3 text-foreground shadow-sm transition-all sm:px-5">
        <a className="flex min-w-0 items-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]" href="/">
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-border/60 hover:bg-muted/60 hover:text-foreground"
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
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground sm:inline-flex"
            >
              Login
            </a>
          ) : null}
          <a
            href={ctaHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] hover:scale-[1.02] active:scale-[0.98] sm:px-5"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  )
}
