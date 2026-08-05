import { useState } from "react";
import { Loader2, RotateCw, TriangleAlert } from "lucide-react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";

import type { ArtifactRecord, ArtifactType } from "@/services/artifactApi";
import { useArtifacts } from "./artifactsStore";
import { TYPE_META } from "./artifactTypes";
import { ArtifactPreviewDialog } from "./ArtifactPreviewDialog";

export const ArtifactToolCard: ToolCallMessagePartComponent = ({
  args,
}) => {
  const { artifacts, retry } = useArtifacts();
  const [previewRecord, setPreviewRecord] = useState<ArtifactRecord | null>(
    null,
  );

  const typedArgs = args as {
    artifactId?: string;
    type?: ArtifactType;
    title?: string;
  };
  const artifactId = typedArgs.artifactId;
  const artifactType = typedArgs.type ?? "REPORT";
  const meta = TYPE_META[artifactType] ?? TYPE_META.REPORT;
  const Icon = meta.icon;

  const record = artifactId
    ? artifacts.find((a) => a._id === artifactId)
    : undefined;

  const status = record?.status ?? "GENERATING";
  const title = record?.title ?? typedArgs.title ?? meta.label;

  return (
    <>
      <div className="my-2.5">
        {status === "GENERATING" || status === "PENDING" || !record ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {title}
              </div>
              <div className="text-xs text-muted-foreground">
                Generating {meta.label.toLowerCase()} in background...
              </div>
            </div>
          </div>
        ) : status === "COMPLETED" ? (
          <button
            type="button"
            onClick={() => setPreviewRecord(record)}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-xs transition-colors hover:bg-muted/50 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {title}
              </div>
              <div className="text-xs text-muted-foreground">
                Click to view {meta.label.toLowerCase()}
              </div>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive shadow-xs">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/15">
              <TriangleAlert className="size-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {title}
              </div>
              <div className="text-xs opacity-90">
                {record.error || "Generation failed"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void retry(record)}
              className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium bg-destructive/15 hover:bg-destructive/25 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}
      </div>

      <ArtifactPreviewDialog
        record={previewRecord}
        onClose={() => setPreviewRecord(null)}
      />
    </>
  );
};
