export default function AuthFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`relative z-[1] flex w-full flex-col items-start justify-between gap-5 border-t border-border/70 text-muted-foreground md:flex-row md:items-center ${compact ? 'px-7 py-6' : 'px-[clamp(28px,6vw,80px)] py-9'}`}>
      <a className="text-xs font-bold uppercase tracking-[0.15em] text-foreground" href="/">
        AI Study Hub
      </a>
      <nav className="flex flex-wrap gap-5 md:gap-9" aria-label="Footer navigation">
        {['#privacy', '#terms', '#papers'].map((href, i) => (
          <a
            key={href}
            href={href}
            className="text-xs font-semibold uppercase tracking-[0.15em] transition-colors hover:text-foreground"
          >
            {['Privacy Policy','Terms of Service','Research Papers'][i]}
          </a>
        ))}
      </nav>
      <span className="text-xs font-semibold uppercase tracking-[0.15em]">&copy; 2024 AI Study Hub. The Scholarly Cosmos.</span>
    </footer>
  )
}
