import { useEffect, useRef } from 'react'
import CelestialBackdrop from './components/shared/CelestialBackdrop'
import ThemeToggle from './components/shared/ThemeToggle'

const stats = [
  ['12M+', 'Papers Indexed'],
  ['800K', 'Active Researchers'],
  ['99.9%', 'Uptime Library'],
  ['142', 'Academic Partners'],
]


export default function LandingPage() {
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX - window.innerWidth / 2) / 100
      const y = (event.clientY - window.innerHeight / 2) / 100

      document.querySelectorAll<HTMLElement>('.lp-parallax-layer').forEach((layer) => {
        const depth = Number(layer.dataset.depth ?? '0')
        layer.style.transform = `translate(${x * depth * 50}px, ${y * depth * 50}px)`
      })
    }

    const handleScroll = () => {
      if (!navRef.current) return
      navRef.current.style.backgroundColor =
        window.scrollY > 50 ? 'var(--surface-glass)' : 'transparent'
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="celestial-page min-h-svh overflow-x-hidden bg-transparent font-[Manrope,system-ui,sans-serif] tracking-[0.01em] text-foreground">
      <CelestialBackdrop intensity="dramatic" />

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="fixed top-0 z-50 w-full border-b border-border/70 backdrop-blur-[24px] transition-colors duration-[180ms]"
      >
        <div className="mx-auto flex h-20 w-[min(100%,1440px)] items-center justify-between gap-4 px-5 lg:px-20">
          <div className="text-[clamp(22px,3vw,32px)] font-semibold leading-[1.2] tracking-tight">AI Study Hub</div>
          <div className="hidden items-center gap-10 md:flex">
            {['#dashboard', '#about'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {['Dashboard', 'About Us'][i]}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle compact />
            <a
              href="/login"
              className="hidden bg-transparent p-0 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Login
            </a>
            <a
              href="/register"
              className="lp-pulsing-btn inline-flex min-h-[42px] items-center justify-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.13em] transition-all sm:min-h-[46px] sm:px-8"
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="relative z-[1] pt-32 pb-24">

        {/* Hero */}
        <section className="mx-auto mb-24 w-[min(100%,1440px)] px-5 text-center lg:px-20">
          <div className="mb-8 inline-block rounded-full border border-border bg-card/50 px-4 py-1 backdrop-blur-[8px]">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              The Future of Intellectual Astronomy
            </span>
          </div>
          <h1 className="celestial-title lp-stellar-text-glow m-0 mb-8 text-[clamp(3rem,8vw,7rem)] font-[200] leading-[1.04] tracking-[0.03em]">
            Navigate the Cosmos <br /> of Knowledge
          </h1>
          <p className="mx-auto mb-12 w-[min(100%,672px)] text-lg leading-[1.6] text-muted-foreground">
            An ethereal platform where AI acts as your celestial guide, transforming vast
            expanses of information into structured constellations of insight.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a
              href="/register"
              className="lp-pulsing-btn inline-flex min-h-[56px] items-center justify-center rounded-full px-10 text-xs font-semibold uppercase tracking-[0.15em] transition-all"
            >
              Start Exploration
            </a>
            <a
              href="/login"
              className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-border bg-card/40 px-10 text-xs font-semibold uppercase tracking-[0.15em] transition-all hover:bg-muted"
            >
              Watch the Orbit
            </a>
          </div>
        </section>

        {/* Bento grid */}
        <section id="dashboard" className="mx-auto w-[min(100%,1440px)] px-5 lg:px-20">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:auto-rows-[280px]">

            {/* Research — col-span-8 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-sapphire group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/40 lg:col-span-8 lg:p-12"
              data-depth="0.1"
            >
              <div className="relative z-10">
                <span className="material-symbols-outlined mb-6 block text-4xl text-[var(--accent-gold)]">psychology</span>
                <h2 className="m-0 mb-4 text-[32px] font-light leading-[1.2] tracking-[0.03em]">AI-Powered Research</h2>
                <p className="m-0 max-w-[410px] text-base leading-[1.6] text-muted-foreground">
                  Our neural engine synthesizes millions of academic papers into coherent
                  summaries, highlighting hidden connections across disciplines.
                </p>
              </div>
              <div className="absolute top-[-10%] right-[-10%] opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                <img
                  alt="Neural network art"
                  src="/landing-assets/stitch-bento-1.jpg"
                  className="w-[500px] h-[500px] rounded-full object-cover"
                />
              </div>
            </article>

            {/* Cloud — col-span-4 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-teal flex min-h-[280px] flex-col justify-end rounded-3xl p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/40 lg:col-span-4 lg:p-10"
              data-depth="0.2"
            >
              <span className="material-symbols-outlined mb-6 block text-4xl text-[var(--accent-teal)]">cloud_sync</span>
              <h2 className="m-0 mb-4 text-[24px] font-light leading-[1.2]">Cloud Synced Library</h2>
              <p className="m-0 text-sm leading-[1.6] text-muted-foreground">
                Your entire intellectual universe, synchronized across every device in the void.
              </p>
            </article>

            {/* Semantic — col-span-4 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-violet flex min-h-[280px] flex-col justify-between rounded-3xl p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/40 lg:col-span-4 lg:p-10"
              data-depth="0.15"
            >
              <div>
                <span className="material-symbols-outlined mb-6 block text-4xl text-[var(--accent-violet)]">hub</span>
                <h2 className="m-0 mb-4 text-[24px] font-light leading-[1.2]">Semantic Insights</h2>
              </div>
              <p className="m-0 text-sm leading-[1.6] text-muted-foreground">
                Discover the &quot;why&quot; behind the data through our advanced contextual mapping engine.
              </p>
            </article>

            {/* Interface — col-span-8 */}
            <article
              className="lp-image-overlay lp-parallax-layer celestial-card tone-surface tone-coral group relative min-h-[320px] overflow-hidden rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-primary/40 lg:col-span-8"
              data-depth="0.05"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-10 left-10 z-20">
                <h2 className="m-0 mb-2 text-[24px] font-light leading-[1.2] text-white">The Void Interface</h2>
                <p className="m-0 text-sm text-white/75">Zero-distraction workspace designed for deep focus sessions.</p>
              </div>
              <img
                alt="Futuristic UI"
                src="/landing-assets/stitch-bento-2.jpg"
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2s]"
              />
            </article>

          </div>
        </section>

        {/* Stats */}
        <section
          id="about"
          className="mx-auto mt-32 w-[min(100%,1440px)] border-y border-border/60 px-5 py-20 lg:px-20"
        >
          <div className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label}>
                <div className="mb-2 text-[32px] font-[200] leading-[1.1] tracking-[0.05em]">{value}</div>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-32 px-5 text-center">
          <div className="celestial-card tone-surface tone-gold relative mx-auto w-[min(100%,896px)] overflow-hidden rounded-[32px] p-8 sm:p-14 lg:rounded-[48px] lg:p-20">
            <div className="relative z-10">
              <h2 className="celestial-title m-0 mb-6 text-[clamp(2.3rem,6vw,3rem)] font-[200] leading-[1.1] tracking-[0.05em]">Ready to transcend?</h2>
              <p className="mx-auto mb-12 max-w-[480px] text-lg leading-[1.6] text-muted-foreground">
                Join the scholars who have already claimed their place in the intellectual cosmos.
              </p>
              <a
                href="/register"
                className="lp-pulsing-btn inline-flex min-h-[56px] items-center justify-center rounded-full px-10 text-xs font-semibold uppercase tracking-[0.15em] transition-all"
              >
                Claim Your Domain
              </a>
            </div>
            <div className="lp-soft-pulse pointer-events-none absolute inset-0 bg-primary/5" />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/60 pb-12 pt-12">
        <div className="mx-auto flex w-[min(100%,1440px)] flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center lg:px-20">
          <div className="text-xs font-bold uppercase tracking-[0.15em]">AI Study Hub</div>
          <div className="flex flex-wrap items-center gap-5 md:gap-10">
            {['#privacy', '#terms', '#contact'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {['Privacy Policy', 'Terms of Service', 'Contact'][i]}
              </a>
            ))}
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            &copy; 2024 AI Study Hub. Intellectual Astronomy.
          </div>
        </div>
      </footer>
    </div>
  )
}


