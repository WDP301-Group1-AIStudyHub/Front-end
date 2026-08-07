import {
  CalendarDays,
  CheckCircle2,
  Info,
  Settings,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deriveAiPlanState, useAiUsage } from "@/hooks/useAiUsage";
import { getStoredUser } from "@/services/authStorage";
import { Skeleton } from "@/components/ui/skeleton";

function getResetDate(period?: string) {
  if (!period) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(nextMonth);
  }
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return "the 1st of next month";
  const nextMonthDate = new Date(year, month, 1);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(nextMonthDate);
}

export default function ProfilePage() {
  const storedUser = getStoredUser();
  const { usage, loading } = useAiUsage();
  const planState = deriveAiPlanState(usage);

  const fullName = storedUser?.fullName || "User";
  const email = storedUser?.email || "N/A";
  const avatar = storedUser?.avatar;
  const role = storedUser?.role === "admin" ? "Administrator" : "Student";
  const status =
    storedUser?.status === "active" || storedUser?.isActive
      ? "Active"
      : "Inactive";

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const joinedDate = storedUser?.createdAt
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(storedUser.createdAt))
    : "Not available";

  const resetDateStr = getResetDate(usage?.period);

  return (
    <PageShell variant="narrow" className="py-8 space-y-6">
      <PageHeader
        title="My Profile"
        description="View your user overview and monthly AI usage allowance."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">
              <Settings className="size-4" />
              Settings
            </Link>
          </Button>
        }
      />

      {/* USER BASIC INFO CARD */}
      <Card className="rounded-2xl border-border/80 p-4 shadow-2xs">
        <CardContent className="p-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border border-border/80">
                {avatar && <AvatarImage src={avatar} alt={fullName} />}
                <AvatarFallback className="text-lg font-semibold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium tracking-tight text-foreground">
                    {fullName}
                  </h2>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            <Button
              asChild
              variant="secondary"
              size="sm"
              className="self-start sm:self-center"
            >
              <Link to="/settings">Edit Profile</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserRound className="size-4 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/80">Account Type</p>
                <p className="font-medium text-foreground">{role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/80">Member Since</p>
                <p className="font-medium text-foreground">{joinedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/80">
                  Account Status
                </p>
                <p className="font-medium text-foreground">{status}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FREE USAGE CARD (Styled like reference) */}
      <Card className="rounded-2xl border-border/80 p-4 shadow-2xs bg-card">
        <div className="space-y-2">
          <p className="text-sm font-normal text-muted-foreground">
            Your included usage
          </p>

          <div className="flex items-baseline justify-between">
            <p className="text-xl font-[550] tracking-tight text-foreground">
              {loading ? (
                <Skeleton className="h-5 w-20" />
              ) : usage?.unlimited ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Unlimited{" "}
                  {usage.unlimitedReason === "byok"
                    ? "(BYOK Active)"
                    : "(Admin Exempt)"}
                </span>
              ) : (
                `${planState.percentage}% used`
              )}
            </p>
            {!usage?.unlimited && (
              <span className="text-xs font-normal text-muted-foreground">
                {planState.used} / {planState.limit} queries
              </span>
            )}
          </div>
        </div>

        {/* Separator / Progress Line */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/80 transition-all duration-300 rounded-full"
            style={{ width: `${usage?.unlimited ? 0 : planState.percentage}%` }}
          />
        </div>

        {/* Footer with Reset Info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Resets {resetDateStr}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex cursor-help text-muted-foreground/70 hover:text-muted-foreground"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs">
                Free included AI quota resets automatically on the 1st of every
                calendar month.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>
    </PageShell>
  );
}
