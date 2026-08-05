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
  SparklesIcon,
  HardDrive,
  ExternalLink,
  CreditCard,
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

import { Progress } from "@/components/ui/progress";
import { useAiUsage, deriveAiPlanState } from "@/hooks/useAiUsage";

function SidebarUsageCard() {
  const { usage } = useAiUsage();
  const planState = deriveAiPlanState(usage);

  if (planState.kind === "loading") {
    return (
      <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden animate-pulse">
        <div className="flex items-center justify-between text-xs font-medium text-sidebar-foreground">
          <div className="h-3.5 w-20 rounded bg-sidebar-accent" />
          <div className="h-3.5 w-8 rounded bg-sidebar-accent" />
        </div>
        <div className="h-1.5 w-full mt-2.5 rounded bg-sidebar-accent" />
      </div>
    );
  }

  switch (planState.kind) {
    case "degraded":
      return (
        <div className="rounded-lg border border-warning/30 bg-warning/15 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-warning-foreground">
            <span>Free Plan usage</span>
            <span className="font-semibold">Degraded</span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-warning-foreground/90">
            Key broken — spending free quota ({planState.used}/{planState.limit}
            ).
          </p>
          <Progress
            value={planState.percentage}
            className="h-1.5 mt-2 bg-warning/20"
          />
          <div className="mt-2.5">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-warning-foreground hover:underline"
            >
              Fix your key <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      );

    case "degraded_exhausted":
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/15 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-destructive-foreground">
            <span>Quota exhausted</span>
            <span className="font-semibold">Key broken</span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-destructive-foreground/90">
            Your key is broken and monthly free quota is exhausted.
          </p>
          <div className="mt-2.5">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-destructive-foreground hover:underline"
            >
              Fix your key <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      );

    case "byok":
      return (
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-sidebar-foreground">
            <span>BYOK Plan</span>
            <span className="text-muted-foreground font-medium">Active</span>
          </div>
          <div className="mt-2">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Manage key <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      );

    case "exempt":
      return (
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-sidebar-foreground">
            <span>Unlimited Plan</span>
            <span className="text-muted-foreground font-medium">Active</span>
          </div>
        </div>
      );

    case "exhausted":
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-destructive">
            <span>Free Plan</span>
            <span className="font-semibold">Limit reached</span>
          </div>
          <Progress value={100} className="h-1.5 mt-2.5 bg-destructive/20" />
          <div className="mt-2">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Add a key <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      );

    case "counting":
      return (
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3.5 shadow-2xs group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-sidebar-foreground">
            <span>Free Plan usage</span>
            <span className="text-muted-foreground">
              {planState.percentage}%
            </span>
          </div>
          <Progress
            value={planState.percentage}
            className="h-1.5 mt-2.5 bg-sidebar-accent"
          />
          <div className="mt-2">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Add a key <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      );
  }
}

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

  const filteredChatSessions = React.useMemo(
    () =>
      chatSessions.filter(
        (s) => s.messageCount === undefined || s.messageCount > 0,
      ),
    [chatSessions],
  );

  const chatGroups = React.useMemo(
    () => groupThreadsByDate(filteredChatSessions),
    [filteredChatSessions],
  );

  const filteredArchivedSessions = React.useMemo(
    () =>
      archivedSessions.filter(
        (s) => s.messageCount === undefined || s.messageCount > 0,
      ),
    [archivedSessions],
  );

  const isDocumentNavActive =
    activePath === "/library" ||
    activePath === "/new-library" ||
    activePath === "/starred" ||
    activePath === "/trash" ||
    activePath.startsWith("/documents/");

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
    {
      title: "Storage Management",
      url: "/admin/storage",
      icon: <HardDrive />,
      isActive: activePath === "/admin/storage",
    },
    {
      title: "Payment Management",
      url: "/admin/payments",
      icon: <CreditCard />,
      isActive: activePath === "/admin/payments",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar className="border-r-0" collapsible="icon" {...props}>
      <SidebarHeader className="p-1.5 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 min-h-10 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Link className="min-w-0 h-4.5" to="/dashboard">
            <BrandLogo compact={sidebarState === "collapsed"} />
          </Link>
        </div>
        <NavMain items={isAdmin ? adminNav : baseNav} />
      </SidebarHeader>
      <SidebarContent>
        {!isAdmin && (
          <NavChats
            archived={filteredArchivedSessions}
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
        {!isAdmin && <SidebarUsageCard />}
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
