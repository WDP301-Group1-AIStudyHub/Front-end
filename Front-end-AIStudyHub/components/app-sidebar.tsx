"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  TerminalIcon,
  AudioLinesIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MessagesSquareIcon,
  ChartColumnIcon,
  Settings2Icon,
} from "lucide-react";
import { NavChats } from "./nav-chats";
import { NavUser } from "./nav-user";
import { logout } from "@/src/services/authApi";
import { getStoredUser } from "@/src/services/authStorage";

// This is sample data.
const data = {
  user: {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: <TerminalIcon />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Library",
      url: "/library",
      icon: <LibraryIcon />,
    },
    {
      title: "AI Chatbox",
      url: "/aichatbox",
      icon: <MessagesSquareIcon />,
    },
    {
      title: "Insights",
      url: "#",
      icon: <ChartColumnIcon />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
  ],
  recentChats: [
    {
      name: "Project Management & Task Tracking",
      url: "#",
      emoji: "📊",
    },
    {
      name: "Family Recipe Collection & Meal Planning",
      url: "#",
      emoji: "🍳",
    },
    {
      name: "Fitness Tracker & Workout Routines",
      url: "#",
      emoji: "💪",
    },
    {
      name: "Book Notes & Reading List",
      url: "#",
      emoji: "📚",
    },
    {
      name: "Sustainable Gardening Tips & Plant Care",
      url: "#",
      emoji: "🌱",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const storedUser = getStoredUser();
  const user = {
    avatar: storedUser?.avatar || "https://i.pravatar.cc/150?img=3",
    email: storedUser?.email || data.user.email,
    name: storedUser?.fullName || data.user.name,
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="font-bold tracking-tight">AI Study Hub</span>
        </div>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavChats recentChats={data.recentChats} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser onLogout={handleLogout} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
