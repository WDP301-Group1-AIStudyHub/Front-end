"use client";

import * as React from "react";
import {
  Activity,
  BookMarked,
  Brain,
  FileText,
  FileCog,
  FolderOpen,
  LayoutDashboardIcon,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  SearchIcon,
  PlusIcon,
  SparklesIcon,
  HardDrive,
} from "lucide-react";

import { useNavigate, useLocation, Link } from "react-router-dom";
import { NavMain } from "@/components/nav-main";
import { NavChats } from "@/components/nav-chats";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import BrandLogo from "@/components/shared/BrandLogo";
import { groupThreadsByDate } from "@/lib/groupChatThreads";
import { logout } from "@/services/authApi";
import { getStoredUser } from "@/services/authStorage";
import { useChatThreadStore } from "@/store/useChatThreadStore";
import { Button } from "./ui/button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state: sidebarState } = useSidebar();
  const navigate = useNavigate();
  const { pathname: activePath, search } = useLocation();
  const activeSearchParams = React.useMemo(
    () => new URLSearchParams(search),
    [search],
  );
  const activeLibraryView = activeSearchParams.get("view");
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === "admin";
  const user = {
    avatar: storedUser?.avatar,
    email: storedUser?.email || "john.doe@example.com",
    name: storedUser?.fullName || "John Doe",
  };

  const chatSessions = useChatThreadStore((s) => s.active);
  const archivedSessions = useChatThreadStore((s) => s.archived);
  const archivedLoaded = useChatThreadStore((s) => s.archivedLoaded);
  const refresh = useChatThreadStore((s) => s.refresh);
  const loadArchived = useChatThreadStore((s) => s.loadArchived);
  const rename = useChatThreadStore((s) => s.rename);
  const archive = useChatThreadStore((s) => s.archive);
  const unarchive = useChatThreadStore((s) => s.unarchive);
  const remove = useChatThreadStore((s) => s.remove);

  React.useEffect(() => {
    if (isAdmin) return;
    refresh();
  }, [isAdmin, refresh]);

  const handleArchiveChat = async (sessionId: string) => {
    await archive(sessionId);
    if (activeSearchParams.get("threadId") === sessionId) {
      navigate("/ask");
    }
  };

  const handleDeleteChat = async (sessionId: string) => {
    await remove(sessionId);
    if (activeSearchParams.get("threadId") === sessionId) {
      navigate("/ask");
    }
  };

  const chatGroups = React.useMemo(
    () => groupThreadsByDate(chatSessions),
    [chatSessions],
  );

  const isDocumentNavActive =
    activePath === "/library" ||
    activePath === "/new-library" ||
    activePath === "/starred" ||
    activePath === "/trash" ||
    activePath.startsWith("/documents/");

  const baseNav = [
    {
      title: "Search",
      url: "/#",
      icon: <SearchIcon />,
      isActive: activePath === "/#",
    },
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
      title: "Storage",
      url: "/storage",
      icon: <HardDrive />,
      isActive: activePath === "/storage",
    },
    {
      title: "Study Materials",
      url: "/study-materials",
      icon: <Brain />,
      isActive:
        activePath === "/study-materials" ||
        activePath.startsWith("/library/study/"),
    },
    {
      title: "Ask",
      url: "/ask",
      icon: <SparklesIcon />,
      isActive: activePath === "/ask" || activePath === "/new-ask",
    },
  ];

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
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar className="border-r-0" collapsible="icon" {...props}>
      <SidebarHeader className="p-1.5 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 min-h-9 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Link className="min-w-0 h-4.5" to="/dashboard">
            <BrandLogo compact={sidebarState === "collapsed"} />
          </Link>
        </div>
        <Button variant={"outline"} className="shadow-2xs">
          <PlusIcon data-icon="inline-start" />
          Add
        </Button>
        <NavMain items={isAdmin ? adminNav : baseNav} />
      </SidebarHeader>
      <SidebarContent>
        {!isAdmin && (
          <NavChats
            archived={archivedSessions}
            archivedLoaded={archivedLoaded}
            groups={chatGroups}
            onArchive={handleArchiveChat}
            onDelete={handleDeleteChat}
            onLoadArchived={loadArchived}
            onRename={(id, title) => rename(id, title)}
            onRestore={(id) => unarchive(id)}
          />
        )}
      </SidebarContent>
      <SidebarFooter className="mt-auto group-data-[collapsible=icon]:p-2">
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
