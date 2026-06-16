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
  Users,
} from "lucide-react"

import { useNavigate, useLocation, Link } from "react-router-dom"
import { NavMain } from "@/components/nav-main"
import { NavChats } from "@/components/nav-chats"
import { NavUser } from "@/components/nav-user"
import { groupBySession } from "@/src/lib/groupChatHistory"
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
import { deleteChatHistory, getChatHistory } from "@/src/services/chatApi"

export interface ChatSessionItem {
  id: string
  name: string
  url: string
            emoji: "",
  dateLabel: string
  itemIds: string[]
}

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

  // Real chat history — grouped into sessions
  const [chatSessions, setChatSessions] = React.useState<ChatSessionItem[]>([])

  React.useEffect(() => {
    if (isAdmin) return
    getChatHistory()
      .then((items) =>
        setChatSessions(
          groupBySession(items).map((g) => ({
            id: g.id,
            name: g.name,
            url: `/aichatbox?sessionIds=${g.itemIds.join(",")}`,
            emoji: "",
            dateLabel: g.dateLabel,
            itemIds: g.itemIds,
          })),
        ),
      )
      .catch(() => setChatSessions([]))
  }, [isAdmin])

  const handleDeleteChat = async (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId)
    if (!session) return
    const itemIds = session.itemIds
    try {
      await Promise.all(itemIds.map((id) => deleteChatHistory(id)))
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
        <div className="flex items-center justify-between gap-2 px-2 py-2">
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
