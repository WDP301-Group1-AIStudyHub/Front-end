"use client";

import {
  AlertTriangle,
  KeyRound,
  LogOut,
  MoreHorizontalIcon,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAiUsage, deriveAiPlanState } from "@/hooks/useAiUsage";

export function NavUser({
  onLogout,
  user,
}: {
  onLogout: () => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { usage } = useAiUsage();
  const planState = deriveAiPlanState(usage);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isDegraded =
    planState.kind === "degraded" || planState.kind === "degraded_exhausted";
  const isExhausted =
    planState.kind === "exhausted" || planState.kind === "degraded_exhausted";

  const renderUsageLabel = () => {
    switch (planState.kind) {
      case "loading":
        return (
          <span className="truncate text-xs text-muted-foreground">
            Free plan
          </span>
        );
      case "exempt":
        return (
          <span className="truncate text-xs font-medium text-success flex items-center gap-1">
            <Sparkles className="size-3" />
            Unlimited (admin)
          </span>
        );
      case "byok":
        return (
          <span className="truncate text-xs font-medium text-success flex items-center gap-1">
            <Sparkles className="size-3" />
            Unlimited (BYOK)
          </span>
        );
      case "degraded":
        return (
          <span className="truncate text-[11px] font-semibold text-warning-foreground bg-warning/15 px-1.5 py-0.5 rounded border border-warning/30">
            Degraded ({planState.used}/{planState.limit} free)
          </span>
        );
      case "degraded_exhausted":
        return (
          <span className="truncate text-[11px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/30">
            Quota exhausted (Key broken)
          </span>
        );
      case "exhausted":
        return (
          <span className="truncate text-[11px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
            Quota exhausted ({planState.used}/{planState.limit})
          </span>
        );
      case "counting":
        return (
          <span className="truncate text-xs text-muted-foreground">
            {planState.used} / {planState.limit} free
          </span>
        );
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="min-h-14 bg-sidebar px-2.5 shadow-none hover:border-sidebar-ring/30 hover:bg-sidebar-accent data-[state=open]:border-sidebar-ring/30 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:min-h-10 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent"
            >
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 ">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                {/* Collapsed sidebar icon affordances */}
                {isDegraded && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex size-3 rounded-full bg-warning border-2 border-sidebar shadow-xs"
                    title="Degraded state: Saved API key is invalid"
                  />
                )}
                {isExhausted && !isDegraded && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex size-3 rounded-full bg-destructive border-2 border-sidebar shadow-xs"
                    title="Quota exhausted"
                  />
                )}
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-sidebar-foreground">
                  {user.name}
                </span>
                {renderUsageLabel()}
              </div>
              <MoreHorizontalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            className="w-56"
          >
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8">
                {user.avatar && (
                  <AvatarImage src={user.avatar} alt={user.name} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Degraded prompt in dropdown */}
            {isDegraded && (
              <div className="mx-1 my-1.5 rounded-lg border border-warning/30 bg-warning/15 p-2 text-xs text-warning-foreground leading-snug flex items-start gap-1.5">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  Your key is broken. Free quota is currently being spent.
                </span>
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/profile")}>
              <UserRound />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/profile")}>
              <KeyRound />
              Manage API Key (BYOK)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
