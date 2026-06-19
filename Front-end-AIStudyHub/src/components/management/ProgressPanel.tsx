import { Loader2 } from 'lucide-react'
import type { UploadSession } from '../../types/document'
import { getUploadStageLabel, StatusBadge } from './StatusBadge'

export function ProgressPanel({
  error,
  session,
}: {
  error?: string | null
  session: UploadSession | null
}) {
  const progress = Math.max(0, Math.min(100, Math.round(session?.progress ?? 0)))
  const status = session?.status ?? 'PENDING'

  return (
    <div className="moonlit-card tone-surface tone-cyan flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{getUploadStageLabel(session?.stage)}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs font-semibold text-muted-foreground">
          {progress}%
        </span>
      </div>
      {session?.message ? (
        <p className="text-sm text-muted-foreground">{session.message}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
