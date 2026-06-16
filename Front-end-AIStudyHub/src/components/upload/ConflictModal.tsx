import { useUploadStore } from "../../store/useUploadStore";
import { AlertTriangle, FileText, Files } from "lucide-react";

export default function ConflictModal() {
  const stagedConflicts = useUploadStore((state) => state.stagedConflicts);
  const resolveConflict = useUploadStore((state) => state.resolveConflict);

  const conflictIds = Object.keys(stagedConflicts);
  if (conflictIds.length === 0) return null;

  // Handle multiple duplicates sequentially by pulling the first one
  const currentId = conflictIds[0];
  const conflict = stagedConflicts[currentId];
  if (!conflict) return null;

  const { payload } = conflict;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 animate-fade-in">
      <div className="celestial-card flex w-full max-w-md flex-col gap-5 p-6 text-card-foreground">
        <div className="flex items-center gap-3">
          <div className="admin-icon-badge admin-tone-gold flex size-12 shrink-0 items-center justify-center rounded-xl">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Duplicate document found</h3>
            <p className="text-xs text-muted-foreground">Filename conflict detected</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <FileText className="size-5 text-muted-foreground shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {payload.file.name}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          A document with this filename already exists in your study library. Overwriting it will update its content while preserving its RAG chat association.
        </p>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={() => resolveConflict(currentId, "REPLACE")}
            className="w-full cursor-pointer rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]"
            type="button"
          >
            Replace existing document
          </button>
          
          <button
            onClick={() => resolveConflict(currentId, "KEEP_BOTH")}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
            type="button"
          >
            <Files className="size-4" />
            Keep both (renames incoming file)
          </button>

          <button
            onClick={() => resolveConflict(currentId, "CANCEL")}
            className="w-full cursor-pointer rounded-lg py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            type="button"
          >
            Cancel upload
          </button>
        </div>
      </div>
    </div>
  );
}
