interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { icon: 'dashboard',    label: 'Dashboard', path: '/dashboard' },
  { icon: 'menu_book',    label: 'Library',   path: '/library'   },
  { icon: 'auto_awesome', label: 'AI Chatbox',  path: '/aichatbox'  },
  { icon: 'insights',     label: 'Insights',  path: '/insights'  },
  { icon: 'settings',     label: 'Settings',  path: '/settings'  },
]

export default function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const activePath = window.location.pathname

  return (
    <aside
      className={`flex-shrink-0 h-screen flex flex-col items-center py-8 border-r border-white/10 bg-[rgba(19,19,19,0.2)] backdrop-blur-[24px] z-50 relative overflow-hidden transition-[width] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'w-20' : 'w-56'}`}
    >
      {/* Toggle chevron */}
      <button
        className="absolute top-2.5 right-1.5 w-[22px] h-[22px] p-0 flex items-center justify-center bg-transparent border-none cursor-pointer text-white/40 rounded hover:text-white hover:bg-white/[0.06] transition-colors z-[1]"
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span
          className={`material-symbols-outlined text-[18px] transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? '' : 'rotate-180'}`}
          style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
        >
          chevron_right
        </span>
      </button>

      {/* Brand mark */}
      <div className={`flex items-center flex-shrink-0 mb-12 transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'justify-center' : 'justify-start px-3'}`}>
        {collapsed ? (
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-lg font-semibold text-white tracking-[0.2em] uppercase">
            A
          </div>
        ) : (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight tracking-[0.05em] whitespace-nowrap">AI Study Hub</p>
            <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase whitespace-nowrap">Scholarly Universe</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-8 w-full items-center">
        {navItems.map(item => {
          const isActive = activePath === item.path
          return (
            <button
              key={item.icon}
              title={item.label}
              onClick={() => { window.location.href = item.path }}
              className={`w-full py-2 flex items-center gap-0 bg-transparent border-none border-r-2 font-medium cursor-pointer transition-all duration-300 whitespace-nowrap overflow-hidden hover:bg-white/5 active:scale-95 ${collapsed ? 'justify-center px-0' : 'justify-start px-5 gap-3'} ${isActive ? 'text-white font-bold border-r-white' : 'text-[rgba(196,199,200,0.6)] border-r-transparent hover:text-[#e5e2e1]'}`}
            >
              <span
                className="material-symbols-outlined text-[24px] flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
              >
                {item.icon}
              </span>
              <span
                className={`text-[13px] font-medium tracking-[0.04em] overflow-hidden transition-[max-width,opacity] duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex flex-col items-center gap-6 w-full pb-4">
        <button
          className="relative w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden cursor-pointer bg-transparent p-0 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
          title="User Profile"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
            alt="User Avatar"
            className="block w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-white/[0.05] opacity-0 hover:opacity-100 transition-opacity" />
        </button>
        <button
          className="flex bg-transparent border-none cursor-pointer text-[rgba(196,199,200,0.6)] opacity-60 hover:opacity-100 transition-opacity p-0"
          title="Support"
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
          >
            help_outline
          </span>
        </button>
        <button
          className="flex bg-transparent border-none cursor-pointer text-[rgba(196,199,200,0.6)] opacity-60 hover:opacity-100 transition-opacity p-0"
          title="Sign Out"
          onClick={() => { window.location.href = '/login' }}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24" }}
          >
            logout
          </span>
        </button>
      </div>
    </aside>
  )
}
