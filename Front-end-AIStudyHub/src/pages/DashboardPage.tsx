import { useState, useEffect } from 'react'
import GalaxyBackground from '../components/shared/GalaxyBackground'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'

/* ── Static data ──────────────────────────────────────── */
const recentFiles = [
  { name: 'Quantum Entanglement Patterns.pdf',   modified: '2h ago',        subject: 'Physics'        },
  { name: 'Neural Network Topologies.epub',      modified: '5h ago',        subject: 'AI Research'    },
  { name: 'Global Economic Shifts 2025.pdf',     modified: 'Yesterday',     subject: 'Macroeconomics' },
  { name: 'Metaphysics of Digital Reality.docx', modified: '2 days ago',    subject: 'Philosophy'     },
]

const subjects = [
  { name: 'Theoretical Physics', count: 124 },
  { name: 'Neural Engineering',  count: 89  },
  { name: 'Ethics in AI',        count: 56  },
  { name: 'Astro-Biology',       count: 42  },
  { name: 'Quantum Computing',   count: 31  },
]

/* ── Page ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(true)

  /* Mouse ripple */
  useEffect(() => {
    const createRipple = (x: number, y: number) => {
      const el = document.createElement('div')
      el.className = 'db-ripple'
      el.style.left = `${x}px`
      el.style.top  = `${y}px`
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 1200)
    }
    const onMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.95) createRipple(e.clientX, e.clientY)
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  /* glass card base */
  const glass = 'bg-[#0C0C0C] backdrop-blur-[20px] border border-white/10 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#141414] hover:border-white/30 hover:-translate-y-2 hover:scale-[1.02]'

  const msIcon = (name: string, fill = 0) => (
    <span
      className="material-symbols-outlined select-none leading-none"
      style={{ fontVariationSettings: `'FILL' ${fill},'wght' 300,'GRAD' 0,'opsz' 24` }}
    >
      {name}
    </span>
  )

  return (
    /*
     * isolate  → creates a stacking context so the GalaxyBackground
     *            (position:fixed; z-index:-1) sits at the bottom of
     *            THIS context and shows through transparent layers.
     * No bg-*  → transparent so the galaxy radial-gradient is visible.
     */
    <div className="isolate flex h-screen overflow-hidden text-[#e5e2e1]">
      <GalaxyBackground />

      {/* Ambient center glow — same as galaxy-bg in HTML template */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 65%)' }}
      />

      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* ── Main — single screen, no scroll ─────────────── */}
      <main className="relative z-[1] flex-1 h-screen overflow-hidden flex flex-col p-5 gap-4">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between pt-1">
          <div>
            <h1 className="text-[42px] font-[200] leading-[1.1] tracking-[0.04em] text-white m-0 lp-stellar-text-glow">
              Commander's Deck
            </h1>
            <p className="text-xs text-white/40 m-0 mt-1">
              Your scholarly universe, synchronized across the dark expanse of information.
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
            {msIcon('notifications')}
          </button>
        </header>

        {/* Content grid — 3 rows that fill remaining height */}
        <div
          className="flex-1 min-h-0 grid grid-cols-12 gap-4"
          style={{ gridTemplateRows: '1.2fr 2fr auto' }}
        >

          {/* ── Row 1 ─────────────────────────────────────── */}

          {/* Storage */}
          <div className={`${glass} col-span-4 p-6 flex flex-col justify-between overflow-hidden`}>
            <div className="flex justify-between items-start">
              <span className="text-white/30 text-[20px]">{msIcon('data_usage')}</span>
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30">Storage</span>
            </div>
            <div>
              <p className="text-[30px] font-[200] leading-[1] text-white m-0 mb-1">1.2 GB</p>
              <p className="text-xs m-0 text-white/40">of 10 GB limit used</p>
            </div>
            <div className="w-full h-px bg-white/[0.06] relative mt-1">
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: '12%' }} />
            </div>
          </div>

          {/* Zenith AI */}
          <div className={`${glass} col-span-8 p-6 relative overflow-hidden cursor-pointer group`}>
            {/* hover glow blob */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
              />
            </div>
            <div className="relative z-[1] h-full flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white text-[18px]">{msIcon('auto_awesome', 1)}</span>
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white">Zenith Intelligence</span>
              </div>
              <h2 className="text-[19px] font-light leading-[1.35] text-white m-0 max-w-[460px]">
                Transcend with AI: Interrogate your entire research library.
              </h2>
              <div className="flex items-center gap-4">
                <button className="px-5 py-2 bg-white text-[#131313] rounded-full text-[10px] font-semibold tracking-[0.15em] uppercase flex-shrink-0 border-none cursor-pointer transition-transform group-hover:scale-105">
                  Initiate Dialogue
                </button>
                <span className="text-xs text-white/40 italic">Searching 432 archived papers...</span>
              </div>
            </div>
          </div>

          {/* ── Row 2 ─────────────────────────────────────── */}

          {/* Recent Archives */}
          <div className={`${glass} col-span-8 p-6 flex flex-col overflow-hidden`}>
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-[15px] font-light text-white m-0 tracking-[0.03em]">Recent Archives</h3>
              <button className="bg-transparent border-none cursor-pointer text-white/40 text-[10px] font-semibold tracking-[0.15em] uppercase hover:text-white transition-colors p-0">
                View All
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col justify-between">
              {recentFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center py-2.5 px-2 -mx-2 border-b border-white/[0.04] last:border-b-0 rounded-lg cursor-pointer hover:bg-white/[0.04] group transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-white/30 flex-shrink-0 text-[18px]">{msIcon('description')}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-white m-0 truncate group-hover:translate-x-0.5 transition-transform">{file.name}</p>
                      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30 mt-0.5 m-0">{file.modified}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-white/30 flex-shrink-0 mx-4">{file.subject}</div>
                  <div className="text-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-[18px]">{msIcon('more_horiz')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0 overflow-hidden">

            {/* Upload */}
            <div className={`${glass} hover:!border-white/40 p-5 flex items-center justify-between cursor-pointer group flex-shrink-0`}>
              <div>
                <h4 className="text-[14px] font-light text-white m-0 mb-0.5">Sync Documents</h4>
                <p className="text-xs text-white/40 m-0">Upload to library</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 text-[18px] transition-all group-hover:bg-white group-hover:text-[#131313]">
                {msIcon('upload')}
              </div>
            </div>

            {/* Subject clusters */}
            <div className={`${glass} p-5 flex-1 flex flex-col min-h-0 overflow-hidden`}>
              <span className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-3 flex-shrink-0">
                Subject Clusters
              </span>
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {subjects.map(s => (
                  <div key={s.name} className="flex items-center justify-between py-0.5 cursor-pointer hover:text-white/80 transition-colors group">
                    <span className="text-sm text-white group-hover:translate-x-0.5 transition-transform">{s.name}</span>
                    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">{s.count}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full py-2 rounded-xl border border-white/[0.06] bg-transparent cursor-pointer text-[10px] font-semibold tracking-[0.15em] uppercase text-white/50 hover:text-white hover:bg-white/[0.04] transition-all flex-shrink-0">
                Explore All Clusters
              </button>
            </div>

          </div>

          {/* ── Row 3: Insight bar (auto height) ──────────── */}
          <div className={`${glass} col-span-12 p-4 flex justify-between items-center gap-4 opacity-70 hover:opacity-100 transition-opacity`}>
            <div className="flex items-center gap-3">
              <div className="db-pulse-dot flex-shrink-0" />
              <p className="text-xs italic m-0 text-white/70">
                "The library grows at 4.2 documents per day. Deep analysis recommended for Recent Archives."
              </p>
            </div>
            <div className="flex items-center gap-8 flex-shrink-0">
              <div className="text-center">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-0.5 m-0">Uptime</p>
                <p className="text-xs m-0">99.98%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30 mb-0.5 m-0">Neural Sync</p>
                <p className="text-xs m-0">Active</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white text-[#131313] border-none cursor-pointer flex items-center justify-center shadow-[0_20px_40px_-8px_rgba(0,0,0,0.8)] z-50 hover:scale-110 active:scale-95 transition-transform text-[20px]"
        title="New Document"
      >
        {msIcon('add', 1)}
      </button>
    </div>
  )
}
