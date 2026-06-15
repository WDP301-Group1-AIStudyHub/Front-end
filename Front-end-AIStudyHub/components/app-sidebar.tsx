"use client"

import * as React from "react"
import {
  Activity,
  BarChart2,
  BookMarked,
  FileCog,
  LayoutDashboardIcon,
  LibraryIcon,
  MessagesSquareIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import { useNavigate, useLocation, Link } from "react-router-dom"
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
import { deleteChatHistory, getChatHistory } from "@/src/services/chatApi"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate()
  const { pathname: activePath } = useLocation()
  const storedUser = getStoredUser()
  const isAdmin = storedUser?.role === "admin"
  const user = {
    avatar: storedUser?.avatar || "https://i.pravatar.cc/150?img=3",
    email: storedUser?.email || "john.doe@example.com",
    name: storedUser?.fullName || "John Doe",
  }

  // Real chat history
  const [chatItems, setChatItems] = React.useState<
    { id: string; name: string; url: string; emoji: string }[]
  >([])

  React.useEffect(() => {
    if (isAdmin) return
    getChatHistory()
      .then((items) =>
        setChatItems(
          items.map((item) => ({
            id: item.id,
            name: item.question.slice(0, 60),
            url: "/aichatbox",
            emoji: "💬",
          })),
        ),
      )
      .catch(() => {
        setChatItems([])
      })
  }, [isAdmin])

  const handleDeleteChat = async (id: string) => {
    try {
      await deleteChatHistory(id)
      setChatItems((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // silently ignore
    }
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
      isActive: activePath === "/library" || activePath === "/new-library" || activePath.startsWith("/documents/"),
    },
    {
      title: "Subjects",
      url: "/subjects",
      icon: <BookMarked />,
      isActive: activePath === "/subjects",
    },
    {
      title: "AI Chatbox",
      url: "/aichatbox",
      icon: <MessagesSquareIcon />,
      isActive: activePath === "/aichatbox" || activePath === "/new-aichatbox",
    },
    {
      title: "Evaluation",
      url: "/evaluation",
      icon: <BarChart2 />,
      isActive: activePath === "/evaluation",
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
    navigate('/login', { replace: true })
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <Link className="flex min-w-0 items-center gap-2" to="/dashboard">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--accent-gold)]/40 bg-[color-mix(in_oklab,var(--accent-gold)_14%,transparent)] text-[var(--accent-gold)] shadow-[0_0_24px_color-mix(in_oklab,var(--accent-gold)_28%,transparent)]">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="celestial-title truncate font-bold tracking-tight">AI Study Hub</span>
          </Link>
          <ThemeToggle compact />
        </div>
        <NavMain items={isAdmin ? adminNav : baseNav} />
      </SidebarHeader>
      <SidebarContent>
      {!isAdmin && <NavChats onDelete={handleDeleteChat} recentChats={chatItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
