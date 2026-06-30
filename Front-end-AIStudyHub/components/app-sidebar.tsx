"use client"

import * as React from "react"
import {
  Activity,
  BookMarked,
  Brain,
  FileCog,
  LayoutDashboardIcon,
  LibraryIcon,
  MessagesSquareIcon,
  ShieldCheck,
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
import BrandLogo from "@/src/components/shared/BrandLogo"
import { logout } from "@/src/services/authApi"
import { getStoredUser } from "@/src/services/authStorage"
import { deleteChatThread, listChatThreads } from "@/src/services/chatApi"

export interface ChatSessionItem {
  id: string
  name: string
  url: string
  emoji: string
  dateLabel: string
  itemIds: string[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate()
  const { pathname: activePath } = useLocation()
  const storedUser = getStoredUser()
  const isAdmin = storedUser?.role === "admin"
  const user = {
    avatar: storedUser?.avatar,
    email: storedUser?.email || "john.doe@example.com",
    name: storedUser?.fullName || "John Doe",
  }

  // Real chat threads from the backend.
  const [chatSessions, setChatSessions] = React.useState<ChatSessionItem[]>([])

  React.useEffect(() => {
    if (isAdmin) return
    const loadThreads = () => {
      listChatThreads()
        .then((threads) =>
        setChatSessions(
          threads.map((thread) => ({
            id: thread.id,
            name: thread.title,
            url: `/aichatbox?threadId=${thread.id}`,
            emoji: "",
            dateLabel: new Date(thread.lastMessageAt).toLocaleDateString(),
            itemIds: [thread.id],
          })),
        )
      )
        .catch(() => setChatSessions([]))
    }

    loadThreads()
    window.addEventListener("chat-threads:refresh", loadThreads)
    return () => window.removeEventListener("chat-threads:refresh", loadThreads)
  }, [isAdmin])

  const handleDeleteChat = async (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId)
    if (!session) return
    try {
      await deleteChatThread(session.id)
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
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
      isActive:
        activePath === "/library" ||
        activePath === "/new-library" ||
        activePath.startsWith("/documents/"),
    },
    {
      title: "Subjects",
      url: "/subjects",
      icon: <BookMarked />,
      isActive: activePath === "/subjects",
    },
    {
      title: "Study Materials",
      url: "/study-materials",
      icon: <Brain />,
      isActive: activePath === "/study-materials" || activePath.startsWith("/library/study/"),
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
    navigate('/login', { replace: true })
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="gap-4 p-3">
        <div className="flex items-center justify-between gap-2 rounded-[18px] border border-sidebar-border bg-card/60 px-3 py-3">
          <Link className="min-w-0" to="/dashboard">
            <BrandLogo />
          </Link>
        </div>
        <NavMain items={isAdmin ? adminNav : baseNav} />
      </SidebarHeader>
      <SidebarContent>
      {!isAdmin && <NavChats onDelete={handleDeleteChat} recentChats={chatSessions} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
