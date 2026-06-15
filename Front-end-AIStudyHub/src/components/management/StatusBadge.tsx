import type { UploadSession } from '../../types/document'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

const toneClasses: Record<StatusTone, string> = {
  error: 'border-red-400/30 bg-red-500/10 text-red-200',
  info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  neutral: 'border-border bg-muted/40 text-muted-foreground',
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
}

function statusTone(status: string): StatusTone {
  const normalized = status.toUpperCase()

  if (normalized === 'COMPLETED' || normalized === 'ACTIVE') {
    return 'success'
  }

  if (normalized === 'FAILED') {
    return 'error'
  }

  if (normalized === 'PROCESSING') {
    return 'info'
  }

  if (normalized === 'PENDING') {
    return 'warning'
  }

  return 'neutral'
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-semibold uppercase tracking-[0.08em] ${toneClasses[statusTone(status)]}`}
    >
      {status || 'UNKNOWN'}
    </span>
  )
}

export function getUploadStageLabel(stage: UploadSession['stage'] | undefined): string {
  switch (stage) {
    case 'UPLOADED':
      return 'Uploading'
    case 'EXTRACTING_TEXT':
      return 'Extracting Text'
    case 'CHUNKING':
      return 'Chunking'
    case 'EMBEDDING':
      return 'Creating Embeddings'
    case 'UPSERTING_VECTOR':
      return 'Indexing Vectors'
    case 'COMPLETED':
      return 'Completed'
    default:
      return 'Uploading'
  }
}
