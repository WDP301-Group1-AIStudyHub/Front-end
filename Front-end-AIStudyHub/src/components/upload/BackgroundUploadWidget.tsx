import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadStore } from "@/store/useUploadStore";

const UPLOAD_WIDGET_TOAST_ID = "background-upload-widget";

function UploadWidgetCard({
  isExpanded,
  setIsExpanded,
  activeTab,
  setActiveTab,
}: {
  isExpanded: boolean;
  setIsExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeTab: "all" | "completed" | "failed";
  setActiveTab: (tab: "all" | "completed" | "failed") => void;
}) {
  const { uploads, cancelUpload, cancelAll, removeUpload, clearFinished } =
    useUploadStore();

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter(
    (u) =>
      u.status === "uploading" ||
      u.status === "processing" ||
      u.status === "pending",
  ).length;
  const completedCount = uploads.filter((u) => u.status === "success").length;
  const failedCount = uploads.filter((u) => u.status === "failed").length;

  const filteredUploads = uploads.filter((u) => {
    if (activeTab === "completed") return u.status === "success";
    if (activeTab === "failed") return u.status === "failed";
    return true;
  });

  const getFileExtension = (fileName: string) => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  };

  if (!isExpanded) {
    return (
      <div className="w-80 rounded-xl border border-border bg-card text-foreground p-1 shadow-lg pointer-events-auto">
        <div className="h-auto w-full flex items-center justify-between">
          <Button
            onClick={() => setIsExpanded(true)}
            className="flex-1 flex justify-between rounded-lg px-3 py-2 text-foreground"
            type="button"
            variant="ghost"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              {activeCount > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Upload className="h-4 w-4 text-primary" />
              )}
              <span>
                {activeCount > 0
                  ? `Uploading ${activeCount} item${activeCount > 1 ? "s" : ""}`
                  : `Uploads complete (${completedCount} success)`}
              </span>
            </span>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            onClick={() => toast.dismiss(UPLOAD_WIDGET_TOAST_ID)}
            className="text-muted-foreground w-auto h-auto p-2"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl pointer-events-auto">
      <div className="flex items-center justify-between p-2.5">
        <span className="text-base font-semibold px-1">Uploads</span>
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Button
              onClick={cancelAll}
              className="text-muted-foreground"
              size="xs"
              type="button"
              variant="outline"
            >
              Cancel all
            </Button>
          ) : null}
          <div>
            <Button
              aria-label="Collapse uploads"
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Collapse uploads"
              onClick={() => toast.dismiss(UPLOAD_WIDGET_TOAST_ID)}
              className="text-muted-foreground"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-border px-3.5 pb-2.5 border-b">
        {[
          ["all", `All (${uploads.length})`],
          ["completed", `Completed (${completedCount})`],
          ["failed", `Failed (${failedCount})`],
        ].map(([value, label]) => (
          <Button
            aria-pressed={activeTab === value}
            key={value}
            onClick={() => setActiveTab(value as typeof activeTab)}
            size="xs"
            type="button"
            variant={activeTab === value ? "default" : "ghost"}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="px-4 py-2 text-[11px] text-muted-foreground">
        Uploading to{" "}
        <span className="font-medium text-foreground">Library</span>
      </div>

      <div className="max-h-64 flex-1 divide-y divide-border overflow-y-auto scrollbar-thin">
        {filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8 stroke-1 opacity-60" />
            <p className="text-xs">No uploads in this tab</p>
          </div>
        ) : (
          filteredUploads.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col p-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="shrink-0 text-muted-foreground">
                    {item.status === "uploading" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {item.status === "processing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {item.status === "success" && !item.warning && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    {item.status === "success" && item.warning && (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    {item.status === "failed" && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    {item.status === "pending" && (
                      <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="truncate pr-2 text-sm font-semibold"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                        {getFileExtension(item.fileName)}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {item.status === "pending" && (item.message || "Queued")}
                        {item.status === "uploading" &&
                          (item.message || `Uploading (${item.progress}%)`)}
                        {item.status === "processing" &&
                          (item.message || `Processing (${item.progress}%)`)}
                        {item.status === "success" &&
                          !item.warning &&
                          "Completed"}
                        {item.status === "failed" && (item.error || "Failed")}
                      </span>
                      {item.status === "success" && item.warning && (
                        <span
                          className="truncate text-[11px] font-medium text-amber-600 dark:text-amber-400"
                          title={item.warning}
                        >
                          Uploaded — not searchable
                        </span>
                      )}
                    </div>
                    {item.status === "success" && item.warning && (
                      <span className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {item.warning}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {item.status === "uploading" ||
                  item.status === "processing" ||
                  item.status === "pending" ? (
                    <Button
                      onClick={() => cancelUpload(item.id)}
                      className="text-muted-foreground"
                      size="xs"
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      aria-label="Remove from list"
                      onClick={() => removeUpload(item.id)}
                      className="text-muted-foreground opacity-80 hover:opacity-100"
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-4.5 w-4.5" />
                    </Button>
                  )}
                </div>
              </div>

              {(item.status === "uploading" ||
                item.status === "processing") && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {activeCount > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Upload className="h-4 w-4 text-primary" />
          )}
          <span>
            {activeCount > 0
              ? `Uploading ${activeCount} item${activeCount > 1 ? "s" : ""}`
              : `All uploads completed (${completedCount} success)`}
          </span>
        </div>

        {activeCount === 0 ? (
          <Button
            onClick={clearFinished}
            className="text-muted-foreground"
            size="xs"
            type="button"
            variant="outline"
          >
            Clear all
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function BackgroundUploadWidget() {
  const uploads = useUploadStore((state) => state.uploads);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "failed">(
    "all",
  );

  useEffect(() => {
    if (uploads.length === 0) {
      toast.dismiss(UPLOAD_WIDGET_TOAST_ID);
      return;
    }

    toast.custom(
      () => (
        <UploadWidgetCard
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ),
      {
        id: UPLOAD_WIDGET_TOAST_ID,
        duration: Infinity,
        position: "bottom-right",
      },
    );
  }, [uploads, isExpanded, activeTab]);

  return null;
}
