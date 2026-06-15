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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="celestial-card border border-border/80 p-6 max-w-md w-full shadow-2xl bg-card/90 text-card-foreground backdrop-blur flex flex-col gap-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="admin-icon-badge admin-tone-orange flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Duplicate Document Found</h3>
            <p className="text-xs text-muted-foreground">Naming Conflict detected</p>
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            type="button"
          >
            Replace existing document
          </button>
          
          <button
            onClick={() => resolveConflict(currentId, "KEEP_BOTH")}
            className="w-full border border-border bg-secondary/30 hover:bg-secondary/70 text-secondary-foreground font-semibold py-2.5 rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center justify-center gap-2"
            type="button"
          >
            <Files className="size-4" />
            Keep both (renames incoming file)
          </button>

          <button
            onClick={() => resolveConflict(currentId, "CANCEL")}
            className="w-full text-muted-foreground hover:text-foreground font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
            type="button"
          >
            Cancel upload
          </button>
        </div>
      </div>
    </div>
  );
}
