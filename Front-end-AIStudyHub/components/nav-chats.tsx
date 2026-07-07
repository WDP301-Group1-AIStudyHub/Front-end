"use client";

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
import type { ThreadDateGroup } from "@/src/lib/groupChatThreads";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export interface ChatThreadNavItem {
  id: string;
  title: string;
  url: string;
  lastMessageAt: string;
}

function RenameInput({
  initialTitle,
  onCancel,
  onSave,
}: {
  initialTitle: string;
  onCancel: () => void;
  onSave: (title: string) => void;
}) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialTitle) onSave(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      aria-label="Rename conversation"
      className="h-8 w-full rounded-md border border-primary/50 bg-background px-2 text-sm outline-none"
      maxLength={120}
      onBlur={commit}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      value={value}
    />
  );
}

export function NavChats({
  groups,
  archived,
  archivedLoaded,
  onLoadArchived,
  onRename,
  onArchive,
  onRestore,
}: {
  groups: ThreadDateGroup<ChatThreadNavItem>[];
  archived: ChatThreadNavItem[];
  archivedLoaded: boolean;
  onLoadArchived: () => void;
  onRename: (id: string, title: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const { isMobile } = useSidebar();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const copyLink = (item: ChatThreadNavItem) => {
    const href = new URL(item.url, window.location.origin).href;
    navigator.clipboard.writeText(href).catch(() => {});
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
        <SidebarMenu>
          {groups.map((group) => (
            <Fragment key={group.label}>
              <li className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">
                {group.label}
              </li>
              {group.threads.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {editingId === item.id ? (
                    <div className="px-1 py-0.5">
                      <RenameInput
                        initialTitle={item.title}
                        onCancel={() => setEditingId(null)}
                        onSave={(title) => {
                          setEditingId(null);
                          onRename(item.id, title);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} title={item.title}>
                          <span className="truncate">{item.title}</span>
                        </Link>
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
                          <DropdownMenuItem
                            onClick={() => setEditingId(item.id)}
                          >
                            <PencilIcon className="text-muted-foreground" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyLink(item)}>
                            <LinkIcon className="text-muted-foreground" />
                            <span>Copy Link</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            <ArrowUpRightIcon className="text-muted-foreground" />
                            <span>Open in New Tab</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onArchive(item.id)}>
                            <ArchiveIcon className="text-muted-foreground" />
                            <span>Archive</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </SidebarMenuItem>
              ))}
            </Fragment>
          ))}
          {groups.length === 0 && (
            <li className="px-2 py-1.5 text-xs text-sidebar-foreground/60">
              No conversations yet.
            </li>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-foreground/70"
              onClick={() => {
                const next = !archivedOpen;
                setArchivedOpen(next);
                if (next && !archivedLoaded) onLoadArchived();
              }}
            >
              <ChevronRightIcon
                className={`transition-transform duration-200 ${
                  archivedOpen ? "rotate-90" : ""
                }`}
              />
              <span>Archived</span>
              {archivedLoaded && archived.length > 0 && (
                <span className="ml-auto text-xs text-sidebar-foreground/50">
                  {archived.length}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {archivedOpen &&
            (archivedLoaded && archived.length === 0 ? (
              <li className="px-2 py-1.5 text-xs text-sidebar-foreground/60">
                No archived conversations.
              </li>
            ) : (
              archived.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    className="text-sidebar-foreground/60"
                    title={item.title}
                  >
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={() => onRestore(item.id)}
                    showOnHover
                    title="Restore conversation"
                  >
                    <ArchiveRestoreIcon />
                    <span className="sr-only">Restore</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))
            ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
