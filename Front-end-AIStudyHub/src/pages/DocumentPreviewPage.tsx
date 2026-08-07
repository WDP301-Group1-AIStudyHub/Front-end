import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { DocumentItem } from "@/types/document";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";

import { IconTile } from "@/components/shared/IconTile";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  createDocumentSummary,
  getArtifactById,
  getExistingDocumentSummary,
  type ArtifactRecord,
} from "@/services/artifactApi";
import { ApiClientError } from "@/services/apiClient";
import { useToast } from "@/hooks/useToast";
import { useAiUsage, deriveAiPlanState, notifyAiUsageChanged } from "@/hooks/useAiUsage";
import { MARKDOWN_PREVIEW_CLASS } from "@/components/chat/artifacts/artifactTypes";
import { CopyButton } from "@/components/chat/artifacts/ArtifactPreviewDialog";
import SummaryShareDialog from "@/components/artifacts/SummaryShareDialog";
import { getDocument } from "@/services/documentApi";

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

  if (planState.kind === "degraded" || planState.kind === "degraded_exhausted") {
    return (
      <span className="text-xs font-medium text-warning">
        Your API key has an issue — using free quota (
        {planState.used}/{planState.limit})
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-muted-foreground">
      {planState.limit - planState.used}/{planState.limit} summaries left this
      week
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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getPreviewTitle(previewParam: string): string {
  const decoded = safeDecode(previewParam).split(/[\\/]/).pop() ?? previewParam;
  const withoutQuery = decoded.split("?")[0] || decoded;

  return withoutQuery.replace(/\.[^/.]+$/, "") || "Preview";
}

export function getPreviewFileType(previewParam: string): string {
  const decoded = safeDecode(previewParam).split("?")[0];
  const extension = decoded.match(/\.([a-z0-9]+)$/i)?.[1];

  return (extension || "txt").toUpperCase();
}

export interface DocumentPreviewPageProps {
  document: DocumentItem | null;
  previewParam: string;
}

export function DocumentPreviewPage({
  document: initialDocument,
  previewParam,
}: DocumentPreviewPageProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [document, setDocument] = useState<DocumentItem | null>(initialDocument);
  const previewDocumentId = /^[a-f0-9]{24}$/i.test(previewParam)
    ? previewParam
    : "";
  const [isDocumentLoading, setIsDocumentLoading] = useState(
    Boolean(!initialDocument?.fileUrl && previewDocumentId),
  );
  const [documentLoadError, setDocumentLoadError] = useState<string | null>(null);
  const [documentLoadAttempt, setDocumentLoadAttempt] = useState(0);
  const previewTitle = document
    ? getPreviewTitle(document.fileName || document.title)
    : getPreviewTitle(previewParam);
  const fileType = getPreviewFileType(document?.fileName || previewParam);

  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [summaryRecord, setSummaryRecord] = useState<ArtifactRecord | null>(null);
  const [summaryPhase, setSummaryPhase] = useState<SummaryPhase>("idle");
  const [summaryError, setSummaryError] = useState<SummaryErrorState | null>(null);
  const [isSummaryShareOpen, setIsSummaryShareOpen] = useState(false);
  const pollTimeoutRef = useRef<number | null>(null);
  const pollGenerationRef = useRef(0);
  // Tracks the id this instance has already fetched (or is fetching), so the
  // detail call only ever runs once per id — not once when initialDocument
  // is still unresolved and again the moment the parent's document list
  // finishes loading and hands us the same document under a new object
  // identity.
  const fetchedDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const documentId = initialDocument?.id || previewDocumentId;

    if (!documentId) {
      setDocument(initialDocument);
      setIsDocumentLoading(false);
      setDocumentLoadError(null);
      return;
    }

    // Already have (or are fetching) the authoritative detail for this id —
    // leave it alone. Without this guard, a parent re-render that briefly
    // hands us a null/stale initialDocument for the same id (e.g. its list
    // re-fetching) would wipe out an already-loaded document via the
    // setDocument below, with nothing left to restore it since the fetch
    // itself is correctly skipped as a dupe.
    if (fetchedDocumentIdRef.current === documentId) return;

    setDocument(initialDocument);
    setIsDocumentLoading(!initialDocument?.fileUrl);
    setDocumentLoadError(null);
    fetchedDocumentIdRef.current = documentId;
    let cancelled = false;
    getDocument(documentId)
      .then((detail) => {
        if (!cancelled) {
          setDocument(detail);
          setIsDocumentLoading(false);
        }
      })
      .catch(() => {
        // Keep the list item or filename fallback, and allow a retry if the
        // id comes back around (e.g. the list resolves after this failed).
        if (!cancelled) {
          fetchedDocumentIdRef.current = null;
          setIsDocumentLoading(false);
          if (!initialDocument?.fileUrl) {
            setDocumentLoadError(
              "We couldn't load this document. Check your access and try again.",
            );
          }
        }
      });

    return () => {
      cancelled = true;
    };
    // initialDocument is intentionally not a dep: the parent's document list
    // re-fetches independently and hands us a new object identity for the
    // same id, which used to re-trigger this effect and double-fetch the
    // document. Only an actual id or previewParam change should re-run it,
    // and the ref guard above still applies even then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentLoadAttempt, initialDocument?.id, previewDocumentId]);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Restore an already-generated summary on mount/navigation so it survives a
  // reload or a trip away and back — without ever calling the quota-charging
  // create endpoint. A document that was never summarized just gets null back
  // and stays untouched (idle, panel closed).
  useEffect(() => {
    if (!document?.id || !document?.isOwner) return;

    let cancelled = false;
    const generation = ++pollGenerationRef.current;

    getExistingDocumentSummary(document.id)
      .then((record) => {
        if (cancelled || !record) return;

        setSummaryRecord(record);
        setShowSummaryPanel(true);

        if (record.status === "COMPLETED") {
          setSummaryPhase("done");
        } else if (record.status === "FAILED") {
          setSummaryError({ message: record.error || "Summary generation failed." });
          setSummaryPhase("error");
        } else {
          setSummaryPhase("polling");
          pollSummary(record._id, generation, Date.now());
        }
      })
      .catch(() => {
        // No existing summary to restore — leave the panel closed and idle.
      });

    return () => {
      cancelled = true;
    };
  }, [document?.id, document?.isOwner]);

  const viewerSrc = (() => {
    if (!document?.fileUrl) return "";
    const ext = fileType.toLowerCase();
    if (["pptx", "ppt", "docx", "doc", "xlsx", "xls"].includes(ext)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}&embedded=true`;
    }
    return document.fileUrl;
  })();

  function closePreview() {
    navigate("/library", { replace: true });
  }

  function pollSummary(artifactId: string, generation: number, startedAt: number) {
    pollTimeoutRef.current = window.setTimeout(async () => {
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
          setSummaryError({ message: record.error || "Summary generation failed." });
          setSummaryPhase("error");
          return;
        }
        if (Date.now() - startedAt >= SUMMARY_POLL_TIMEOUT_MS) {
          setSummaryError({
            message: "Still processing — reopen this panel in a moment to see the result.",
          });
          setSummaryPhase("error");
          return;
        }
        setSummaryRecord(record);
        pollSummary(artifactId, generation, startedAt);
      } catch {
        if (generation !== pollGenerationRef.current) return;
        setSummaryError({ message: "Lost connection while checking the summary status." });
        setSummaryPhase("error");
      }
    }, SUMMARY_POLL_INTERVAL_MS);
  }

  async function handleSummarize() {
    if (!document?.id) return;
    if (summaryPhase === "starting" || summaryPhase === "polling") return;

    setSummaryPhase("starting");
    setSummaryError(null);
    const generation = ++pollGenerationRef.current;

    try {
      const { record, status } = await createDocumentSummary(document.id);

      if (status === 202) {
        notifyAiUsageChanged();
      }

      if (record.status === "COMPLETED") {
        setSummaryRecord(record);
        setSummaryPhase("done");
        return;
      }
      if (record.status === "FAILED") {
        setSummaryRecord(record);
        setSummaryError({ message: record.error || "Summary generation failed." });
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
        message: caughtError instanceof Error ? caughtError.message : "Unable to create summary.",
      });
      setSummaryPhase("idle");
    }
  }

  return (
    <main className="fixed inset-0 z-50 flex min-w-0 flex-col overflow-hidden bg-[#282828] text-foreground">
      <header className="flex shrink-0 flex-col border-b border-[#4B4B4B] bg-[#3C3C3C] ">
        <div className="flex min-h-16 min-w-0 items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white/80 hover:text-white hover:bg-white/10 [&>svg]:size-6!"
              aria-label="Close preview"
              onClick={closePreview}
            >
              <X aria-hidden="true" />
            </Button>

            <IconTile fileName={document?.fileName} size={"sm"} />

            <div className="flex min-w-0 flex-col gap-1 text-white">
              <div className="flex min-w-0 items-center gap-2 text-lg">
                {isDocumentLoading ? (
                  <Skeleton className="h-4 w-44 bg-white/15" />
                ) : (
                  <strong className="truncate text-sm font-medium">
                    {previewTitle}
                  </strong>
                )}
              </div>
            </div>
          </div>

          {document?.isOwner ? (
            <ButtonGroup>
              <Button
                size="lg"
                className="bg-accent/90 text-primary hover:bg-accent"
                onClick={() => setShowSummaryPanel((open) => !open)}
              >
                <Sparkles data-icon="inline-start" aria-hidden="true" />
                Summarize
              </Button>
            </ButtonGroup>
          ) : null}
        </div>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden">
        {isDocumentLoading ? (
          <div
            aria-live="polite"
            className="flex h-full flex-col items-center justify-center gap-3 px-6 text-sm text-white/80"
          >
            <Skeleton className="h-4 w-40 bg-white/15" />
            <Skeleton className="h-3 w-56 bg-white/10" />
            <span className="sr-only">Loading document preview</span>
          </div>
        ) : documentLoadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white">
            <p>{documentLoadError}</p>
            <Button
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setDocumentLoadAttempt((attempt) => attempt + 1)}
              type="button"
              variant="outline"
            >
              Try again
            </Button>
          </div>
        ) : viewerSrc ? (
          <iframe
            className="h-full w-full border-0"
            src={document?.fileUrl ? viewerSrc : ""}
            title={previewTitle}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-sm text-white">
            Preview unavailable.
          </div>
        )}

        {showSummaryPanel && document?.isOwner ? (
          <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-md flex-col overflow-hidden border-l border-border/60 bg-background text-foreground shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold">AI summary</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {summaryPhase === "done" &&
                summaryRecord?.content &&
                "markdown" in summaryRecord.content ? (
                  <>
                    <CopyButton text={summaryRecord.content.markdown} />
                    <Button
                      onClick={() => setIsSummaryShareOpen(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Share
                    </Button>
                  </>
                ) : null}
                <Button
                  onClick={() => setShowSummaryPanel(false)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
              {summaryPhase === "idle" || summaryPhase === "error" ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Get a quick AI-generated overview of this document.
                  </p>
                  <Button onClick={handleSummarize} type="button">
                    <Sparkles data-icon="inline-start" aria-hidden="true" />
                    {summaryPhase === "error" ? "Retry summary" : "Summarize with AI"}
                  </Button>
                  <QuotaBadge />
                </div>
              ) : null}

              {summaryPhase === "starting" || summaryPhase === "polling" ? (
                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5 animate-pulse" aria-hidden="true" />
                    Generating summary...
                  </p>
                </div>
              ) : null}

              {summaryPhase === "error" && summaryError ? (
                <Alert variant="destructive">
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
                        <Link className="inline-flex items-center gap-1 font-semibold underline" to="/profile">
                          Add your own API key
                        </Link>
                      </div>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              {summaryPhase === "done" &&
              summaryRecord?.content &&
              "markdown" in summaryRecord.content ? (
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className={MARKDOWN_PREVIEW_CLASS}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summaryRecord.content.markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </section>

      <SummaryShareDialog
        artifactId={summaryRecord?._id ?? null}
        onOpenChange={setIsSummaryShareOpen}
        open={isSummaryShareOpen}
        title={document?.title}
      />
    </main>
  );
}

export default DocumentPreviewPage;
