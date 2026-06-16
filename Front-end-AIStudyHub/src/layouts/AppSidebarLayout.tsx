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
      <div className="grid grid-cols-5 items-center gap-1 rounded-xl border border-border bg-card px-2 py-2 ">
        <SidebarTrigger className="h-11 w-full rounded-lg border border-border bg-card text-foreground" />
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-1 text-[0.66rem] font-medium text-muted-foreground transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
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
        <AppSidebar />
        <SidebarInset className="relative z-10 min-h-svh w-0 min-w-0 flex-1 overflow-hidden bg-background">
          {children}
        </SidebarInset>
        <MobileAppNav />
      </SidebarProvider>
    </TooltipProvider>
  )
}
