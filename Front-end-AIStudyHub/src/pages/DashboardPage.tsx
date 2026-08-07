import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, FileText, UploadCloud, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { CelestialInlineLoader } from "../components/shared/CelestialLoading";
import { listDocuments } from "../services/documentApi";
import { formatStorageBytes } from "../utils/formatStorage";
import { StorageUsageBar } from "../components/storage/StorageUsageBar";
import { StoragePackageCard } from "../components/storage/StoragePackageCard";
import { PurchaseConfirmDialog } from "../components/storage/PurchaseConfirmDialog";
import { useStoragePurchase } from "../hooks/useStoragePurchase";
import { useStorageStore } from "../store/useStorageStore";
import type { DocumentItem } from "../types/document";
import { IconTile } from "@/components/shared/IconTile";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function DashboardPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);

  const storage = useStorageStore((state) => state.storage);
  const storageLoading = useStorageStore((state) => state.loading);
  const loadStorage = useStorageStore((state) => state.loadStorage);
  const packages = useStorageStore((state) => state.packages);
  const currentPackageId = useStorageStore((state) => state.currentPackageId);
  const loadPackages = useStorageStore((state) => state.loadPackages);

  // Same hook the plans page uses, so buying from here behaves identically —
  // including the post-payment redirect landing back on /dashboard.
  const { blockReason, confirmPurchase, isSubmitting, setTarget, target } =
    useStoragePurchase();

  useEffect(() => {
    void loadStorage();
    void loadPackages();
  }, [loadPackages, loadStorage]);

  const upgradeOptions = useMemo(
    () => packages.filter((pkg) => pkg.id !== currentPackageId),
    [currentPackageId, packages],
  );

  const recentDocs = useMemo(
    () =>
      [...docs]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 4),
    [docs],
  );

  const subjectClusters = useMemo(() => {
    const map = new Map<string, number>();
    for (const doc of docs) {
      const subjectName =
        (typeof doc.subject === "object" ? doc.subject?.name : doc.subject) ||
        "";
      const key = subjectName.trim() || "Uncategorized";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [docs]);

  useEffect(() => {
    listDocuments()
      .then((data) => setDocs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Drag and Drop Upload logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        active: index === 6,
        count: 0,
        day: new Intl.DateTimeFormat(undefined, { weekday: "short" })
          .format(date)
          .slice(0, 1),
        key: date.toISOString().slice(0, 10),
      };
    });

    for (const doc of docs) {
      const createdAt = new Date(doc.createdAt);
      if (Number.isNaN(createdAt.getTime())) continue;
      createdAt.setHours(0, 0, 0, 0);
      const key = createdAt.toISOString().slice(0, 10);
      const day = days.find((item) => item.key === key);
      if (day) day.count += 1;
    }

    const maxCount = Math.max(...days.map((day) => day.count), 1);
    return days.map((day) => ({
      ...day,
      value: day.count === 0 ? 4 : Math.max((day.count / maxCount) * 100, 18),
    }));
  }, [docs]);

  return (
    <PageShell onDragEnter={handleDrag}>
      {/* Absolute Drag & Drop overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={() => {}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-6"
          >
            <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-8" />
              </div>
              <h3 className="text-sm font-medium">
                Drop your study source here
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Upload and link directly to your general workspace
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Dashboard"
        description="Manage documents, continue recent study work, and review AI activity from one workspace."
      />

      {/* Bento Grid Layout */}
      <section className="mt-8 grid gap-5 xl:grid-cols-12">
        {/* Storage plan + usage */}
        <Card className="justify-between xl:col-span-4">
          <CardHeader className="font-medium">Current Plan</CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              {storageLoading && !storage ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="font-medium text-foreground">
                    {storage?.package?.name ?? "Free"}
                  </CardTitle>
                  <Badge
                    variant={
                      storage?.status === "FULL" ||
                      storage?.status === "CRITICAL"
                        ? "destructive"
                        : storage?.status === "WARNING"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {storage?.status === "FULL"
                      ? "Full"
                      : storage?.status === "CRITICAL"
                        ? "Almost full"
                        : storage?.status === "WARNING"
                          ? "Filling up"
                          : "Active"}
                  </Badge>
                </div>
              )}
              <CardDescription className="mt-1 text-sm">
                {storage
                  ? `${formatStorageBytes(storage.availableBytes)} free · 10 MB max per file`
                  : "loading storage..."}
              </CardDescription>
            </div>

            <div>
              {storageLoading && !storage ? (
                <Skeleton className="h-2 w-full rounded-full" />
              ) : (
                <StorageUsageBar
                  quotaBytes={storage?.quotaBytes ?? 0}
                  status={storage?.status ?? "OK"}
                  usedBytes={storage?.usedBytes ?? 0}
                />
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Link
              className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              to="/storage"
            >
              {storage?.status === "FULL"
                ? "Storage is full — upgrade your plan"
                : storage?.status === "CRITICAL" ||
                    storage?.status === "WARNING"
                  ? "Running low — compare plans"
                  : "Manage plan"}
            </Link>
          </CardFooter>
        </Card>

        {/* AI Assistant box */}
        <Card className="justify-between xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
              AI Assistant
            </div>
            <CardTitle className="mt-4 text-sm font-medium leading-relaxed text-foreground">
              Chat with your documents for immediate summaries and practice
              questions.
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-wrap items-center gap-4">
            <Button asChild>
              <Link to="/aichatbox">Start AI session</Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              {loading ? (
                <CelestialInlineLoader label="Loading library..." />
              ) : (
                `Ready to analyze ${docs.length} documents.`
              )}
            </span>
          </CardFooter>
        </Card>

        {/* Study Progress SVG Chart */}
        <Card className="justify-between xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Activity
            </CardTitle>
            <CardDescription className="text-primary font-medium text-sm">
              7-day library
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Spring-animated SVG Chart */}
            <div className="h-28 flex items-end justify-between gap-2">
              {chartData.map((bar, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 flex-1 group relative"
                >
                  <div className="w-full bg-muted rounded-t-lg overflow-hidden h-20 relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.value}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        delay: i * 0.05,
                      }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-colors ${
                        bar.active
                          ? "bg-primary"
                          : "bg-primary/30 group-hover:bg-primary/50"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {bar.day}
                  </span>

                  {/* Micro tooltip */}
                  <span className="absolute -top-6 scale-0 group-hover:scale-100 bg-foreground text-background text-[9px] font-medium px-1.5 py-0.5 rounded-md transition-transform pointer-events-none">
                    {bar.count} docs
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Upgrade options, so buying never requires leaving the dashboard. Only
          plans other than the current one are shown — a card that says "this is
          your plan" is noise here, unlike on the dedicated plans page. */}
      {upgradeOptions.length > 0 ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">Need more storage?</h2>
              <p className="text-muted-foreground">
                Upgrade in a couple of clicks. Your documents stay exactly where
                they are.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              to="/storage"
            >
              Compare all plans
            </Link>
          </div>

          <div
            className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${
              upgradeOptions.length >= 3 ? "lg:grid-cols-3" : ""
            }`}
          >
            {upgradeOptions.map((pkg) => (
              <StoragePackageCard
                hideAction={Boolean(
                  storage?.package &&
                  pkg.capacityBytes < storage.package.capacityBytes,
                )}
                isCurrent={false}
                key={pkg.id}
                onSelect={setTarget}
                pkg={pkg}
                unavailableReason={blockReason(pkg)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <PurchaseConfirmDialog
        isSubmitting={isSubmitting}
        onConfirm={confirmPurchase}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        storage={storage}
        target={target}
      />

      {/* Main Section */}
      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Recent Documents */}
        <Card className="overflow-hidden gap-0">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-medium flex gap-2 items-center">
              <Archive className="size-4 text-primary" aria-hidden="true" />
              Recent documents
            </CardTitle>
            <CardAction>
              <Button asChild size="sm" variant="outline">
                <Link to="/library">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[1fr_180px_auto]"
                  key={i}
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-24 self-center" />
                </div>
              ))
            ) : recentDocs.length === 0 ? (
              <Empty className="m-5">
                <EmptyHeader>
                  <EmptyMedia>
                    <Archive className="size-6 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>No documents yet</EmptyTitle>
                  <EmptyDescription>
                    Drag and drop files onto this page to upload.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              recentDocs.map((doc) => (
                <Link
                  className="grid gap-3 p-5 transition-all hover:bg-muted/30 active:bg-muted/50 md:grid-cols-[1fr_180px_auto]"
                  key={doc.id}
                  to="/library"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile fileName={doc.fileName} size={"sm"}>
                      <FileText className="size-4" />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground text-sm">
                        {doc.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="self-center text-sm text-muted-foreground font-normal">
                    {(typeof doc.subject === "object"
                      ? doc.subject?.name
                      : doc.subject) || "Uncategorized"}
                  </span>
                  <span className="self-center text-sm font-medium text-primary group-hover:underline">
                    Open
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sidebar panels */}
        <aside className="flex flex-col gap-5 ">
          {/* Quick upload card dropzone button */}
          <div
            onDragOver={handleDrag}
            onDrop={() => {}}
            className="group flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-dashed border-border bg-card p-5 transition-all hover:border-primary active:scale-[0.98]"
          >
            <div>
              <h2 className="font-medium  text-foreground text-sm">
                Quick Drop Upload
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag and drop source files here
              </p>
            </div>
            <IconTile
              tone="primary"
              className="group-hover:scale-105 transition-transform"
            >
              <UploadCloud className="size-4" />
            </IconTile>
          </div>

          {/* Subject clusters list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Documents by subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      className="flex items-center justify-between gap-4 p-1"
                      key={i}
                    >
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-6" />
                    </div>
                  ))
                ) : subjectClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-1">
                    No subjects yet.
                  </p>
                ) : (
                  subjectClusters.map((subject) => (
                    <Link
                      className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 text-sm transition-all hover:bg-muted/40 active:scale-[0.98]"
                      key={subject.name}
                      to="/library"
                    >
                      <span className="font-medium text-foreground text-sm">
                        {subject.name}
                      </span>
                      <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {subject.count}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/subjects">Manage subjects</Link>
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </section>
    </PageShell>
  );
}
