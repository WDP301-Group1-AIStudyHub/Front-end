"use client"

import * as React from "react"
import {
  Activity,
  FileCog,
  LayoutDashboardIcon,
  LibraryIcon,
  MessagesSquareIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavChats } from "@/components/nav-chats"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import ThemeToggle from "@/src/components/shared/ThemeToggle"
import { logout } from "@/src/services/authApi"
import { getStoredUser } from "@/src/services/authStorage"

const recentChats = [
  { name: "Dark Matter & Rotation Curves", url: "/aichatbox", emoji: "*" },
  { name: "Quantum Entanglement Basics", url: "/aichatbox", emoji: "*" },
  { name: "Neural Network Architecture", url: "/aichatbox", emoji: "*" },
  { name: "Exoplanet Atmosphere Analysis", url: "/aichatbox", emoji: "*" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activePath = window.location.pathname
  const storedUser = getStoredUser()
  const isAdmin = storedUser?.role === "admin"
  const user = {
    avatar: storedUser?.avatar || "https://i.pravatar.cc/150?img=3",
    email: storedUser?.email || "john.doe@example.com",
    name: storedUser?.fullName || "John Doe",
  }

  const baseNav = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: activePath === "/dashboard",
    },
    {
      title: "Library",
      url: "/library",
      icon: <LibraryIcon />,
      isActive: activePath === "/library" || activePath === "/new-library",
    },
    {
      title: "AI Chatbox",
      url: "/aichatbox",
      icon: <MessagesSquareIcon />,
      isActive: activePath === "/aichatbox" || activePath === "/new-aichatbox",
    },
  ]

  const adminNav = [
    {
      title: "Admin Dashboard",
      url: "/admin",
      icon: <ShieldCheck />,
      isActive: activePath === "/admin",
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: <Users />,
      isActive: activePath === "/admin/users",
    },
    {
      title: "Documents Metadata",
      url: "/admin/documents",
      icon: <FileCog />,
      isActive: activePath === "/admin/documents",
    },
    {
      title: "System Activity",
      url: "/admin/activity",
      icon: <Activity />,
      isActive: activePath === "/admin/activity",
    },
  ]

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <a className="flex min-w-0 items-center gap-2" href="/dashboard">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-sidebar-border bg-sidebar-accent text-sidebar-primary">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate font-bold tracking-tight">AI Study Hub</span>
          </a>
          <ThemeToggle compact />
        </div>
        <NavMain items={isAdmin ? adminNav : baseNav} />
      </SidebarHeader>
      <SidebarContent>
        {!isAdmin && <NavChats recentChats={recentChats} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
