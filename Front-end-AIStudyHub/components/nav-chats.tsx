"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  MoreHorizontalIcon,
  StarOffIcon,
  LinkIcon,
  ArrowUpRightIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";

const INITIAL_LIMIT = 5;

export function NavChats({
  onDelete,
  onSelect,
  recentChats,
}: {
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
  recentChats: {
    id: string
    name: string
    url: string
    emoji: string
  }[]
}) {
  const { isMobile } = useSidebar();
  const [showAll, setShowAll] = React.useState(false);

  const visibleChats = showAll ? recentChats : recentChats.slice(0, INITIAL_LIMIT);
  const hiddenCount = recentChats.length - INITIAL_LIMIT;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
      <SidebarMenu>
        {visibleChats.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                title={item.name}
                className="w-full text-left"
              >
                <span>{item.emoji}</span>
                <span>{item.name}</span>
              </button>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="aria-expanded:bg-muted"
                >
                  <MoreHorizontalIcon />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <StarOffIcon className="text-muted-foreground" />
                  <span>Remove from Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LinkIcon className="text-muted-foreground" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowUpRightIcon className="text-muted-foreground" />
                  <span>Open in New Tab</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete?.(item.id)}>
                  <Trash2Icon className="text-muted-foreground" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {recentChats.length > INITIAL_LIMIT && (
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-foreground/70"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? (
                <>
                  <ChevronUpIcon />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDownIcon />
                  <span>Show {hiddenCount} more</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
