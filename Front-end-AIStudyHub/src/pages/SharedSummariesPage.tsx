import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RefreshCw, Sparkles, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { CopyButton } from "@/components/chat/artifacts/ArtifactPreviewDialog";
import { MARKDOWN_PREVIEW_CLASS } from "@/components/chat/artifacts/artifactTypes";
import { recordToCopyText } from "@/components/chat/artifacts/artifactTypes";
import {
  getArtifactById,
  listSummariesSharedWithMe,
  type SharedArtifactEntry,
} from "@/services/artifactApi";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90000;

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function SharedSummariesPage() {
  const [entries, setEntries] = useState<SharedArtifactEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;
    listSummariesSharedWithMe()
      .then((next) => {
        if (!cancelled) setEntries(next);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any entry still generating when the list loads gets polled until it
  // settles — the owner may have kicked off the summary moments before
  // sharing it, so "shared" doesn't imply "already COMPLETED".
  useEffect(() => {
    const timers = pollTimers.current;

    entries.forEach((entry) => {
      const { artifact } = entry;
      if (artifact.status !== "PENDING" && artifact.status !== "GENERATING") {
        return;
      }
      if (timers.has(artifact._id)) return;

      const startedAt = Date.now();
      const interval = setInterval(() => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          clearInterval(interval);
          timers.delete(artifact._id);
          return;
        }

        getArtifactById(artifact._id)
          .then((updated) => {
            setEntries((current) =>
              current.map((item) =>
                item.artifact._id === updated._id
                  ? { ...item, artifact: updated }
                  : item,
              ),
            );
            if (updated.status === "COMPLETED" || updated.status === "FAILED") {
              clearInterval(interval);
              timers.delete(artifact._id);
            }
          })
          .catch(() => {
            clearInterval(interval);
            timers.delete(artifact._id);
          });
      }, POLL_INTERVAL_MS);

      timers.set(artifact._id, interval);
    });

    return () => {
      timers.forEach((interval) => clearInterval(interval));
      timers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const selected = entries.find((entry) => entry.artifact._id === selectedId);

  return (
    <PageShell>
      <PageHeader
        title="Shared Summaries"
        description="AI summaries other people have shared with you. You can read these without access to the original document."
      />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((key) => (
              <Skeleton className="h-40 w-full" key={key} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <Users
              aria-hidden="true"
              className="mx-auto mb-2 size-6 text-muted-foreground"
            />
            No one has shared a summary with you yet.
          </p>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
            <ul className="flex flex-col gap-3">
              {entries.map((entry) => {
                const { artifact, sharedBy, sharedAt } = entry;
                const isActive = artifact._id === selectedId;
                return (
                  <li key={artifact._id}>
                    <button
                      className={`moonlit-card flex w-full flex-col gap-1 p-4 text-left transition ${
                        isActive ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedId(artifact._id)}
                      type="button"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Sparkles aria-hidden="true" className="size-4" />
                        {artifact.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Shared by{" "}
                        {sharedBy?.fullName ?? sharedBy?.email ?? "someone"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(sharedAt)}
                      </span>
                      {artifact.status !== "COMPLETED" ? (
                        <span className="status-badge status-info mt-1 w-fit">
                          {artifact.status === "FAILED" ? (
                            "Failed"
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <RefreshCw
                                className="size-3 animate-spin"
                                aria-hidden="true"
                              />
                              Generating
                            </span>
                          )}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="moonlit-card min-w-0 p-5">
              {!selected ? (
                <p className="text-sm text-muted-foreground">
                  Select a summary from the list to read it.
                </p>
              ) : selected.artifact.status === "FAILED" ? (
                <p className="text-sm text-destructive">
                  This summary failed to generate. Ask the owner to retry it.
                </p>
              ) : selected.artifact.status !== "COMPLETED" ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Still generating — this will update automatically.
                </p>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      {selected.artifact.title}
                    </h2>
                    <CopyButton text={recordToCopyText(selected.artifact)} />
                  </div>
                  <div className={MARKDOWN_PREVIEW_CLASS}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selected.artifact.content &&
                      "markdown" in selected.artifact.content
                        ? selected.artifact.content.markdown
                        : ""}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </PageShell>
  );
}
