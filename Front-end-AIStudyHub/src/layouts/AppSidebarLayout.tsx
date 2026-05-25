import type { ReactNode } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

type AppSidebarLayoutProps = {
  children: ReactNode
}

export default function AppSidebarLayout({ children }: AppSidebarLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-svh w-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
