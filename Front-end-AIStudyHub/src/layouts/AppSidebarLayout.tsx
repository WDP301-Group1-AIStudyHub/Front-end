import type { ReactNode } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import CelestialBackdrop from '@/src/components/shared/CelestialBackdrop'

type AppSidebarLayoutProps = {
  children: ReactNode
}

export default function AppSidebarLayout({ children }: AppSidebarLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <CelestialBackdrop intensity="dramatic" />
        <AppSidebar />
        <SidebarTrigger className="fixed bottom-4 left-4 z-50 rounded-full border border-border bg-card/85 shadow-lg backdrop-blur md:hidden" />
        <SidebarInset className="relative z-10 min-h-svh w-0 min-w-0 flex-1 overflow-hidden bg-transparent">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
