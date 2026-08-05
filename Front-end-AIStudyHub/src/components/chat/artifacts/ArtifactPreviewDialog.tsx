import { CheckIcon, CopyIcon } from "lucide-react";
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
import FlashcardStudy from "@/components/shared/FlashcardStudy";
import McqQuiz from "@/components/shared/McqQuiz";
import { MindmapView } from "@/components/chat/MindmapView";
import type { IMcqItem } from "@/services/studyMaterialApi";
import type { ArtifactRecord, MindmapNode } from "@/services/artifactApi";
import {
  MARKDOWN_PREVIEW_CLASS,
  TYPE_META,
  recordToCopyText,
  recordToStudyMaterial,
} from "./artifactTypes";

export function CopyButton({ text }: { text: string }) {
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

export function ArtifactPreviewDialog({
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
