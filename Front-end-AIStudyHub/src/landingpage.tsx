import { useEffect, useRef } from 'react'

const stats = [
  ['12M+', 'Papers Indexed'],
  ['800K', 'Active Researchers'],
  ['99.9%', 'Uptime Library'],
  ['142', 'Academic Partners'],
]


export default function LandingPage() {
  const starContainerRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const createShootingStar = () => {
      const container = starContainerRef.current
      if (!container) return

      const star = document.createElement('div')
      star.className = 'lp-shooting-star'
      star.style.left = `${Math.random() * window.innerWidth + 500}px`
      star.style.top = `${Math.random() * window.innerHeight - 200}px`
      star.style.animationDuration = `${Math.random() * 2 + 1}s`
      star.style.opacity = `${Math.random()}`

      container.appendChild(star)
      window.setTimeout(() => star.remove(), 3000)
    }

    const starInterval = window.setInterval(createShootingStar, 1500)

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
        window.scrollY > 50 ? 'rgba(0, 0, 0, 0.8)' : 'transparent'
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.clearInterval(starInterval)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="relative isolate min-h-svh text-[#e5e2e1] bg-transparent overflow-x-hidden font-[Manrope,system-ui,sans-serif] tracking-[0.01em]">
      {/* Galaxy background */}
      <div className="lp-galaxy-bg" aria-hidden="true">
        <div className="lp-spiral-container" />
        <div ref={starContainerRef} id="shooting-stars-container" />
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="fixed top-0 z-50 w-full border-b border-white/10 backdrop-blur-[24px] transition-colors duration-[180ms]"
      >
        <div className="flex items-center justify-between w-[min(100%,1440px)] h-20 mx-auto px-20">
          <div className="text-white text-[32px] font-light leading-[1.2] tracking-[-0.02em]">AI Study Hub</div>
          <div className="flex items-center gap-10">
            {['#dashboard', '#about'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase hover:text-white transition-colors"
              >
                {['Dashboard', 'About Us'][i]}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/login"
              className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase hover:text-white transition-colors bg-transparent p-0"
            >
              Login
            </a>
            <a
              href="/register"
              className="lp-pulsing-btn inline-flex items-center justify-center min-h-[46px] rounded-full px-8 text-[#2f3131] bg-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-white/90 transition-all"
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="relative pt-32 pb-24">

        {/* Hero */}
        <section className="w-[min(100%,1440px)] mx-auto mb-24 px-20 text-center">
          <div className="inline-block mb-8 px-4 py-1 border border-white/10 rounded-full bg-white/5 backdrop-blur-[8px]">
            <span className="text-white/60 text-xs font-semibold tracking-[0.15em] uppercase">
              The Future of Intellectual Astronomy
            </span>
          </div>
          <h1 className="m-0 mb-8 text-white text-[64px] font-[200] leading-[1.1] tracking-[0.05em] lp-stellar-text-glow">
            Navigate the Cosmos <br /> of Knowledge
          </h1>
          <p className="w-[min(100%,672px)] mx-auto mb-12 text-[#c4c7c8] text-lg leading-[1.6]">
            An ethereal platform where AI acts as your celestial guide, transforming vast
            expanses of information into structured constellations of insight.
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="/register"
              className="lp-pulsing-btn inline-flex items-center justify-center min-h-[56px] rounded-full px-10 text-[#2f3131] bg-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-white/90 transition-all"
            >
              Start Exploration
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center min-h-[56px] rounded-full px-10 text-white border border-white/20 bg-transparent text-xs font-semibold tracking-[0.15em] uppercase hover:bg-white/5 transition-all"
            >
              Watch the Orbit
            </a>
          </div>
        </section>

        {/* Bento grid */}
        <section id="dashboard" className="w-[min(100%,1440px)] mx-auto px-20">
          <div className="grid grid-cols-12 auto-rows-[280px] gap-6">

            {/* Research — col-span-8 */}
            <article
              className="col-span-8 relative flex flex-col justify-between overflow-hidden p-12 rounded-3xl group border border-white/10 bg-white/[0.03] backdrop-blur-[20px] hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lp-parallax-layer"
              data-depth="0.1"
            >
              <div className="relative z-10">
                <span className="material-symbols-outlined text-white text-4xl mb-6 block">psychology</span>
                <h2 className="m-0 mb-4 text-white text-[32px] font-light leading-[1.2] tracking-[0.03em]">AI-Powered Research</h2>
                <p className="max-w-[448px] m-0 text-[#c4c7c8] text-base leading-[1.6]">
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
              className="col-span-4 flex flex-col justify-end p-10 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[20px] hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lp-parallax-layer"
              data-depth="0.2"
            >
              <span className="material-symbols-outlined text-white text-4xl mb-6 block">cloud_sync</span>
              <h2 className="m-0 mb-4 text-white text-[24px] font-light leading-[1.2]">Cloud Synced Library</h2>
              <p className="m-0 text-[#c4c7c8] text-sm leading-[1.6]">
                Your entire intellectual universe, synchronized across every device in the void.
              </p>
            </article>

            {/* Semantic — col-span-4 */}
            <article
              className="col-span-4 flex flex-col justify-between p-10 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-[20px] hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lp-parallax-layer"
              data-depth="0.15"
            >
              <div>
                <span className="material-symbols-outlined text-white text-4xl mb-6 block">hub</span>
                <h2 className="m-0 mb-4 text-white text-[24px] font-light leading-[1.2]">Semantic Insights</h2>
              </div>
              <p className="m-0 text-[#c4c7c8] text-sm leading-[1.6]">
                Discover the &quot;why&quot; behind the data through our advanced contextual mapping engine.
              </p>
            </article>

            {/* Interface — col-span-8 */}
            <article
              className="col-span-8 relative overflow-hidden rounded-3xl group border border-white/10 bg-white/[0.03] backdrop-blur-[20px] hover:border-white/30 hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lp-parallax-layer"
              data-depth="0.05"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-10 left-10 z-20">
                <h2 className="m-0 mb-2 text-white text-[24px] font-light leading-[1.2]">The Void Interface</h2>
                <p className="m-0 text-[#c4c7c8] text-sm">Zero-distraction workspace designed for deep focus sessions.</p>
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
          className="w-[min(100%,1440px)] mx-auto px-20 mt-32 py-20 border-t border-b border-white/[0.05]"
        >
          <div className="grid grid-cols-4 gap-6 text-center">
            {stats.map(([value, label]) => (
              <div key={label}>
                <div className="mb-2 text-white text-[32px] font-[200] leading-[1.1] tracking-[0.05em]">{value}</div>
                <span className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-32 px-5 text-center">
          <div className="relative overflow-hidden w-[min(100%,896px)] mx-auto p-20 rounded-[48px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px]">
            <div className="relative z-10">
              <h2 className="m-0 mb-6 text-white text-[48px] font-[200] leading-[1.1] tracking-[0.05em]">Ready to transcend?</h2>
              <p className="max-w-[480px] mx-auto mb-12 text-[#c4c7c8] text-lg leading-[1.6]">
                Join the scholars who have already claimed their place in the intellectual cosmos.
              </p>
              <a
                href="/register"
                className="lp-pulsing-btn inline-flex items-center justify-center min-h-[56px] rounded-full px-10 text-[#2f3131] bg-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-white/90 transition-all"
              >
                Claim Your Domain
              </a>
            </div>
            <div className="absolute inset-0 pointer-events-none bg-white/[0.05] lp-soft-pulse" />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full pt-12 pb-12 border-t border-white/[0.05]">
        <div className="flex items-center justify-between w-[min(100%,1440px)] mx-auto gap-6 px-20">
          <div className="text-white font-bold text-xs tracking-[0.15em] uppercase">AI Study Hub</div>
          <div className="flex items-center gap-10">
            {['#privacy', '#terms', '#contact'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase hover:text-white transition-colors"
              >
                {['Privacy Policy', 'Terms of Service', 'Contact'][i]}
              </a>
            ))}
          </div>
          <div className="text-[#c4c7c8] text-xs font-semibold tracking-[0.15em] uppercase">
            &copy; 2024 AI Study Hub. Intellectual Astronomy.
          </div>
        </div>
      </footer>
    </div>
  )
}


