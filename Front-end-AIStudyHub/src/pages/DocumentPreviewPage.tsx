import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, LockIcon, X } from "lucide-react";

import type { DocumentItem } from "@/types/document";
import { Button } from "@/components/ui/button";

import { IconTile } from "@/components/shared/IconTile";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getPreviewTitle(previewParam: string): string {
  const decoded = safeDecode(previewParam).split(/[\\/]/).pop() ?? previewParam;
  const withoutQuery = decoded.split("?")[0] || decoded;

  return withoutQuery.replace(/\.[^/.]+$/, "") || "Preview";
}

export function getPreviewFileType(previewParam: string): string {
  const decoded = safeDecode(previewParam).split("?")[0];
  const extension = decoded.match(/\.([a-z0-9]+)$/i)?.[1];

  return (extension || "txt").toUpperCase();
}

export interface DocumentPreviewPageProps {
  document: DocumentItem | null;
  previewParam: string;
}

export function DocumentPreviewPage({
  document,
  previewParam,
}: DocumentPreviewPageProps) {
  const navigate = useNavigate();
  const previewTitle = document
    ? getPreviewTitle(document.fileName || document.title)
    : getPreviewTitle(previewParam);
  const fileType = getPreviewFileType(document?.fileName || previewParam);

  const viewerSrc = (() => {
    if (!document?.fileUrl) return "";
    const ext = fileType.toLowerCase();
    if (["pptx", "ppt", "docx", "doc", "xlsx", "xls"].includes(ext)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}&embedded=true`;
    }
    return document.fileUrl;
  })();

  function closePreview() {
    navigate("/library", { replace: true });
  }

  return (
    <main className="fixed inset-0 z-50 flex min-w-0 flex-col overflow-hidden bg-[#282828] text-foreground">
      <header className="flex shrink-0 flex-col border-b border-[#4B4B4B] bg-[#3C3C3C] ">
        <div className="flex min-h-16 min-w-0 items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white/80 hover:text-white hover:bg-white/10 [&>svg]:size-6!"
              aria-label="Close preview"
              onClick={closePreview}
            >
              <X aria-hidden="true" />
            </Button>

            <IconTile fileName={document?.fileName} size={"sm"} />

            <div className="flex min-w-0 flex-col gap-1 text-white">
              <div className="flex min-w-0 items-center gap-2 text-lg">
                <strong className="truncate text-sm font-medium">
                  {previewTitle}
                </strong>
              </div>

              <nav
                className="flex flex-wrap items-center -ml-2 -mt-1"
                aria-label="Preview menu"
              >
                {["File", "Edit", "View", "Help"].map((item) => (
                  <Button
                    className="text-sm font-normal text-white/80 hover:text-white hover:bg-white/10 h-6 px-2"
                    variant="ghost"
                    size="sm"
                    key={item}
                  >
                    {item}
                  </Button>
                ))}
              </nav>
            </div>
          </div>

          <ButtonGroup>
            <Button
              size="lg"
              className="bg-accent/90 text-primary hover:bg-accent"
            >
              <LockIcon data-icon="inline-start" />
              Share
            </Button>
            <ButtonGroupSeparator />
            <Button
              size="icon-lg"
              className="bg-accent/90 text-primary hover:bg-accent"
            >
              <ChevronDownIcon data-icon="inline-start" />
            </Button>
          </ButtonGroup>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden">
        {viewerSrc ? (
          <iframe
            className="h-full w-full border-0"
            src={document?.fileUrl ? viewerSrc : ""}
            title={previewTitle}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-sm text-white">
            Preview unavailable.
          </div>
        )}
      </section>
    </main>
  );
}

export default DocumentPreviewPage;
