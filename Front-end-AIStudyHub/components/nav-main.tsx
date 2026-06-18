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
              className="absolute left-[-2px] top-1.5 bottom-1.5 w-1 rounded-r-md bg-primary z-20"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <SidebarMenuButton asChild isActive={item.isActive} className="transition-all active:scale-[0.98]">
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
