import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUploadStore } from '@/store/useUploadStore'

export default function BackgroundUploadWidget() {
  const { uploads, cancelUpload, cancelAll, removeUpload, clearFinished } = useUploadStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'failed'>('all')

  if (uploads.length === 0) return null

  const activeCount = uploads.filter(
    (u) => u.status === 'uploading' || u.status === 'processing' || u.status === 'pending',
  ).length
  const completedCount = uploads.filter((u) => u.status === 'success').length
  const failedCount = uploads.filter((u) => u.status === 'failed').length

  const filteredUploads = uploads.filter((u) => {
    if (activeTab === 'completed') return u.status === 'success'
    if (activeTab === 'failed') return u.status === 'failed'
    return true
  })

  const getFileExtension = (fileName: string) => {
    const parts = fileName.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE'
  }

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 flex h-auto w-80 justify-between rounded-xl px-4 py-3 text-foreground shadow-sm"
        type="button"
        variant="outline"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {activeCount > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>
            {activeCount > 0
              ? `Uploading ${activeCount} item${activeCount > 1 ? 's' : ''}`
              : `Uploads complete (${completedCount} success)`}
          </span>
        </span>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card font-sans text-foreground shadow-[0_18px_48px_rgb(28_29_26/0.12)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-base font-semibold">Uploads</span>
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
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        {[
          ['all', `All (${uploads.length})`],
          ['completed', `Completed (${completedCount})`],
          ['failed', `Failed (${failedCount})`],
        ].map(([value, label]) => (
          <Button
            aria-pressed={activeTab === value}
            className="rounded-full px-3"
            key={value}
            onClick={() => setActiveTab(value as typeof activeTab)}
            size="xs"
            type="button"
            variant={activeTab === value ? 'default' : 'ghost'}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="px-4 py-2 text-[11px] text-muted-foreground">
        Uploading to <span className="font-medium text-foreground">Library</span>
      </div>

      <div className="max-h-64 flex-1 divide-y divide-border overflow-y-auto">
        {filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8 stroke-1 opacity-60" />
            <p className="text-xs">No uploads in this tab</p>
          </div>
        ) : (
          filteredUploads.map((item) => (
            <div key={item.id} className="relative flex flex-col p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="shrink-0 text-muted-foreground">
                    {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {item.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    {item.status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {item.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate pr-2 text-sm font-semibold" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {getFileExtension(item.fileName)}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {item.status === 'pending' && 'Queued'}
                        {item.status === 'uploading' && `Uploading (${item.progress}%)`}
                        {item.status === 'processing' && (item.progress >= 95 ? 'Indexing' : 'Extracting text')}
                        {item.status === 'success' && 'Completed'}
                        {item.status === 'failed' && (item.error || 'Failed')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.status === 'uploading' || item.status === 'processing' || item.status === 'pending' ? (
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
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-4.5 w-4.5" />
                    </Button>
                  )}
                </div>
              </div>

              {(item.status === 'uploading' || item.status === 'processing') && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div className="h-full bg-primary transition-all duration-200" style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {activeCount > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>
            {activeCount > 0
              ? `Uploading ${activeCount} item${activeCount > 1 ? 's' : ''}`
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
  )
}
