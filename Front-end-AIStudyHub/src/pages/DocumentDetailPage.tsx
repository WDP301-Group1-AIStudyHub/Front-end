import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  Pencil,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteDocument,
  downloadDocumentFile,
  getDocument,
  setDocumentStar,
  updateDocument,
} from "../services/documentApi";
import {
  createDocumentSummary,
  getArtifactById,
  type ArtifactRecord,
} from "@/services/artifactApi";
import { ApiClientError } from "@/services/apiClient";
import { listSubjects, type SubjectItem } from "../services/subjectApi";
import DocumentShareDialog from "../components/documents/DocumentShareDialog";
import SharedDocumentSubjectDialog from "../components/documents/SharedDocumentSubjectDialog";
import SummaryShareDialog from "@/components/artifacts/SummaryShareDialog";
import { getStoredUser } from "../services/authStorage";
import type { DocumentDetail, DocumentSubject } from "../types/document";
import { PageShell } from "@/components/layout/PageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDocumentIndexIssue } from "@/lib/chatScope";
import { useToast } from "@/hooks/useToast";
import {
  useAiUsage,
  deriveAiPlanState,
  notifyAiUsageChanged,
} from "@/hooks/useAiUsage";
import {
  MARKDOWN_PREVIEW_CLASS,
} from "@/components/chat/artifacts/artifactTypes";
import { CopyButton } from "@/components/chat/artifacts/ArtifactPreviewDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SUMMARY_POLL_INTERVAL_MS = 2000;
const SUMMARY_POLL_TIMEOUT_MS = 90_000;

type SummaryPhase = "idle" | "starting" | "polling" | "done" | "error";

interface SummaryErrorState {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

function QuotaBadge() {
  const { usage } = useAiUsage();
  const planState = deriveAiPlanState(usage);

  if (planState.kind === "loading") {
    return (
      <span className="text-xs text-muted-foreground">
        Checking AI usage...
      </span>
    );
  }

  if (planState.kind === "byok" || planState.kind === "exempt") {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        Unlimited summaries
      </span>
    );
  }

  if (
    planState.kind === "degraded" ||
    planState.kind === "degraded_exhausted"
  ) {
    return (
      <span className="text-xs font-medium text-warning">
        Your API key has an issue — using free quota (
        {planState.used}/{planState.limit})
        {" · "}
        <Link className="underline" to="/profile">
          Fix key
        </Link>
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-muted-foreground">
      {planState.limit - planState.used}/{planState.limit} summaries left
      this week
    </span>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section className="p-5">
      <h2 className="text-lg font-black">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div className="min-w-0" key={item.label}>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 wrap-break-word text-sm">
              {item.value || "None"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubjectProfileOpen, setIsSubjectProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "PRIVATE">(
    "PRIVATE",
  );
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // AI summary state. Deliberately component-local, not persisted: per the
  // confirmed product decision, the "Summarize" button always shows again on
  // a fresh page load even if a summary already exists — clicking it then is
  // a free, near-instant cache hit (200), never a silent auto-charge on mount.
  const [summaryRecord, setSummaryRecord] = useState<ArtifactRecord | null>(
    null,
  );
  const [summaryPhase, setSummaryPhase] = useState<SummaryPhase>("idle");
  const [summaryError, setSummaryError] = useState<SummaryErrorState | null>(
    null,
  );
  const [isSummaryShareOpen, setIsSummaryShareOpen] = useState(false);
  const pollTimeoutRef = useRef<number | null>(null);
  // Bumped on every new click so a stale poll from a superseded run cannot
  // clobber state after the user has already started a fresh one.
  const pollGenerationRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Document id is missing");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getDocument(id), listSubjects().catch(() => [])])
      .then(([nextDocument, nextSubjects]) => {
        if (cancelled) return;
        setDocument(nextDocument);
        setSubjects(nextSubjects);
      })
      .catch((caughtError) => {
        if (cancelled) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load document",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const subject =
    document?.subject && typeof document.subject === "object"
      ? (document.subject as DocumentSubject)
      : null;
  const subjectLabel = subject
    ? [subject.code, subject.name].filter(Boolean).join(" ")
    : typeof document?.subject === "string"
      ? document.subject
      : "Unsorted";

  const accessRole =
    document?.accessRole ||
    (currentUser &&
    (document?.ownerId === currentUser.id ||
      document?.uploadedBy === currentUser.id)
      ? "OWNER"
      : "VIEWER");
  const canEdit = accessRole === "OWNER" || accessRole === "EDITOR";
  const canManage = accessRole === "OWNER";
  const canClassifyShared = Boolean(
    document?.isShared && accessRole !== "OWNER",
  );

  function downloadDocument() {
    if (document) {
      void downloadDocumentFile(document);
    }
  }

  function openEdit() {
    if (!document) return;
    setEditTitle(document.title);
    setEditDescription(document.description ?? "");
    setEditSubjectId(document.subjectId ?? subject?._id ?? "");
    setEditVisibility(document.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE");
    setIsEditOpen(true);
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document || !id) return;
    const title = editTitle.trim();
    if (!title) {
      setError("Title is required");
      return;
    }

    setIsSavingEdit(true);
    setError(null);
    try {
      const updated = await updateDocument(id, {
        description: editDescription.trim(),
        title,
        ...(canManage
          ? {
              subjectId: editSubjectId || undefined,
              visibility: editVisibility,
            }
          : {}),
      });
      setDocument(updated as DocumentDetail);
      setIsEditOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update document",
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleDelete() {
    if (!document || !id) return;
    setIsDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!document || !id) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteDocument(id);
      navigate("/library");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete document",
      );
      setIsDeleting(false);
    }
  }

  async function toggleStar() {
    if (!document || !id) return;
    const nextStarred = !document.isStarred;
    setIsStarring(true);
    setDocument((current) =>
      current ? { ...current, isStarred: nextStarred } : current,
    );
    try {
      const updated = await setDocumentStar(id, nextStarred);
      setDocument(updated as DocumentDetail);
    } catch (caughtError) {
      setDocument((current) =>
        current ? { ...current, isStarred: document.isStarred } : current,
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update starred state",
      );
    } finally {
      setIsStarring(false);
    }
  }

  function pollSummary(
    artifactId: string,
    generation: number,
    startedAt: number,
  ) {
    pollTimeoutRef.current = window.setTimeout(async () => {
      // A newer click superseded this poll chain — stop silently.
      if (generation !== pollGenerationRef.current) return;

      try {
        const record = await getArtifactById(artifactId);
        if (generation !== pollGenerationRef.current) return;

        if (record.status === "COMPLETED") {
          setSummaryRecord(record);
          setSummaryPhase("done");
          return;
        }
        if (record.status === "FAILED") {
          setSummaryRecord(record);
          setSummaryError({
            message: record.error || "Summary generation failed.",
          });
          setSummaryPhase("error");
          return;
        }
        if (Date.now() - startedAt >= SUMMARY_POLL_TIMEOUT_MS) {
          // A pending job is never reported as a failure — it may just be slow.
          setSummaryError({
            message:
              "Still processing — reopen this page in a moment to see the result.",
          });
          setSummaryPhase("error");
          return;
        }
        setSummaryRecord(record);
        pollSummary(artifactId, generation, startedAt);
      } catch {
        if (generation !== pollGenerationRef.current) return;
        setSummaryError({
          message: "Lost connection while checking the summary status.",
        });
        setSummaryPhase("error");
      }
    }, SUMMARY_POLL_INTERVAL_MS);
  }

  async function handleSummarize() {
    if (!id) return;
    if (summaryPhase === "starting" || summaryPhase === "polling") return;

    // Disable immediately — a double click must never register as two
    // separate quota-consuming requests.
    setSummaryPhase("starting");
    setSummaryError(null);
    const generation = ++pollGenerationRef.current;

    try {
      const { record, status } = await createDocumentSummary(id);

      if (status === 202) {
        // A fresh generation just consumed one quota unit — refresh anywhere
        // usage is shown (this page's badge, the sidebar) without polling.
        notifyAiUsageChanged();
      }

      if (record.status === "COMPLETED") {
        setSummaryRecord(record);
        setSummaryPhase("done");
        return;
      }
      if (record.status === "FAILED") {
        setSummaryRecord(record);
        setSummaryError({
          message: record.error || "Summary generation failed.",
        });
        setSummaryPhase("error");
        return;
      }

      setSummaryRecord(record);
      setSummaryPhase("polling");
      pollSummary(record._id, generation, Date.now());
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        if (caughtError.status === 429) {
          setSummaryError({
            code: caughtError.code,
            message: caughtError.message,
            details: caughtError.details,
          });
          setSummaryPhase("error");
          return;
        }
        if (caughtError.status === 400) {
          setSummaryError({
            code: caughtError.code,
            message:
              "This document isn't ready to summarize yet — it may still be processing, or it's a scanned/image file with no extracted text.",
          });
          setSummaryPhase("error");
          return;
        }
        if (caughtError.status === 403) {
          showToast({
            tone: "error",
            message: "You don't have permission to summarize this document.",
          });
          setSummaryPhase("idle");
          return;
        }
        showToast({ tone: "error", message: caughtError.message });
        setSummaryPhase("idle");
        return;
      }

      showToast({
        tone: "error",
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to create summary.",
      });
      setSummaryPhase("idle");
    }
  }

  return (
    <PageShell>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="secondary">
            <Link to={document?.isShared ? "/library?view=shared" : "/library"}>
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back to My Document
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl wrap-break-word">
            {document?.title || "Document detail"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!document || isStarring}
            onClick={toggleStar}
            type="button"
            variant="secondary"
          >
            <Star
              data-icon="inline-start"
              aria-hidden="true"
              className={
                document?.isStarred
                  ? "fill-amber-400 text-amber-500"
                  : undefined
              }
            />
            {document?.isStarred ? "Unstar" : "Star"}
          </Button>
          {canManage && (
            <Button
              disabled={!document}
              onClick={() => setIsShareOpen(true)}
              type="button"
              variant="secondary"
            >
              <Users data-icon="inline-start" aria-hidden="true" />
              Share
            </Button>
          )}
          {canClassifyShared && (
            <Button
              disabled={!document}
              onClick={() => setIsSubjectProfileOpen(true)}
              type="button"
              variant="secondary"
            >
              <BookOpen data-icon="inline-start" aria-hidden="true" />
              Assign subject
            </Button>
          )}
          {canEdit && (
            <Button
              disabled={!document}
              onClick={openEdit}
              type="button"
              variant="secondary"
            >
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Edit details
            </Button>
          )}
          {document?.isOwner && summaryPhase !== "done" && (
            <Button
              disabled={summaryPhase === "starting" || summaryPhase === "polling"}
              onClick={handleSummarize}
              type="button"
              variant="secondary"
            >
              <Sparkles data-icon="inline-start" aria-hidden="true" />
              {summaryPhase === "starting" || summaryPhase === "polling"
                ? "Summarizing..."
                : summaryPhase === "error"
                  ? "Retry summary"
                  : "Summarize with AI"}
            </Button>
          )}
          <Button
            disabled={!document?.fileUrl}
            onClick={downloadDocument}
            type="button"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            Download
          </Button>
          {canManage && (
            <Button
              disabled={!document || isDeleting}
              onClick={handleDelete}
              type="button"
              variant="destructive"
            >
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              {isDeleting ? "Moving..." : "Move to trash"}
            </Button>
          )}
        </div>
      </header>

      {document?.isOwner ? (
        <div className="-mt-2 flex justify-end">
          <QuotaBadge />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <section className="p-5" key={index}>
              <Skeleton className="h-6 w-48" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((__, itemIndex) => (
                  <Skeleton className="h-10" key={itemIndex} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {!isLoading && document ? (
        <>
          {(() => {
            const indexIssue = getDocumentIndexIssue(document);
            if (!indexIssue) return null;
            return (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="font-semibold">{indexIssue.summary}</AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  {indexIssue.action}
                </AlertDescription>
              </Alert>
            );
          })()}
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard
              title="Document information"
              items={[
                { label: "Title", value: document.title },
                {
                  label: "Description",
                  value: document.description || "No description",
                },
                { label: "Subject", value: subjectLabel },
                {
                  label: "Visibility",
                  value: document.visibility || "PRIVATE",
                },
                { label: "Status", value: document.status || "ACTIVE" },
                { label: "Created", value: formatDate(document.createdAt) },
                { label: "Updated", value: formatDate(document.updatedAt) },
                { label: "Views", value: document.totalViews ?? 0 },
                { label: "Downloads", value: document.totalDownloads ?? 0 },
              ]}
            />
            <InfoCard
              title="File information"
              items={[
                {
                  label: "Original name",
                  value: document.originalFileName || document.fileName,
                },
                {
                  label: "Stored name",
                  value: document.storedFileName || document.fileName,
                },
                {
                  label: "File type",
                  value: document.mimeType || document.fileType || "Unknown",
                },
                {
                  label: "File size",
                  value: formatFileSize(document.fileSize),
                },
                {
                  label: "Extraction",
                  value: document.extractionStatus || "Unknown",
                },
                { label: "Chunks", value: document.totalChunks ?? 0 },
                {
                  label: "Last indexed",
                  value: formatDate(document.lastIndexedAt),
                },
              ]}
            />
          </div>

          {summaryPhase !== "idle" ? (
            <section className="mt-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black">AI summary</h2>
                {summaryPhase === "done" && summaryRecord?.content &&
                "markdown" in summaryRecord.content ? (
                  <div className="flex items-center gap-2">
                    <CopyButton text={summaryRecord.content.markdown} />
                    <Button
                      onClick={() => setIsSummaryShareOpen(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Share2 data-icon="inline-start" aria-hidden="true" />
                      Share
                    </Button>
                  </div>
                ) : null}
              </div>

              {(summaryPhase === "starting" || summaryPhase === "polling") && (
                <div className="mt-4 flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Generating summary...
                  </p>
                </div>
              )}

              {summaryPhase === "error" && summaryError ? (
                <Alert className="mt-4" variant="destructive">
                  <AlertTitle>
                    {summaryError.code === "QUOTA_EXHAUSTED_NO_KEY" ||
                    summaryError.code === "QUOTA_EXHAUSTED_INVALID_KEY"
                      ? "Weekly AI quota exhausted"
                      : "Couldn't create summary"}
                  </AlertTitle>
                  <AlertDescription>
                    {summaryError.message}
                    {summaryError.details &&
                    typeof summaryError.details.resetAt === "string" ? (
                      <div className="mt-1">
                        Resets {formatDate(summaryError.details.resetAt)}.
                      </div>
                    ) : null}
                    {summaryError.code === "QUOTA_EXHAUSTED_NO_KEY" ||
                    summaryError.code === "QUOTA_EXHAUSTED_INVALID_KEY" ? (
                      <div className="mt-2">
                        <Link
                          className="inline-flex items-center gap-1 font-semibold underline"
                          to="/profile"
                        >
                          Add your own API key
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              {summaryPhase === "done" &&
              summaryRecord?.content &&
              "markdown" in summaryRecord.content ? (
                <div className={`mt-4 ${MARKDOWN_PREVIEW_CLASS}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summaryRecord.content.markdown}
                  </ReactMarkdown>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form className="flex flex-col gap-4" onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>Edit document</DialogTitle>
            </DialogHeader>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Title
              <Input
                disabled={isSavingEdit}
                maxLength={160}
                onChange={(event) => setEditTitle(event.target.value)}
                value={editTitle}
              />
            </label>

            {canManage ? (
              <div className="flex flex-col gap-2 text-sm font-semibold">
                <span>Subject</span>
                <Select
                  disabled={isSavingEdit}
                  onValueChange={(val) =>
                    setEditSubjectId(val === "keep" ? "" : val)
                  }
                  value={editSubjectId || "keep"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep current subject</SelectItem>
                    {subjects.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {[item.code, item.name].filter(Boolean).join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Description
              <Textarea
                disabled={isSavingEdit}
                maxLength={1000}
                onChange={(event) => setEditDescription(event.target.value)}
                value={editDescription}
              />
            </label>

            {canManage ? (
              <div className="flex flex-col gap-2 text-sm font-semibold">
                <span>Visibility</span>
                <Select
                  disabled={isSavingEdit}
                  onValueChange={(val) =>
                    setEditVisibility(val === "PUBLIC" ? "PUBLIC" : "PRIVATE")
                  }
                  value={editVisibility}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                disabled={isSavingEdit}
                type="button"
                variant="secondary"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={isSavingEdit} type="submit">
                {isSavingEdit ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DocumentShareDialog
        document={document}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
      />
      <SharedDocumentSubjectDialog
        document={document}
        open={isSubjectProfileOpen}
        subjects={subjects}
        onOpenChange={setIsSubjectProfileOpen}
        onUpdated={(updatedDocument) =>
          setDocument(updatedDocument as DocumentDetail)
        }
      />
      <SummaryShareDialog
        artifactId={summaryRecord?._id ?? null}
        onOpenChange={setIsSummaryShareOpen}
        open={isSummaryShareOpen}
        title={document?.title}
      />
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move "{document?.title}" to trash? You
              can restore it within 30 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
