import { useEffect, useRef } from 'react'
import { Brain, ChevronDown, Cloud, GitBranch, Monitor } from 'lucide-react'
import BrandLogo from './components/shared/BrandLogo'
import PublicNav from './components/shared/PublicNav'
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

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="celestial-page min-h-svh overflow-x-hidden bg-transparent font-sans tracking-[0.01em] text-foreground">
      <PublicNav />

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="hidden"
      >
        <div className="mx-auto flex w-[min(100%,1440px)] items-center justify-between gap-4 px-5 py-5 lg:px-[120px]">
          <BrandLogo />
          <div className="hidden items-center gap-[30px] md:flex">
            {['#dashboard', '#about'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center gap-3.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                <span>{['Dashboard', 'About Us'][i]}</span>
                <ChevronDown className="size-3.5" aria-hidden="true" />
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
              className="lp-pulsing-btn inline-flex min-h-[42px] items-center justify-center rounded-full px-5 text-sm font-medium transition-all sm:px-[29px]"
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="relative z-[1] pb-24 pt-[200px] md:pt-[280px]">

        {/* Hero */}
        <section className="mx-auto mb-24 w-[min(100%,1440px)] px-5 text-center lg:px-[120px]">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-[18px]">
            <span className="size-1 rounded-full bg-white" aria-hidden="true" />
            <span className="text-[13px] font-medium text-foreground/70">
              The Future of Intellectual Astronomy
            </span>
          </div>
          <h1 className="celestial-title lp-stellar-text-glow mx-auto mb-6 max-w-[760px] text-[clamp(2.25rem,5vw,4.7rem)] font-medium leading-[1.18]">
            Navigate the Cosmos <br /> of Knowledge
          </h1>
          <p className="mx-auto mb-10 w-[min(100%,680px)] text-[15px] leading-[1.65] text-muted-foreground">
            An ethereal platform where AI acts as your celestial guide, transforming vast
            expanses of information into structured constellations of insight.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a
              href="/register"
              className="lp-pulsing-btn inline-flex min-h-[46px] items-center justify-center rounded-full px-[29px] text-sm font-medium transition-all"
            >
              Start Exploration
            </a>
            <a
              href="/login"
              className="video-pill-ghost inline-flex min-h-[46px] items-center justify-center rounded-full px-[29px] text-sm font-medium transition-all"
            >
              Watch the Orbit
            </a>
          </div>

          {/* Neo-brutalist real image asset */}
          <div className="mx-auto mt-16 max-w-[760px] border-4 border-black bg-white p-3 shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] rounded-2xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(17,17,17,1)] transition-all duration-200">
            <img 
              src="/landing-assets/hero-illustration.png" 
              alt="Neo-brutalist AI Study Hub Hero Illustration" 
              className="w-full h-auto rounded-lg border-2 border-black" 
            />
          </div>
        </section>

        {/* Bento grid */}
        <section id="dashboard" className="mx-auto w-[min(100%,1440px)] px-5 lg:px-[120px]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:auto-rows-[280px]">

            {/* Research — col-span-8 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-sapphire lp-premium-card group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 lg:col-span-8 lg:p-12"
              data-depth="0.1"
            >
              <div className="relative z-10">
                <span className="lp-soft-icon mb-8">
                  <Brain aria-hidden="true" />
                </span>
                <h2 className="m-0 mb-4 text-[32px] font-light leading-[1.2] tracking-[0.03em]">AI-Powered Research</h2>
                <p className="m-0 max-w-[410px] text-base leading-[1.6] text-muted-foreground">
                  Our neural engine synthesizes millions of academic papers into coherent
                  summaries, highlighting hidden connections across disciplines.
                </p>
              </div>
              <div className="lp-constellation-visual" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            </article>

            {/* Cloud — col-span-4 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-gold lp-premium-card flex min-h-[280px] flex-col justify-between rounded-[28px] p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 lg:col-span-4 lg:p-10"
              data-depth="0.2"
            >
              <span className="lp-soft-icon">
                <Cloud aria-hidden="true" />
              </span>
              <div className="lp-sync-visual" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div>
                <h2 className="m-0 mb-4 text-[24px] font-light leading-[1.2]">Cloud Synced Library</h2>
                <p className="m-0 text-sm leading-[1.6] text-muted-foreground">
                  Your entire intellectual universe, synchronized across every device in the void.
                </p>
              </div>
            </article>

            {/* Semantic — col-span-4 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-violet lp-premium-card flex min-h-[280px] flex-col justify-between rounded-[28px] p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 lg:col-span-4 lg:p-10"
              data-depth="0.15"
            >
              <div>
                <span className="lp-soft-icon mb-8">
                  <GitBranch aria-hidden="true" />
                </span>
                <h2 className="m-0 mb-4 text-[24px] font-light leading-[1.2]">Semantic Insights</h2>
              </div>
              <div className="lp-node-visual" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="m-0 text-sm leading-[1.6] text-muted-foreground">
                Discover the &quot;why&quot; behind the data through our advanced contextual mapping engine.
              </p>
            </article>

            {/* Interface — col-span-8 */}
            <article
              className="lp-parallax-layer celestial-card tone-surface tone-sapphire lp-premium-card group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] p-8 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 lg:col-span-8 lg:p-10"
              data-depth="0.05"
            >
              <div className="relative z-10">
                <span className="lp-soft-icon mb-8">
                  <Monitor aria-hidden="true" />
                </span>
                <h2 className="m-0 mb-2 text-[24px] font-light leading-[1.2]">The Void Interface</h2>
                <p className="m-0 text-sm text-muted-foreground">Zero-distraction workspace designed for deep focus sessions.</p>
              </div>
              <div className="lp-interface-visual" aria-hidden="true">
                <div>
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  {Array.from({ length: 18 }).map((_, index) => (
                    <span key={index} />
                  ))}
                </div>
                <div>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>

          </div>
        </section>

        {/* Stats */}
        <section
          id="about"
          className="mx-auto mt-32 w-[min(100%,1440px)] border-y border-border/60 px-5 py-20 lg:px-[120px]"
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
        <div className="mx-auto flex w-[min(100%,1440px)] flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center lg:px-[120px]">
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


