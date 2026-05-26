import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart2,
  FileCog,
  LayoutDashboard,
  Library,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import CelestialBackdrop from '@/src/components/shared/CelestialBackdrop'
import { getStoredUser } from '@/src/services/authStorage'
import { cn } from '@/lib/utils'

type AppSidebarLayoutProps = {
  children: ReactNode
}

function MobileAppNav() {
  const { pathname } = useLocation()
  const isAdmin = getStoredUser()?.role === 'admin' || pathname.startsWith('/admin')

  const items = isAdmin
    ? [
        { href: '/admin', icon: ShieldCheck, label: 'Admin' },
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/documents', icon: FileCog, label: 'Docs' },
        { href: '/admin/activity', icon: Activity, label: 'Activity' },
      ]
    : [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { href: '/library', icon: Library, label: 'Library' },
        { href: '/aichatbox', icon: MessageSquare, label: 'Chat' },
        { href: '/evaluation', icon: BarChart2, label: 'Eval' },
      ]

  return (
    <nav
      aria-label="Mobile app navigation"
      className="fixed inset-x-3 bottom-3 z-50 md:hidden"
    >
      <div className="celestial-card tone-surface tone-sapphire grid grid-cols-5 items-center gap-1 px-2 py-2 shadow-2xl backdrop-blur">
        <SidebarTrigger className="h-12 w-full rounded-xl border border-border/70 bg-card/55 text-foreground" />
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-1 text-[0.66rem] font-semibold text-muted-foreground transition-colors',
                isActive
                  ? 'border-primary/35 bg-primary/15 text-primary shadow-[inset_0_2px_0_var(--accent-gold)]'
                  : 'hover:border-border/80 hover:bg-muted/45 hover:text-foreground',
              )}
              key={item.href}
              to={item.href}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function AppSidebarLayout({ children }: AppSidebarLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <CelestialBackdrop intensity="dramatic" />
        <AppSidebar />
        <SidebarInset className="relative z-10 min-h-svh w-0 min-w-0 flex-1 overflow-hidden bg-transparent">
          {children}
        </SidebarInset>
        <MobileAppNav />
      </SidebarProvider>
    </TooltipProvider>
  )
}
