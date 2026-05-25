import ThemeToggle from '../shared/ThemeToggle'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/', label: 'About Us' },
]

export default function AuthHeader({ action }: { action: 'Sign Up' | 'Sign In' | 'Register' }) {
  const href = action === 'Sign In' ? '/login' : '/register'

  return (
    <header className="relative z-20 grid w-full grid-cols-[1fr_auto_1fr] items-center border-b border-border/70 bg-card/75 px-[clamp(20px,6vw,80px)] py-3 backdrop-blur-2xl">
      <a className="justify-self-start text-[clamp(20px,2vw,32px)] font-semibold leading-[1.05] tracking-tight" href="/">
        AI Study Hub
      </a>
      <nav className="flex justify-center gap-10" aria-label="Auth navigation">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="justify-self-end flex items-center gap-2">
        <ThemeToggle compact />
        <a
          className="inline-flex min-h-[36px] min-w-[102px] items-center justify-center rounded-full bg-primary px-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-transform hover:-translate-y-0.5"
          href={href}
        >
          {action}
        </a>
      </div>
    </header>
  )
}
