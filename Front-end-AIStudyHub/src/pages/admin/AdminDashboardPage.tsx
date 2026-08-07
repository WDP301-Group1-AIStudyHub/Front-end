import { useEffect, useState } from "react";
import {
  FileText,
  HeartPulse,
  MessageSquare,
  Users,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/shared/IconTile";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { LoadingState } from "@/components/shared/CelestialLoading";
import { getDashboardStats } from "@/services/adminApi";
import type { DashboardStats } from "@/types/admin";
import { AdminStatCard, formatDateTime, StatusBadge } from "./adminPageUtils";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "react-router-dom";

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "User Login",
  USER_REGISTER: "User Register",
  DOCUMENT_UPLOAD: "Document Upload",
  DOCUMENT_DELETE: "Document Delete",
  LOGIN: "Login",
  REGISTER: "Register",
  OTHER: "Other Action",
};

function formatActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getDashboardStats()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const usage = stats?.usageStatistics;
  const health = stats?.platformHealth;
  const activities = stats?.recentActivities ?? [];

  return (
    <PageShell>
      <PageHeader
        actions={
          <Button asChild>
            <Link to="/admin/users">Review users</Link>
          </Button>
        }
        description="System-wide usage statistics and overall platform health at a glance."
        title="Admin Dashboard"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={<Users />}
          label="Total users"
          value={isLoading ? "..." : String(usage?.totalUsers ?? 0)}
          tone="blue"
        />
        <AdminStatCard
          icon={<FileText />}
          label="Total documents"
          value={isLoading ? "..." : String(usage?.totalDocuments ?? 0)}
          tone="gold"
        />
        <AdminStatCard
          icon={<MessageSquare />}
          label="Chat threads"
          value={isLoading ? "..." : String(usage?.totalChatThreads ?? 0)}
          tone="teal"
        />
        <AdminStatCard
          icon={<BookOpen />}
          label="Study materials"
          value={isLoading ? "..." : String(usage?.totalStudyMaterials ?? 0)}
          tone="coral"
        />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 p-5">
            <div>
              <h2 className="text-lg font-semibold">Recent activity stream</h2>
              <p className="text-sm text-muted-foreground">
                Latest admin and platform events from the server.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/activity">Open activity</Link>
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {isLoading ? (
              <div className="p-5">
                <LoadingState
                  label="Loading admin signals..."
                  tone="sapphire"
                />
              </div>
            ) : activities.length === 0 ? (
              <div className="grid min-h-48 place-items-center p-5 text-muted-foreground">
                <p>No recent activities.</p>
              </div>
            ) : (
              activities.slice(0, 6).map((activity) => (
                <div
                  className="grid gap-3 p-5 transition-colors hover:bg-muted/35 md:grid-cols-[160px_1fr_auto]"
                  key={activity._id}
                >
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(activity.createdAt)}
                  </span>
                  <div>
                    <p className="font-medium">
                      {(activity.details?.action as string) ??
                        formatActionLabel(activity.action)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.userId?.fullName ?? "System"}
                      {!["USER_LOGIN", "USER_REGISTER"].includes(
                        activity.action,
                      ) && activity.entityType
                        ? ` → ${activity.entityType}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge severity="info">
                    {formatActionLabel(activity.action)}
                  </StatusBadge>
                </div>
              ))
            )}
          </div>
        </article>

        <aside className="p-5 space-y-5">
          <IconTile tone="info">
            <HeartPulse />
          </IconTile>
          <h2 className="text-lg font-semibold">Platform Health</h2>
          {isLoading ? (
            <LoadingState label="Loading health..." tone="gold" />
          ) : health ? (
            <div className="space-y-3 text-sm">
              <Item variant="outline" className="justify-between">
                <ItemContent>
                  <ItemTitle>Overall status</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <StatusBadge
                    severity={
                      health.status === "Healthy" ? "success" : "warning"
                    }
                  >
                    {health.status}
                  </StatusBadge>
                </ItemActions>
              </Item>
              <Item variant="outline" className="justify-between">
                <ItemContent>
                  <ItemTitle>Database</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <StatusBadge
                    severity={health.databaseConnected ? "success" : "critical"}
                  >
                    {health.databaseConnected ? "Connected" : "Disconnected"}
                  </StatusBadge>
                </ItemActions>
              </Item>
              <Item variant="outline" className="justify-between">
                <ItemContent>
                  <ItemTitle>Chunks processed</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <strong>
                    {health.documentProcessing.totalChunksProcessed}
                  </strong>
                </ItemActions>
              </Item>
              <Item variant="outline" className="justify-between">
                <ItemContent>
                  <ItemTitle>Successful extractions</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <StatusBadge severity="success">
                    {health.documentProcessing.completedExtractions}
                  </StatusBadge>
                </ItemActions>
              </Item>
              <Item variant="outline" className="justify-between">
                <ItemContent>
                  <ItemTitle>Extractions failed</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <StatusBadge
                    severity={
                      health.documentProcessing.failedExtractions > 0
                        ? "warning"
                        : "success"
                    }
                  >
                    {health.documentProcessing.failedExtractions}
                  </StatusBadge>
                </ItemActions>
              </Item>
              <Item variant="outline" className="justify-between">
                <ItemContent>
                  <ItemTitle>Failure rate</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <span className="font-medium">
                    {health.documentProcessing.failureRatePercentage}%
                  </span>
                </ItemActions>
              </Item>
            </div>
          ) : (
            <p className="text-muted-foreground">No health data available.</p>
          )}
        </aside>
      </section>
    </PageShell>
  );
}
