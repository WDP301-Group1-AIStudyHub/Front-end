import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Database,
  FileText,
  Plus,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CelestialInlineLoader } from "../components/shared/CelestialLoading";
import { listDocuments } from "../services/documentApi";
import { formatStorageBytes } from "../utils/formatStorage";
import { StorageUsageBar } from "../components/storage/StorageUsageBar";
import { StoragePackageCard } from "../components/storage/StoragePackageCard";
import { PurchaseConfirmDialog } from "../components/storage/PurchaseConfirmDialog";
import { useStoragePurchase } from "../hooks/useStoragePurchase";
import { useUploadStore } from "../store/useUploadStore";
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

/** Matches the multer limit in the backend and Cloudinary's raw-file cap. */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const isUploading = useUploadStore((state) =>
    state.uploads.some(
      (u) =>
        u.status === "uploading" ||
        u.status === "pending" ||
        u.status === "processing",
    ),
  );

  const handleUploadFile = (file: File) => {
    const payload = {
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: "Uploaded via Quick Upload",
      subject: "General",
    };
    useUploadStore.getState().processIncomingUpload(payload, docs, () => {
      listDocuments().then(setDocs);
    });
  };

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

  const docsPerDay = useMemo(() => {
    if (docs.length < 2) return null;
    const dates = docs
      .map((d) => new Date(d.createdAt).getTime())
      .filter((t) => !Number.isNaN(t));
    const span = (Math.max(...dates) - Math.min(...dates)) / 86_400_000;
    if (span < 1) return null;
    return (docs.length / span).toFixed(1);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);

      // This dropzone historically had no validation at all — not even the
      // 10 MB per-file limit the library dialog enforces. Check both here, and
      // check the batch as a whole so ten files that each fit but together do
      // not cannot slip through.
      const oversized = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        setUploadFeedback(
          `${oversized.length} file(s) exceed the 10 MB limit and were skipped: ${oversized.map((f) => f.name).join(", ")}`,
        );
      }

      const accepted = files.filter((file) => file.size <= MAX_FILE_SIZE);
      const totalBytes = accepted.reduce((sum, file) => sum + file.size, 0);
      const capacity = useStorageStore.getState().hasCapacityFor(totalBytes);

      if (capacity.known && !capacity.ok) {
        setUploadFeedback(
          `Not enough storage. These files need ${formatStorageBytes(totalBytes)} but only ${formatStorageBytes(capacity.available)} is free. Delete some documents or upgrade your plan.`,
        );
        setTimeout(() => setUploadFeedback(null), 6000);
        return;
      }

      if (accepted.length === 0) {
        setTimeout(() => setUploadFeedback(null), 6000);
        return;
      }

      setUploadFeedback(`Queueing ${accepted.length} document(s)...`);

      for (const file of accepted) {
        const payload = {
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "Uploaded via Quick Dropzone",
          subject: "General",
        };

        try {
          useUploadStore.getState().processIncomingUpload(payload, docs, () => {
            // refresh library on successful upload
            listDocuments().then(setDocs);
          });
        } catch (err) {
          console.error("Dropzone upload failed:", err);
        }
      }

      setTimeout(() => setUploadFeedback(null), 4000);
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
            onDrop={handleDrop}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-6"
          >
            <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-8" />
              </div>
              <h3 className="text-xl font-bold">Drop your study source here</h3>
              <p className="text-sm text-muted-foreground">
                Upload and link directly to your general workspace
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        description="Manage documents, continue recent study work, and review AI activity from one workspace."
        actions={
          <div className="flex items-center gap-3">
            {uploadFeedback && (
              <span className="text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-xl animate-pulse">
                {uploadFeedback}
              </span>
            )}
            <Button
              disabled={isUploading}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleUploadFile(file);
                };
                input.click();
              }}
            >
              <UploadCloud data-icon="inline-start" aria-hidden="true" />
              {isUploading ? (
                <CelestialInlineLoader label="Uploading..." />
              ) : (
                "Quick upload"
              )}
            </Button>
          </div>
        }
      />

      {/* Bento Grid Layout */}
      <section className="mt-8 grid gap-5 xl:grid-cols-12">
        {/* Storage plan + usage. The plan name is the headline here: without it
            a user cannot tell what they are paying for or why the cap is what
            it is. */}
        <article className="botanical-bento flex flex-col justify-between p-6 xl:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <IconTile tone="primary">
              <Database className="size-4" />
            </IconTile>
            <span className="text-xs font-semibold text-muted-foreground">
              Space Usage
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Storage plan
            </span>
          </div>

          <div className="mt-6">
            {storageLoading && !storage ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {storage?.package?.name ?? "Free"}
                </p>
                <span
                  className={`status-badge ${
                    storage?.status === "FULL" || storage?.status === "CRITICAL"
                      ? "status-error"
                      : storage?.status === "WARNING"
                        ? "status-warning"
                        : "status-active"
                  }`}
                >
                  {storage?.status === "FULL"
                    ? "Full"
                    : storage?.status === "CRITICAL"
                      ? "Almost full"
                      : storage?.status === "WARNING"
                        ? "Filling up"
                        : "Active"}
                </span>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {storage
                ? `${formatStorageBytes(storage.availableBytes)} free · 10 MB max per file`
                : "loading storage..."}
            </p>
          </div>

          <div className="mt-6">
            {storageLoading && !storage ? (
              <Skeleton className="h-9 w-28" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatStorageBytes(storage?.usedBytes ?? 0)}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  / {formatStorageBytes(storage?.quotaBytes ?? 0)}
                </span>
              </p>
            )}
          </div>

          <div className="mt-4">
            {storageLoading && !storage ? (
              <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
            ) : (
              <StorageUsageBar
                quotaBytes={storage?.quotaBytes ?? 0}
                showLabel={false}
                status={storage?.status ?? "OK"}
                usedBytes={storage?.usedBytes ?? 0}
              />
            )}
            <Link
              className="mt-4 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
              to="/storage"
            >
              {storage?.status === "FULL"
                ? "Storage is full — upgrade your plan"
                : storage?.status === "CRITICAL" ||
                    storage?.status === "WARNING"
                  ? "Running low — compare plans"
                  : "Manage plan"}
            </Link>
          </div>
        </article>

        {/* AI Assistant box */}
        <article className="flex flex-col justify-between p-6 xl:col-span-5 border border-border rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            AI Assistant
          </div>
          <h2 className="mt-6 text-xl font-bold leading-relaxed text-foreground">
            Chat with your documents for immediate summaries and practice
            questions.
          </h2>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="rounded-xl">
              <Link to="/aichatbox">Start AI session</Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              {loading ? (
                <CelestialInlineLoader label="Loading library..." />
              ) : (
                `Ready to analyze ${docs.length} documents.`
              )}
            </span>
          </div>
        </article>

        {/* Study Progress SVG Chart */}
        <article className="flex flex-col justify-between p-6 xl:col-span-3 border border-border rounded-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Study Activity</span>
            <span className="text-primary font-bold">7-day library</span>
          </div>

          {/* Spring-animated SVG Chart */}
          <div className="h-28 mt-4 flex items-end justify-between gap-2">
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
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {bar.day}
                </span>

                {/* Micro tooltip */}
                <span className="absolute -top-6 scale-0 group-hover:scale-100 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-transform pointer-events-none">
                  {bar.count} docs
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Upgrade options, so buying never requires leaving the dashboard. Only
          plans other than the current one are shown — a card that says "this is
          your plan" is noise here, unlike on the dedicated plans page. */}
      {upgradeOptions.length > 0 ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Need more storage?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade in a couple of clicks. Your documents stay exactly where
                they are.
              </p>
            </div>
            <Link
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
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
        <article className="overflow-hidden p-0 rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border/80 p-5">
            <div className="flex items-center gap-3">
              <Archive className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight">
                Recent documents
              </h2>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/library">View all</Link>
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[1fr_180px_auto]"
                  key={i}
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="space-y-1.5">
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
                  className="grid gap-3 p-5 transition-all hover:bg-muted/30 md:grid-cols-[1fr_180px_auto]"
                  key={doc.id}
                  to="/library"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile fileName={doc.fileName}>
                      <FileText className="size-4" />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground text-sm">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="self-center text-xs text-muted-foreground font-medium">
                    {(typeof doc.subject === "object"
                      ? doc.subject?.name
                      : doc.subject) || "Uncategorized"}
                  </span>
                  <span className="self-center text-xs font-bold text-primary group-hover:underline">
                    Open
                  </span>
                </Link>
              ))
            )}
          </div>
        </article>

        {/* Sidebar panels */}
        <aside className="flex flex-col gap-5 ">
          {/* Quick upload card dropzone button */}
          <div
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="group flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-dashed border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <div>
              <h2 className="font-bold tracking-tight text-foreground text-sm">
                Quick Drop Upload
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
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
          <article className="p-5">
            <span className="text-xs font-semibold text-muted-foreground">
              Documents by subject
            </span>
            <div className="mt-5 space-y-2">
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
                <p className="text-xs text-muted-foreground p-1">
                  No subjects yet.
                </p>
              ) : (
                subjectClusters.map((subject) => (
                  <Link
                    className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 text-sm transition-all hover:bg-muted/40"
                    key={subject.name}
                    to="/library"
                  >
                    <span className="font-semibold text-foreground text-xs">
                      {subject.name}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {subject.count}
                    </span>
                  </Link>
                ))
              )}
            </div>
            <Button
              asChild
              className="mt-5 w-full rounded-xl"
              variant="outline"
            >
              <Link to="/subjects">Manage subjects</Link>
            </Button>
          </article>
        </aside>
      </section>

      {/* Footer statistics bar */}
      <section className="mt-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-2 rounded-full bg-primary shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {docs.length === 0
              ? "Upload documents to start building your research library."
              : docsPerDay
                ? `The library grows at ${docsPerDay} documents per day. ${docs.length} total files available.`
                : `${docs.length} document${docs.length === 1 ? "" : "s"} in your library.`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-xs shrink-0">
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Indexed docs
            </p>
            <p className="mt-1 font-bold text-foreground">
              {docs.filter((doc) => (doc.totalChunks ?? 0) > 0).length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Workspace
            </p>
            <p className="mt-1 font-bold text-primary">Connected</p>
          </div>
        </div>
      </section>

      {/* Floating Plus button */}
      <Button
        asChild
        className="fixed bottom-6 right-6 z-40 size-12 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-transform"
        title="New document"
      >
        <Link to="/library">
          <Plus aria-hidden="true" className="size-5" />
        </Link>
      </Button>
    </PageShell>
  );
}
