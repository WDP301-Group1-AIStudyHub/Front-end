import { useUploadStore } from "@/store/useUploadStore";
import { AlertTriangle, FileText, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from '@/components/shared/IconTile';
import { getFileIconColorClass } from "@/utils/formatters";

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
      <Card className="flex w-full max-w-md flex-col gap-5 p-6 text-card-foreground">
        <div className="flex items-center gap-3">
          <IconTile tone="warning" size="lg">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </IconTile>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Duplicate document found</h3>
            <p className="text-xs text-muted-foreground">Filename conflict detected</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <FileText className={`size-5 shrink-0 ${getFileIconColorClass(payload.file.name)}`} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {payload.file.name}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          A document with this filename already exists in your study library. Overwriting it will update its content while preserving its RAG chat association.
        </p>

        <div className="flex flex-col gap-2.5 mt-2">
          <Button
            className="w-full"
            onClick={() => resolveConflict(currentId, "REPLACE")}
            size="lg"
            type="button"
          >
            Replace existing document
          </Button>

          <Button
            className="w-full"
            onClick={() => resolveConflict(currentId, "KEEP_BOTH")}
            size="lg"
            type="button"
            variant="outline"
          >
            <Files data-icon="inline-start" aria-hidden="true" />
            Keep both (renames incoming file)
          </Button>

          <Button
            className="w-full text-muted-foreground"
            onClick={() => resolveConflict(currentId, "CANCEL")}
            size="lg"
            type="button"
            variant="ghost"
          >
            Cancel upload
          </Button>
        </div>
      </Card>
    </div>
  );
}
