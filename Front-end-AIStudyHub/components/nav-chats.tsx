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

export interface ChatSessionItem {
  id: string
  name: string
  url: string
  emoji: string
  dateLabel: string
  itemIds: string[]
}

export function NavChats({
  onDelete,
  onSelect,
  recentChats,
}: {
  onDelete?: (itemIds: string[]) => void
  onSelect?: (itemIds: string[]) => void
  recentChats: ChatSessionItem[]
}) {
  const { isMobile } = useSidebar();
  const [showAll, setShowAll] = React.useState(false);

  const visibleChats = showAll ? recentChats : recentChats.slice(0, INITIAL_LIMIT);
  const hiddenCount = recentChats.length - INITIAL_LIMIT;

  // Group visible sessions by dateLabel for section headers
  const groupedByDate = React.useMemo(() => {
    const groups: { label: string; items: ChatSessionItem[] }[] = [];
    let currentLabel = '';
    for (const item of visibleChats) {
      if (item.dateLabel !== currentLabel) {
        currentLabel = item.dateLabel;
        groups.push({ label: currentLabel, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }
    return groups;
  }, [visibleChats]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
      <SidebarMenu>
        {groupedByDate.map((group) => (
          <React.Fragment key={group.label}>
            <SidebarMenuItem>
              <span className="block px-2 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                {group.label}
              </span>
            </SidebarMenuItem>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild>
                  <button
                    type="button"
                    onClick={() => onSelect?.(item.itemIds)}
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
                    <DropdownMenuItem onClick={() => onDelete?.(item.itemIds)}>
                      <Trash2Icon className="text-muted-foreground" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </React.Fragment>
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
