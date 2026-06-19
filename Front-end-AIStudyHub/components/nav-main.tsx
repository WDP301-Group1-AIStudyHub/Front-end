import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: ReactNode
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title} className="relative">
          {item.isActive && (
            <motion.div
              layoutId="active-indicator"
              className="absolute bottom-2 left-1 top-2 z-20 w-1 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <SidebarMenuButton asChild isActive={item.isActive} className="pl-4 transition-all active:scale-[0.98]">
            <Link to={item.url}>
              {item.icon}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
