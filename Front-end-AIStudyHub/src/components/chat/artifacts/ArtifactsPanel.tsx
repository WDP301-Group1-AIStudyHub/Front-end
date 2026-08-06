import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ArtifactRecord, ArtifactType } from "@/services/artifactApi";
import { useArtifacts } from "./artifactsStore";
import { TYPE_META } from "./artifactTypes";
import { ArtifactPreviewDialog } from "./ArtifactPreviewDialog";
import { CreateArtifactDialog } from "./CreateArtifactDialog";

export function ArtifactsPanel({ className }: { className?: string }) {
  const { artifacts, create, remove, retry } = useArtifacts();
  const [isOpen, setIsOpen] = useState(true);
  const [createType, setCreateType] = useState<ArtifactType | null>(null);
  const [previewRecord, setPreviewRecord] = useState<ArtifactRecord | null>(
    null,
  );

  const typesList: ArtifactType[] = [
    "FLASHCARD",
    "QUIZ",
    "MINDMAP",
    "REPORT",
    "DATA_TABLE",
  ];

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`w-full rounded-xl border border-border bg-card shadow-sm ${
          className ?? ""
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center w-full justify-between gap-2 text-sm font-medium text-foreground hover:opacity-80 transition-opacity cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-center gap-2">
                <span>Artifacts</span>
                {artifacts.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {artifacts.length}
                  </span>
                )}
              </div>
              {isOpen ? (
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="p-3 space-y-3">
          {/* Quick Create Buttons */}
          <div className="flex flex-wrap gap-1.5 pb-3 border-b border-border/50">
            {typesList.map((type) => {
              const meta = TYPE_META[type];
              const Icon = meta.icon;
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 rounded-lg border-border/60 text-muted-foreground hover:text-foreground"
                  onClick={() => setCreateType(type)}
                >
                  <Icon className="size-3.5" />
                  {meta.label}
                  <Plus className="size-3 opacity-60" />
                </Button>
              );
            })}
          </div>

          {/* Artifact List */}
          {artifacts.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No artifacts yet. Pick a type above, or ask the assistant to make
              one.
            </p>
          ) : (
            <div className="space-y-2 pr-1">
              {artifacts.map((record) => {
                const meta = TYPE_META[record.type] ?? TYPE_META.REPORT;
                const Icon = meta.icon;
                const isPending =
                  record.status === "PENDING" || record.status === "GENERATING";
                const isFailed = record.status === "FAILED";

                if (isFailed) {
                  return (
                    <div
                      key={record._id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TriangleAlert className="size-4 shrink-0" />
                        <span className="truncate font-medium">
                          {record.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => void retry(record)}
                          className="text-destructive hover:bg-destructive/15 hover:text-destructive cursor-pointer"
                          aria-label="Retry artifact generation"
                        >
                          <RotateCw className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => remove(record._id)}
                          className="text-destructive hover:bg-destructive/15 hover:text-destructive cursor-pointer"
                          aria-label="Delete artifact"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={record._id}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setPreviewRecord(record)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer disabled:cursor-wait outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                      ) : (
                        <Icon className="size-4 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">
                          {record.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {isPending ? "Generating..." : meta.label}
                        </div>
                      </div>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => remove(record._id)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer transition-opacity"
                      aria-label="Delete artifact"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <CreateArtifactDialog
        type={createType}
        onClose={() => setCreateType(null)}
        onCreate={async (type, instructions, scopeOptions) => {
          await create(type, instructions, scopeOptions);
        }}
      />

      <ArtifactPreviewDialog
        record={previewRecord}
        onClose={() => setPreviewRecord(null)}
      />
    </>
  );
}
