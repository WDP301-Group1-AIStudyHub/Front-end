import type { FC } from "react";
import { FileText, X } from "lucide-react";
import type { DocumentItem } from "@/types/document";

export type SelectedDocumentChipsProps = {
  documents: DocumentItem[];
  onRemove: (id: string) => void;
};

/**
 * The visible result of an `@` mention. Without this the only feedback for a
 * mention is a checkbox in a side panel, which is offscreen on narrow layouts
 * and absent entirely on /ask.
 */
export const SelectedDocumentChips: FC<SelectedDocumentChipsProps> = ({
  documents,
  onRemove,
}) => {
  if (documents.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 pt-2 pb-1">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border-border/80 bg-muted/80 text-foreground hover:bg-muted inline-flex max-w-64 items-center gap-1.5 truncate rounded-md border px-2 py-1 text-xs transition-colors"
        >
          <FileText className="text-muted-foreground size-3.5 shrink-0" />
          <span className="truncate font-medium">{doc.fileName}</span>
          <button
            type="button"
            onClick={() => onRemove(doc.id)}
            className="hover:bg-background/80 text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${doc.fileName}`}
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
