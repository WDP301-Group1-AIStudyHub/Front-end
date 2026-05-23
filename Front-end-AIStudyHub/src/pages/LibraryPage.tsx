import { useState, useEffect, useRef } from 'react'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'

/* ── Starfield background (twinkling stars) ───────────── */
function StarfieldBg() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const created: HTMLDivElement[] = []

    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div')
      star.className = 'lib-star'
      star.style.left = `${Math.random() * 100}%`
      star.style.top  = `${Math.random() * 100}%`
      const size = Math.random() * 2 + 1
      star.style.width  = `${size}px`
      star.style.height = `${size}px`
      star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`)
      el.appendChild(star)
      created.push(star)
    }

    return () => { created.forEach(s => s.remove()) }
  }, [])

  return <div className="lib-starfield" ref={ref} aria-hidden="true" />
}

/* ── Static data ──────────────────────────────────────── */
const documents = [
  { name: 'Orbital Dynamics Analysis v2.4',         meta: 'Modified 2 hours ago',    subject: 'Astrophysics',     size: '4.2 MB',  date: 'Oct 12, 2023', icon: 'description',   color: '#4CAF50' },
  { name: 'Deep Space Neural Topologies',            meta: 'Shared with Nebula Team', subject: 'AI Research',      size: '12.8 MB', date: 'Oct 10, 2023', icon: 'menu_book',     color: '#2196F3' },
  { name: 'Void Flux Data Stream.json',              meta: 'Encrypted Dataset',       subject: 'Quantum Physics',  size: '256 KB',  date: 'Oct 08, 2023', icon: 'database',      color: '#FFC107' },
  { name: 'Atmospheric Composition - Exoplanet 9B',  meta: 'Final Review',            subject: 'Exobiology',       size: '1.5 MB',  date: 'Sep 29, 2023', icon: 'article',       color: '#F44336' },
  { name: 'Supernova Time-Lapse (Processed)',        meta: '4K Raw Data',             subject: 'Astrophotography', size: '842 MB',  date: 'Sep 24, 2023', icon: 'video_library', color: null      },
]

const recentUploads = [
  { name: 'Dark Matter Map',      by: 'Lyra V.',  time: '12 mins ago', active: true  },
  { name: 'Lunar Soil Profile',   by: 'AI-Bot 7', time: '1 hour ago',  active: false },
  { name: 'Nebula Spectrum Study',by: 'System',   time: '3 hours ago', active: false },
]

/* ── Page ─────────────────────────────────────────────── */
export default function LibraryPage() {
  const [collapsed, setCollapsed] = useState(true)

  const glass = 'bg-white/[0.03] backdrop-blur-[20px] border border-white/10 rounded-3xl'

  const icon = (name: string, cls = '') => (
    <span
      className={`material-symbols-outlined select-none leading-none ${cls}`}
      style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
    >{name}</span>
  )

  return (
    <div className="isolate flex h-screen overflow-hidden text-[#e5e2e1] font-[Manrope,system-ui,sans-serif]">
      <StarfieldBg />

      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* ── Main scrollable area ────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative z-[1]">

        {/* ── Header ───────────────────────────────────── */}
        <header className="flex justify-between items-center w-full px-20 py-8 sticky top-0 z-40 backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-1">
              Knowledge Repository
            </span>
            <h2 className="text-[32px] font-light leading-[1.2] tracking-tight text-white">
              Document Library
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 group-focus-within:text-white transition-opacity text-[20px]"
                style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
              >search</span>
              <input
                className="bg-white/[0.05] border border-white/10 rounded-full py-3 pl-12 pr-6 w-80 focus:outline-none focus:border-white/40 transition-all text-sm placeholder:text-white/40 text-white"
                placeholder="Search the void..."
                type="text"
              />
            </div>
            <button className="p-2 hover:bg-white/[0.05] rounded-full transition-colors text-white/60 hover:text-white">
              {icon('notifications')}
            </button>
            <button className="p-2 hover:bg-white/[0.05] rounded-full transition-colors text-white/60 hover:text-white">
              {icon('auto_awesome')}
            </button>
          </div>
        </header>

        {/* ── Bento content ────────────────────────────── */}
        <div className="px-20 pb-20 space-y-6">

          {/* Row 1: list (9 cols) + side panel (3 cols) */}
          <div className="grid grid-cols-12 gap-6">

            {/* ── Stellar List ─────────────────────────── */}
            <section className={`${glass} col-span-9 p-8`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  {icon('format_list_bulleted')}
                  <h3 className="text-lg font-bold">Stellar List</h3>
                </div>
                <button className="bg-white text-[#131313] px-6 py-2 rounded-full font-bold text-sm hover:opacity-80 transition-opacity flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-sm text-[#131313]"
                    style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
                  >upload</span>
                  Add New Study
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 px-4 py-3 border-b border-white/10 text-[11px] uppercase tracking-widest text-white/40 font-bold mb-4">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Subject</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Upload Date</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Document rows */}
              <div className="space-y-1">
                {documents.map(doc => (
                  <div
                    key={doc.name}
                    className="grid grid-cols-12 px-4 py-4 rounded-xl items-center cursor-pointer group hover:bg-white/[0.05] hover:translate-x-1 transition-all duration-300"
                  >
                    <div className="col-span-5 flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0 transition-colors"
                        style={doc.color
                          ? { backgroundColor: `${doc.color}1a`, borderColor: `${doc.color}66` }
                          : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                        }
                      >
                        <span
                          className="material-symbols-outlined opacity-60 text-[20px]"
                          style={{ color: doc.color ?? undefined, fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
                        >{doc.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{doc.name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{doc.meta}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-white/60">{doc.subject}</div>
                    <div className="col-span-2 text-xs text-white/60">{doc.size}</div>
                    <div className="col-span-2 text-xs text-white/60">{doc.date}</div>
                    <div className="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="material-symbols-outlined text-lg text-white/40 hover:text-white"
                        style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
                      >more_vert</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Side panel ───────────────────────────── */}
            <aside className="col-span-3 space-y-6">

              {/* Filters */}
              <div className={`${glass} p-6`}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Active Filters</h4>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['Physics', 'Large Files'].map(f => (
                    <span key={f} className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold border border-white/10 flex items-center gap-2">
                      {f}
                      <span
                        className="material-symbols-outlined text-[12px] cursor-pointer"
                        style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
                      >close</span>
                    </span>
                  ))}
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-bold text-white/40">Categories</p>
                  {[
                    { label: 'Scholarly Journals', checked: false },
                    { label: 'Raw Datasets',        checked: false },
                    { label: 'AI Annotations',      checked: true  },
                  ].map(item => (
                    <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center flex-shrink-0 ${item.checked ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/60'}`}>
                        {item.checked && (
                          <span
                            className="material-symbols-outlined text-[#131313] text-[12px]"
                            style={{ fontVariationSettings: "'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24" }}
                          >check</span>
                        )}
                      </div>
                      <span className={`text-sm transition-opacity ${item.checked ? 'text-white font-bold' : 'text-white/60 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                  <p className="text-xs font-bold text-white/40 pt-2">File Types</p>
                  {[
                    { label: 'Excel (XLSX)',     color: '#4CAF50' },
                    { label: 'PDF Documents',   color: '#F44336' },
                    { label: 'Word (DOCX)',      color: '#2196F3' },
                    { label: 'Data (JSON/CSV)', color: '#FFC107' },
                  ].map(item => (
                    <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className="w-4 h-4 rounded border flex-shrink-0 transition-colors"
                        style={{ borderColor: `${item.color}80` }}
                      />
                      <span className="text-sm text-white/60 group-hover:text-white transition-opacity">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recent uploads */}
              <div className={`${glass} p-6`}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Recent Uploads</h4>
                <div className="space-y-6">
                  {recentUploads.map(item => (
                    <div key={item.name} className="flex gap-4">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.active ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />
                      <div>
                        <p className={`text-sm font-bold leading-tight ${!item.active ? 'text-white/60' : ''}`}>{item.name}</p>
                        <p className="text-[10px] text-white/40 mt-1">Uploaded by {item.by}</p>
                        <p className="text-[10px] text-white/40">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all text-white/60 hover:text-white">
                  View All History
                </button>
              </div>

            </aside>
          </div>

          {/* Row 2: Stats (4 cols) */}
          <div className="grid grid-cols-4 gap-6">
            <div className={`${glass} p-6 flex flex-col items-center justify-center text-center`}>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Storage Used</span>
              <p className="text-3xl font-light text-white">42.8 GB</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className={`${glass} p-6 flex flex-col items-center justify-center text-center`}>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Total Studies</span>
              <p className="text-3xl font-light text-white">1,204</p>
              <p className="text-[10px] text-white/60 mt-2">+12 this week</p>
            </div>
            <div className={`${glass} p-6 flex flex-col items-center justify-center text-center`}>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">AI Citations</span>
              <p className="text-3xl font-light text-white">89%</p>
              <p className="text-[10px] text-white/60 mt-2">High accuracy rating</p>
            </div>
            <div className={`${glass} p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-colors group`}>
              {icon('star_half', 'text-4xl text-white/40 mb-2 group-hover:scale-110 transition-transform')}
              <p className="text-xs font-bold text-white/60">Go Premium</p>
              <p className="text-[10px] text-white/40">Unlock Cosmic Tier</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
