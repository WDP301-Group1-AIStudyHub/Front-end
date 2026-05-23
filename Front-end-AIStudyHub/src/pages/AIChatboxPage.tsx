import { useState, useEffect, useRef } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'

/* ── Celestial background (parallax + nebulas + shooting stars) ── */
function ChatStarfieldBg() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const starMeta: Array<{ el: HTMLDivElement; z: number }> = []
    const created: HTMLDivElement[] = []

    // ── Stars ─────────────────────────────────────────────
    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div')
      star.className = 'chat-star'
      const size = Math.random() * 2 + 0.5
      const x    = Math.random() * 100
      const y    = Math.random() * 100
      const z    = Math.random() * 1.5 + 0.5
      star.style.width  = `${size}px`
      star.style.height = `${size}px`
      star.style.left   = `${x}%`
      star.style.top    = `${y}%`
      if (Math.random() > 0.3) {
        const dur   = Math.random() * 3 + 2
        const delay = Math.random() * 5
        star.style.animation = `lib-twinkle ${dur}s ${delay}s infinite ease-in-out`
      }
      starMeta.push({ el: star, z })
      created.push(star)
      container.appendChild(star)
    }

    // ── Parallax ──────────────────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      const mx = (e.clientX - window.innerWidth  / 2) * 0.01
      const my = (e.clientY - window.innerHeight / 2) * 0.01
      starMeta.forEach(({ el, z }) => {
        const f = z * 15
        el.style.transform = `translate(${mx * f}px, ${my * f}px)`
      })
      container.querySelectorAll<HTMLElement>('.chat-nebula').forEach((neb, idx) => {
        const d = (idx + 1) * 0.02
        neb.style.transform = `translate(${mx * d * 100}px, ${my * d * 100}px)`
      })
    }
    document.addEventListener('mousemove', handleMouseMove)

    // ── Shooting stars ────────────────────────────────────
    let shootTimeout: ReturnType<typeof setTimeout>
    const spawnStar = () => {
      const s = document.createElement('div')
      s.className = 'chat-shooting-star'
      s.style.left = `${Math.random() * window.innerWidth + 200}px`
      s.style.top  = `${Math.random() * (window.innerHeight / 2)}px`
      s.style.animation = 'chat-shoot 1.5s cubic-bezier(0.16,1,0.3,1) forwards'
      container.appendChild(s)
      setTimeout(() => s.remove(), 2000)
    }
    const schedule = () => {
      shootTimeout = setTimeout(() => { spawnStar(); schedule() }, Math.random() * 15000 + 5000)
    }
    schedule()

    return () => {
      created.forEach(s => s.remove())
      document.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(shootTimeout)
    }
  }, [])

  return (
    <div className="chat-starfield" ref={containerRef} aria-hidden="true">
      <div className="chat-nebula" style={{ top: '-10%', left: '10%' }} />
      <div className="chat-nebula" style={{ bottom: '0%', right: '-10%' }} />
    </div>
  )
}

/* ── Static data ──────────────────────────────────────── */
const chatHistory = [
  { id: 1, title: 'Dark Matter & Rotation Curves',    time: '2 min ago',  active: true  },
  { id: 2, title: 'Quantum Entanglement Basics',       time: '1 hour ago', active: false },
  { id: 3, title: 'Neural Network Architecture',      time: 'Yesterday',  active: false },
  { id: 4, title: 'Exoplanet Atmosphere Analysis',    time: '2 days ago', active: false },
  { id: 5, title: 'String Theory Overview',           time: '3 days ago', active: false },
  { id: 6, title: 'Planck Constant Adjustments',      time: '4 days ago', active: false },
  { id: 7, title: 'Galaxy Morphology Deep Dive',      time: '5 days ago', active: false },
]

const sourceFiles = [
  { name: 'Planck_Constant_v3.pdf',   meta: '1.2 MB • PDF',  icon: 'picture_as_pdf', color: '#ef4444', checked: true  },
  { name: 'Galaxy_Morphology.docx',   meta: '840 KB • Word', icon: 'description',   color: '#3b82f6', checked: true  },
  { name: 'Star_Density_Mapping.csv', meta: '4.5 MB • Data', icon: 'analytics',     color: '#10b981', checked: false },
]

/* ── Page ─────────────────────────────────────────────── */
export default function AIChatboxPage() {
  const [collapsed, setCollapsed] = useState(true)
  const [msg, setMsg] = useState('')

  /* glass style — matches HTML .glass-panel */
  const cg = 'bg-white/[0.02] backdrop-blur-[24px] border border-white/[0.08] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-white/15 hover:bg-white/[0.04]'

  const icon = (name: string, cls = '') => (
    <span
      className={`material-symbols-outlined select-none leading-none ${cls}`}
      style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
    >{name}</span>
  )

  const handleMsgChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMsg(e.target.value)
    e.target.style.height = '48px'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  return (
    <div className="isolate flex h-screen overflow-hidden text-[#e5e2e1] font-[Manrope,system-ui,sans-serif]">
      <ChatStarfieldBg />

      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* ── Main ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center px-12 py-6 z-10">
          <span className="text-[32px] font-light tracking-[0.03em] leading-[1.2] text-white">Astraea AI</span>
          <div className="flex items-center gap-6">
            <div className="relative">
              {icon('notifications', 'text-white/60 hover:text-white cursor-pointer transition-colors')}
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
            {icon('brightness_high', 'text-white/60 hover:text-white cursor-pointer transition-colors')}
            <button className={`px-6 py-2 ${cg} rounded-full text-[11px] tracking-widest text-white hover:bg-white/10 transition-all uppercase`}>
              Upgrade
            </button>
            <div className="w-9 h-9 rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:bg-white/20 transition-all">
              U
            </div>
          </div>
        </header>

        {/* Workspace grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 px-12 pb-12 overflow-hidden min-h-0">

          {/* ── Left column ──────────────────────────────── */}
          <div className="col-span-3 flex flex-col gap-6 overflow-hidden">

            {/* Chat History */}
            <section className={`${cg} rounded-[32px] p-6 flex-1 flex flex-col overflow-hidden`}>
              <div className="flex justify-between items-center mb-5 flex-shrink-0">
                <h3 className="text-[11px] tracking-[0.2em] text-white/40 uppercase font-semibold">Chat History</h3>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest uppercase text-white/60 hover:bg-white/10 hover:text-white transition-all">
                  {icon('add', 'text-[14px]')}
                  New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {chatHistory.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-2xl cursor-pointer group transition-all ${
                      item.active
                        ? 'bg-white/8 border-r-2 border-r-white'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {icon('forum', `text-[16px] flex-shrink-0 mt-0.5 transition-colors ${
                      item.active ? 'text-white' : 'text-white/30 group-hover:text-white/60'
                    }`)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug truncate transition-colors ${
                        item.active ? 'text-white font-medium' : 'text-white/60 group-hover:text-white'
                      }`}>{item.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Source Ledger */}
            <section className={`${cg} rounded-[32px] p-8 flex-1 flex flex-col overflow-hidden`}>
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-[11px] tracking-[0.2em] text-white/40 uppercase font-semibold">Source Ledger</h3>
                {icon('upload', 'text-[20px] text-white/60 cursor-pointer hover:text-white transition-colors')}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-3">
                {sourceFiles.map(f => (
                  <div
                    key={f.name}
                    className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all ${!f.checked ? 'opacity-50 hover:opacity-100' : ''}`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{ backgroundColor: `${f.color}1a`, borderColor: `${f.color}4d` }}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: f.color, fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
                      >{f.icon}</span>
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{f.meta}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={f.checked}
                      className="rounded bg-transparent border-white/20 w-4 h-4 cursor-pointer accent-white"
                    />
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ── Chat column ──────────────────────────────── */}
          <div className={`col-span-9 flex flex-col ${cg} rounded-[32px] overflow-hidden`}>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12 min-h-0">

              {/* Landing state */}
              <div className="max-w-2xl mx-auto text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 animate-pulse">
                  {icon('explore', 'text-4xl text-white/40')}
                </div>
                <h2 className="text-4xl font-light mb-6 tracking-tight">Illuminate your inquiry.</h2>
                <p className="text-[18px] text-white/60 leading-relaxed">
                  Astraea is analyzing 12 sources from your{' '}
                  <span className="text-white/80 border-b border-white/20 pb-0.5">Celestial Navigation</span>{' '}
                  node. What mysteries shall we decipher today?
                </p>
              </div>

              {/* User message */}
              <div className="flex justify-end">
                <div className={`max-w-xl ${cg} px-8 py-5 rounded-[28px] rounded-tr-none bg-white/5`}>
                  <p className="text-base leading-relaxed">
                    Explain the relationship between dark matter density and the rotation curves of spiral galaxies in the Andromeda cluster.
                  </p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start">
                <div className="flex gap-5 max-w-3xl">
                  <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 self-start">
                    {icon('auto_awesome', 'text-2xl text-white')}
                  </div>
                  <div className={`${cg} px-10 py-8 rounded-[32px] rounded-tl-none bg-white/[0.02]`}>
                    <p className="text-base leading-relaxed mb-6">
                      According to the synthesized data from{' '}
                      <span className="text-blue-400 cursor-pointer hover:underline">Galaxy_Morphology.docx</span>
                      , Andromeda's rotation curves exhibit characteristic flat behavior beyond the optical disk radius.
                    </p>
                    <ul className="space-y-4 text-white/80">
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2.5 flex-shrink-0" />
                        <span className="text-sm">Baryonic matter (stars/gas) accounts for only ~12–15% of the total gravitational potential required for these velocities.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2.5 flex-shrink-0" />
                        <span className="text-sm">The NFW (Navarro–Frenk–White) density profile provides the most accurate model for the supporting dark matter halo.</span>
                      </li>
                    </ul>
                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-4 flex-wrap">
                      <span className="text-[10px] font-semibold tracking-[0.2em] text-white/30 uppercase">Grounding Sources:</span>
                      <div className="flex gap-2">
                        {['Andromeda Alpha Data', 'Node 04 Synthesis'].map(src => (
                          <span key={src} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] cursor-pointer hover:bg-white/10 transition-colors">{src}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User follow-up */}
              <div className="flex justify-end">
                <div className={`max-w-xl ${cg} px-8 py-5 rounded-[28px] rounded-tr-none bg-white/5`}>
                  <p className="text-base leading-relaxed">
                    Synthesize this with the Planck constant adjustments noted in my latest PDF.
                  </p>
                </div>
              </div>

            </div>

            {/* Input Console */}
            <div className="flex-shrink-0 p-10 border-t border-white/5 bg-[rgba(14,14,14,0.4)] backdrop-blur-[48px]">
              <div className={`max-w-4xl mx-auto flex items-end gap-5 ${cg} p-5 rounded-3xl shadow-2xl focus-within:border-white/20 hover:border-white/[0.08]`}>
                <button className="p-3 hover:bg-white/5 rounded-xl transition-colors group flex-shrink-0">
                  {icon('attach_file_add', 'text-white/60 group-hover:text-white transition-colors')}
                </button>
                <textarea
                  value={msg}
                  onChange={handleMsgChange}
                  placeholder="Consult the starlight..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder:text-white/30 py-3 resize-none overflow-hidden custom-scrollbar focus:ring-0"
                  style={{ height: '48px' }}
                />
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button className="p-3 hover:bg-white/5 rounded-xl transition-colors group">
                    {icon('mic', 'text-white/60 group-hover:text-white transition-colors')}
                  </button>
                  <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#131313] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] transition-all active:scale-95 group flex-shrink-0">
                    <span
                      className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform"
                      style={{ fontVariationSettings: "'FILL' 1,'wght' 300,'GRAD' 0,'opsz' 24" }}
                    >send</span>
                  </button>
                </div>
              </div>
              <p className="text-center text-[9px] text-white/20 mt-6 tracking-[0.3em] uppercase">
                Precision-guided AI • Intellect Astronomy Engine v4.0.2
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
