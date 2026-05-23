const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/', label: 'About Us' },
]

export default function AuthHeader({ action }: { action: 'Sign Up' | 'Sign In' | 'Register' }) {
  const href = action === 'Sign In' ? '/login' : '/register'

  return (
    <header className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-center w-full min-h-[72px] px-[clamp(28px,6vw,80px)] py-2 border-b border-white/10 bg-[rgba(19,19,19,0.22)] backdrop-blur-[18px]">
      <a className="justify-self-start text-white text-[clamp(20px,2vw,32px)] font-light leading-[1.05] tracking-[0.02em]" href="/">
        AI Study Hub
      </a>
      <nav className="flex justify-center gap-10" aria-label="Auth navigation">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase hover:text-white transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <a
        className="justify-self-end inline-flex min-w-[102px] min-h-[34px] items-center justify-center rounded-full bg-white text-[#2f3131] text-xs font-semibold tracking-[0.15em] uppercase hover:opacity-90 transition-opacity"
        href={href}
      >
        {action}
      </a>
    </header>
  )
}
