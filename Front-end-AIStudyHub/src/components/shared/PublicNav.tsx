import { ArrowRight } from 'lucide-react'
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
  dashboardHref = '/#workflow',
  showLogin = true,
}: PublicNavProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-white/95">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 text-foreground sm:px-8 lg:px-12">
        <a className="flex min-w-0 items-center gap-2" href="/">
          <BrandLogo />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {[
            { href: dashboardHref, label: 'Workspace' },
            { href: '/about', label: 'About' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex min-h-9 items-center rounded-md border border-transparent px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showLogin ? (
            <a
              href="/login"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Login
            </a>
          ) : null}
          <a
            href={ctaHref}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] active:translate-y-px sm:px-5"
          >
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </nav>
  )
}
