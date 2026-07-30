"use client"

import * as React from "react"
import {
  Activity,
  BookMarked,
  Brain,
  FileText,
  FileCog,
  FolderOpen,
  LayoutDashboardIcon,
  MessagesSquareIcon,
  ShieldCheck,
  Star,
  Trash2,
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
  useSidebar,
} from "@/components/ui/sidebar"
import BrandLogo from "@/components/shared/BrandLogo"
import { groupThreadsByDate } from "@/lib/groupChatThreads"
import { logout } from "@/services/authApi"
import { getStoredUser } from "@/services/authStorage"
import {
  deleteChatThread,
  listChatThreads,
  updateChatThread,
} from "@/services/chatApi"
import type { ChatThreadNavItem } from "@/components/nav-chats"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state: sidebarState } = useSidebar()
  const navigate = useNavigate()
  const { pathname: activePath, search } = useLocation()
  const activeSearchParams = React.useMemo(() => new URLSearchParams(search), [search])
  const activeLibraryView = activeSearchParams.get("view")
  const storedUser = getStoredUser()
  const isAdmin = storedUser?.role === "admin"
  const user = {
    avatar: storedUser?.avatar,
    email: storedUser?.email || "john.doe@example.com",
    name: storedUser?.fullName || "John Doe",
  }

  // Real chat threads from the backend.
  const [chatSessions, setChatSessions] = React.useState<ChatThreadNavItem[]>([])
  const [archivedSessions, setArchivedSessions] = React.useState<
    ChatThreadNavItem[]
  >([])
  const [archivedLoaded, setArchivedLoaded] = React.useState(false)

  const toNavItem = React.useCallback(
    (thread: { id: string; title: string; lastMessageAt: string }): ChatThreadNavItem => ({
      id: thread.id,
      title: thread.title,
      url: `/aichatbox?threadId=${thread.id}`,
      lastMessageAt: thread.lastMessageAt,
    }),
    [],
  )

  React.useEffect(() => {
    if (isAdmin) return
    const loadThreads = () => {
      listChatThreads()
        .then((threads) => setChatSessions(threads.map(toNavItem)))
        .catch(() => setChatSessions([]))
    }

    loadThreads()
    window.addEventListener("chat-threads:refresh", loadThreads)
    return () => window.removeEventListener("chat-threads:refresh", loadThreads)
  }, [isAdmin, toNavItem])

  const handleLoadArchived = async () => {
    try {
      const threads = await listChatThreads("ARCHIVED")
      setArchivedSessions(threads.map(toNavItem))
    } catch {
      setArchivedSessions([])
    } finally {
      setArchivedLoaded(true)
    }
  }

  const handleRenameChat = async (sessionId: string, title: string) => {
    const previous = chatSessions
    setChatSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title } : s)),
    )
    try {
      await updateChatThread(sessionId, { title })
    } catch {
      setChatSessions(previous)
    }
  }

  const handleArchiveChat = async (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId)
    if (!session) return
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (archivedLoaded) {
      setArchivedSessions((prev) => [session, ...prev])
    }
    try {
      await deleteChatThread(sessionId)
      // Leaving the archived thread open would 404 on the next history load.
      if (activeSearchParams.get("threadId") === sessionId) {
        navigate("/aichatbox")
      }
    } catch {
      setChatSessions((prev) =>
        [session, ...prev].sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        ),
      )
      if (archivedLoaded) {
        setArchivedSessions((prev) => prev.filter((s) => s.id !== sessionId))
      }
    }
  }

  const handleRestoreChat = async (sessionId: string) => {
    const session = archivedSessions.find((s) => s.id === sessionId)
    if (!session) return
    setArchivedSessions((prev) => prev.filter((s) => s.id !== sessionId))
    setChatSessions((prev) =>
      [session, ...prev].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      ),
    )
    try {
      await updateChatThread(sessionId, { status: "ACTIVE" })
    } catch {
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setArchivedSessions((prev) => [session, ...prev])
    }
  }

  const chatGroups = React.useMemo(
    () => groupThreadsByDate(chatSessions),
    [chatSessions],
  )

  const isDocumentNavActive =
    activePath === "/library" ||
    activePath === "/new-library" ||
    activePath === "/starred" ||
    activePath === "/trash" ||
    activePath.startsWith("/documents/")

  const baseNav = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: activePath === "/dashboard",
    },
    {
      title: "My Document",
      url: "/library",
      icon: <FolderOpen />,
      isActive: isDocumentNavActive,
      children: [
        {
          title: "My documents",
          url: "/library",
          icon: <FileText />,
          isActive:
            (activePath === "/library" || activePath === "/new-library") &&
            activeLibraryView !== "shared",
        },
        {
          title: "Shared with me",
          url: "/library?view=shared",
          icon: <Users />,
          isActive: activePath === "/library" && activeLibraryView === "shared",
        },
        {
          title: "Starred",
          url: "/starred",
          icon: <Star />,
          isActive: activePath === "/starred",
        },
        {
          title: "Trash",
          url: "/trash",
          icon: <Trash2 />,
          isActive: activePath === "/trash",
        },
      ],
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
    <Sidebar className="border-r-0" collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex min-h-11 items-center gap-2 rounded-md border border-sidebar-border bg-card px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Link className="min-w-0" to="/dashboard">
            <BrandLogo compact={sidebarState === "collapsed"} />
          </Link>
        </div>
        <NavMain items={isAdmin ? adminNav : baseNav} />
      </SidebarHeader>
      <SidebarContent>
      {!isAdmin && (
        <NavChats
          archived={archivedSessions}
          archivedLoaded={archivedLoaded}
          groups={chatGroups}
          onArchive={handleArchiveChat}
          onLoadArchived={handleLoadArchived}
          onRename={handleRenameChat}
          onRestore={handleRestoreChat}
        />
      )}
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border bg-card p-3 group-data-[collapsible=icon]:p-2">
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
