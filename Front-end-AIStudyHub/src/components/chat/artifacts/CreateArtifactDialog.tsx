import { Loader2, Plus, FileText, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import type {
  ArtifactType,
  InitiateArtifactPayload,
} from "@/services/artifactApi";
import type { DocumentItem } from "@/types/document";
import { TYPE_META } from "./artifactTypes";
import { Textarea } from "@/components/ui/textarea";

export interface SessionSource {
  id: string;
  title: string;
  subtitle?: string;
  type?: "document" | "chat_history";
}

export interface ArtifactScopeOptions {
  documentId?: string;
  documentIds?: string[];
  useChatHistory?: boolean;
}

const EMPTY_DOCS: DocumentItem[] = [];

export function CreateArtifactDialog({
  type,
  onClose,
  onCreate,
  scopeHint = "Generated from the selected sources or conversation history.",
  attachedDocuments = EMPTY_DOCS,
  sources,
}: {
  type: ArtifactType | null;
  onClose: () => void;
  onCreate: (
    type: ArtifactType,
    instructions: string,
    scopeOptions?: Omit<
      InitiateArtifactPayload,
      "type" | "instructions" | "threadId"
    >,
  ) => Promise<void>;
  scopeHint?: string;
  attachedDocuments?: DocumentItem[];
  sources?: SessionSource[];
}) {
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize inputs to SessionSource format
  const effectiveSources: SessionSource[] = useMemo(() => {
    if (sources && sources.length > 0) return sources;
    if (attachedDocuments && attachedDocuments.length > 0) {
      return attachedDocuments.map((doc) => ({
        id: doc.id,
        title: doc.title || doc.fileName,
        subtitle:
          typeof doc.subject === "object" && doc.subject?.name
            ? doc.subject.name
            : typeof doc.subject === "string"
              ? doc.subject
              : doc.fileType?.toUpperCase() || "DOCUMENT",
        type: "document" as const,
      }));
    }
    return [];
  }, [sources, attachedDocuments]);

  // Primitive key for stable useEffect dependency comparison
  const sourcesKey = useMemo(
    () => effectiveSources.map((s) => s.id).join(","),
    [effectiveSources],
  );

  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [useChatHistory, setUseChatHistory] = useState<boolean>(false);

  // Initialize source selection whenever dialog opens or type/sources change
  useEffect(() => {
    if (type === null) return;

    setInstructions("");
    setSubmitting(false);
    setError(null);

    if (effectiveSources.length > 0) {
      setSelectedSourceIds(effectiveSources.map((s) => s.id));
      setUseChatHistory(false);
    } else {
      setSelectedSourceIds([]);
      setUseChatHistory(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, sourcesKey]);

  const hasAttachedDocs = effectiveSources.length > 0;
  const selectedCount = selectedSourceIds.length;
  const allSelected =
    hasAttachedDocs && selectedCount === effectiveSources.length;
  const canSubmit = !submitting && (selectedCount > 0 || useChatHistory);

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(effectiveSources.map((s) => s.id));
    }
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const submit = async () => {
    if (!type || submitting || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const scopeOptions: Omit<
        InitiateArtifactPayload,
        "type" | "instructions" | "threadId"
      > = {
        documentIds: selectedCount > 0 ? selectedSourceIds : undefined,
        documentId: selectedCount === 1 ? selectedSourceIds[0] : undefined,
      };
      await onCreate(type, instructions.trim(), scopeOptions);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start generation. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={type !== null}>
      <DialogContent className="sm:max-w-md">
        {type && (
          <>
            <DialogHeader>
              <DialogTitle>
                Create {TYPE_META[type].label.toLowerCase()}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Topic or Focus Input */}
              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="artifact-topic"
                >
                  Topic or focus (optional)
                </label>
                <Textarea
                  id="artifact-topic"
                  onChange={(event) => setInstructions(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && canSubmit) {
                      event.preventDefault();
                      void submit();
                    }
                  }}
                  className="mt-2"
                  placeholder="e.g. Chapter 3: normalization and functional dependencies"
                  value={instructions}
                />
              </div>

              {/* Source Scope Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Sources ({selectedCount} selected)
                  </label>
                  {effectiveSources.length > 1 && (
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2 space-y-1">
                  {hasAttachedDocs ? (
                    effectiveSources.map((source) => {
                      const isChecked = selectedSourceIds.includes(source.id);
                      return (
                        <label
                          key={source.id}
                          className="flex items-center gap-2.5 rounded-md p-1.5 text-sm hover:bg-muted/60 cursor-pointer select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(source.id)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary/40 accent-primary"
                          />
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <div className="flex flex-col truncate min-w-0 flex-1">
                            <span className="font-medium text-foreground truncate leading-tight">
                              {source.title}
                            </span>
                            {source.subtitle && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                {source.subtitle}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <label className="flex items-center gap-2.5 rounded-md p-1.5 text-sm text-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={useChatHistory}
                        onChange={(e) => setUseChatHistory(e.target.checked)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary/40 accent-primary"
                      />
                      <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Use conversation history as source
                      </span>
                    </label>
                  )}
                </div>

                {!canSubmit && (
                  <p className="text-[11px] text-destructive font-medium">
                    Please select at least one source or history.
                  </p>
                )}
                {canSubmit && (
                  <p className="text-xs text-muted-foreground">{scopeHint}</p>
                )}
              </div>

              <FieldError className="text-xs">{error}</FieldError>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button disabled={!canSubmit} onClick={() => void submit()}>
                {submitting ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus className="size-3.5" aria-hidden="true" />
                )}
                {`Create (${
                  selectedCount > 0
                    ? `${selectedCount} Source${selectedCount > 1 ? "s" : ""}`
                    : "Chat History"
                })`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
