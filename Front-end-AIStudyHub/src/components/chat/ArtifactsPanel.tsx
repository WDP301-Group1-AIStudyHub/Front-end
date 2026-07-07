import {
  CheckIcon,
  Code2,
  CopyIcon,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  Network,
  Plus,
  RotateCw,
  Sparkles,
  StickyNote,
  Table,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FlashcardStudy from "../shared/FlashcardStudy";
import McqQuiz from "../shared/McqQuiz";
import { MindmapView } from "./MindmapView";
import type { IMcqItem, StudyMaterial } from "../../services/studyMaterialApi";
import type {
  ArtifactRecord,
  ArtifactType,
  MindmapNode,
} from "../../services/artifactApi";
import type { ArtifactKind, ChatArtifact } from "../../utils/extractArtifacts";

const KIND_ICONS: Record<ArtifactKind, typeof Code2> = {
  code: Code2,
  table: Table,
  note: StickyNote,
};

const KIND_LABELS: Record<ArtifactKind, string> = {
  code: "Code",
  table: "Table",
  note: "Note",
};

const TYPE_META: Record<
  ArtifactType,
  { label: string; icon: typeof Code2 }
> = {
  FLASHCARD: { label: "Flashcards", icon: Layers },
  QUIZ: { label: "Quiz", icon: ListChecks },
  MINDMAP: { label: "Mind map", icon: Network },
  REPORT: { label: "Report", icon: FileText },
  DATA_TABLE: { label: "Data table", icon: Table },
};

const MARKDOWN_PREVIEW_CLASS =
  "artifact-preview max-h-[60vh] min-w-0 overflow-y-auto text-sm leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_code]:font-mono [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:font-semibold [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5";

function dataTableToMarkdown(columns: string[], rows: string[][]): string {
  const escape = (cell: string) => cell.replace(/\|/g, "\\|");
  return [
    `| ${columns.map(escape).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

function recordToCopyText(record: ArtifactRecord): string {
  const content = record.content;
  if (!content) return record.title;
  if ("markdown" in content) return content.markdown;
  if ("columns" in content)
    return dataTableToMarkdown(content.columns, content.rows);
  return JSON.stringify(content, null, 2);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      className="gap-2"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => setCopied(true))
          .catch(() => {});
      }}
      size="sm"
      variant="outline"
    >
      {copied ? (
        <CheckIcon className="size-3.5" aria-hidden="true" />
      ) : (
        <CopyIcon className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy markdown"}
    </Button>
  );
}

function ArtifactBadge({ artifact }: { artifact: ChatArtifact }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      {artifact.kind === "code" && artifact.language
        ? artifact.language
        : KIND_LABELS[artifact.kind]}
    </span>
  );
}

// ── Derived artifact preview (markdown extracted from answers) ───────────────

function ArtifactPreviewDialog({
  artifact,
  onClose,
}: {
  artifact: ChatArtifact | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      onOpenChange={(open) => !open && onClose()}
      open={artifact !== null}
    >
      <DialogContent className="sm:max-w-2xl">
        {artifact && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 pe-8">
                <DialogTitle className="min-w-0 truncate">
                  {artifact.title}
                </DialogTitle>
                <ArtifactBadge artifact={artifact} />
              </div>
            </DialogHeader>
            <div className={MARKDOWN_PREVIEW_CLASS}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {artifact.content}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end">
              <CopyButton text={artifact.content} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Backend artifact preview (typed content) ─────────────────────────────────

function recordToStudyMaterial(record: ArtifactRecord): StudyMaterial {
  const items =
    record.content && "items" in record.content ? record.content.items : [];
  return {
    id: record._id,
    _id: record._id,
    title: record.title,
    userId: record.userId,
    documentId: record.sourceDocumentIds[0] ?? "",
    type: record.type === "QUIZ" ? "MCQ" : "FLASHCARD",
    status: record.status,
    items,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function BackendArtifactPreviewDialog({
  record,
  onClose,
}: {
  record: ArtifactRecord | null;
  onClose: () => void;
}) {
  const content = record?.content;
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={record !== null}>
      <DialogContent className="sm:max-w-3xl">
        {record && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 pe-8">
                <DialogTitle className="min-w-0 truncate">
                  {record.title}
                </DialogTitle>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {TYPE_META[record.type].label}
                </span>
              </div>
            </DialogHeader>

            {record.type === "FLASHCARD" && content && "items" in content && (
              <div className="max-h-[70vh] overflow-y-auto">
                <FlashcardStudy
                  material={recordToStudyMaterial(record)}
                  title={record.title}
                />
              </div>
            )}

            {record.type === "QUIZ" && content && "items" in content && (
              <div className="max-h-[70vh] overflow-y-auto">
                <McqQuiz
                  items={content.items as IMcqItem[]}
                  materialId={record._id}
                  title={record.title}
                />
              </div>
            )}

            {record.type === "REPORT" && content && "markdown" in content && (
              <>
                <div className={MARKDOWN_PREVIEW_CLASS}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content.markdown}
                  </ReactMarkdown>
                </div>
                <div className="flex justify-end">
                  <CopyButton text={content.markdown} />
                </div>
              </>
            )}

            {record.type === "DATA_TABLE" &&
              content &&
              "columns" in content && (
                <>
                  <div className="max-h-[60vh] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {content.columns.map((column, i) => (
                            <th
                              key={i}
                              className="border border-border bg-muted/60 px-2 py-1.5 text-left font-semibold"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {content.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="border border-border px-2 py-1.5"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <CopyButton text={recordToCopyText(record)} />
                  </div>
                </>
              )}

            {record.type === "MINDMAP" && content && "root" in content && (
              <MindmapView root={content.root as MindmapNode} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Create dialog ─────────────────────────────────────────────────────────────

function CreateArtifactDialog({
  type,
  onClose,
  onCreate,
}: {
  type: ArtifactType | null;
  onClose: () => void;
  onCreate: (type: ArtifactType, instructions: string) => Promise<void>;
}) {
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInstructions("");
    setSubmitting(false);
  }, [type]);

  const submit = async () => {
    if (!type || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(type, instructions.trim());
      onClose();
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
              <DialogTitle>Create {TYPE_META[type].label.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="artifact-topic"
              >
                Topic or focus (optional)
              </label>
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                id="artifact-topic"
                onChange={(event) => setInstructions(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder="e.g. Chapter 3: normalization and functional dependencies"
                value={instructions}
              />
              <p className="text-xs text-muted-foreground">
                Generated from the documents currently selected in Study
                Context.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={onClose} size="sm" variant="ghost">
                Cancel
              </Button>
              <Button disabled={submitting} onClick={() => void submit()} size="sm">
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-3.5" aria-hidden="true" />
                )}
                Create
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

type ArtifactsPanelProps = {
  artifacts: ChatArtifact[];
  backendArtifacts: ArtifactRecord[];
  onCreate: (type: ArtifactType, instructions: string) => Promise<void>;
  onDelete: (id: string) => void;
  onRetry: (record: ArtifactRecord) => void;
};

export function ArtifactsPanel({
  artifacts,
  backendArtifacts,
  onCreate,
  onDelete,
  onRetry,
}: ArtifactsPanelProps) {
  const [previewArtifact, setPreviewArtifact] = useState<ChatArtifact | null>(
    null,
  );
  const [previewRecord, setPreviewRecord] = useState<ArtifactRecord | null>(
    null,
  );
  const [createType, setCreateType] = useState<ArtifactType | null>(null);

  const totalCount = artifacts.length + backendArtifacts.length;

  return (
    <section className="border-b border-border pb-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <Sparkles className="size-4 text-foreground" aria-hidden="true" />
          Artifacts
        </div>
        {totalCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {totalCount}
          </span>
        )}
      </div>

      {/* Create buttons (NotebookLM studio style) */}
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {(Object.keys(TYPE_META) as ArtifactType[]).map((type) => {
          const { icon: Icon, label } = TYPE_META[type];
          return (
            <button
              key={type}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/35 px-2.5 py-2 text-left text-[11px] font-medium text-card-foreground transition-all hover:border-primary/40 hover:shadow-sm"
              onClick={() => setCreateType(type)}
              type="button"
            >
              <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <Plus
                className="size-3 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {/* Backend-generated artifacts */}
        {backendArtifacts.map((record) => {
          const { icon: Icon, label } = TYPE_META[record.type];
          const generating =
            record.status === "PENDING" || record.status === "GENERATING";
          const failed = record.status === "FAILED";
          return (
            <div
              key={record._id}
              className={`group/artifact flex w-full items-center gap-2 rounded-lg border p-3 text-left text-xs transition-all ${
                failed
                  ? "border-red-200 bg-red-50/50"
                  : "border-border/70 bg-background/35 hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                disabled={generating}
                onClick={() => {
                  if (record.status === "COMPLETED") setPreviewRecord(record);
                }}
                type="button"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                  {generating ? (
                    <Loader2
                      className="size-3 animate-spin text-primary"
                      aria-hidden="true"
                    />
                  ) : failed ? (
                    <TriangleAlert
                      className="size-3 text-red-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon className="size-3 text-primary" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-card-foreground">
                    {record.title}
                  </span>
                  {generating && (
                    <span className="block text-[10px] text-muted-foreground">
                      Generating...
                    </span>
                  )}
                  {failed && (
                    <span className="block truncate text-[10px] text-red-600">
                      {record.error || "Generation failed"}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {label}
                </span>
              </button>
              {failed && (
                <button
                  aria-label={`Retry ${record.title}`}
                  className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                  onClick={() => onRetry(record)}
                  type="button"
                >
                  <RotateCw className="size-3" aria-hidden="true" />
                </button>
              )}
              {!generating && (
                <button
                  aria-label={`Delete ${record.title}`}
                  className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background/70 hover:text-red-500"
                  onClick={() => onDelete(record._id)}
                  type="button"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}

        {/* Derived from answer markdown */}
        {artifacts.map((artifact) => {
          const Icon = KIND_ICONS[artifact.kind];
          return (
            <button
              key={artifact.id}
              className="group/artifact flex w-full items-center gap-2 rounded-lg border border-border/70 bg-background/35 p-3 text-left text-xs transition-all hover:border-primary/40 hover:shadow-sm"
              onClick={() => setPreviewArtifact(artifact)}
              type="button"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <Icon className="size-3 text-primary" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-card-foreground">
                {artifact.title}
              </span>
              <ArtifactBadge artifact={artifact} />
            </button>
          );
        })}
      </div>

      <ArtifactPreviewDialog
        artifact={previewArtifact}
        onClose={() => setPreviewArtifact(null)}
      />
      <BackendArtifactPreviewDialog
        onClose={() => setPreviewRecord(null)}
        record={previewRecord}
      />
      <CreateArtifactDialog
        onClose={() => setCreateType(null)}
        onCreate={onCreate}
        type={createType}
      />
    </section>
  );
}
