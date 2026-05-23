export default function AuthFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`relative z-[1] flex w-full items-center justify-between gap-7 border-t border-white/[0.05] opacity-[0.66] ${compact ? 'px-7 py-6' : 'px-[clamp(28px,6vw,80px)] py-9'}`}>
      <a className="text-white font-bold text-xs tracking-[0.15em] uppercase" href="/">
        AI Study Hub
      </a>
      <nav className="flex gap-9" aria-label="Footer navigation">
        {['#privacy', '#terms', '#papers'].map((href, i) => (
          <a
            key={href}
            href={href}
            className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase hover:text-white transition-colors"
          >
            {['Privacy Policy','Terms of Service','Research Papers'][i]}
          </a>
        ))}
      </nav>
      <span className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase">&copy; 2024 AI Study Hub. The Scholarly Cosmos.</span>
    </footer>
  )
}
