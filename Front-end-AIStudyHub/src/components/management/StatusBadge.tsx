import { Badge } from '@/components/ui/badge'
import type { UploadSession } from '../../types/document'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

const toneClasses: Record<StatusTone, string> = {
  error: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  neutral: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  warning: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
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
    <Badge
      className={`min-h-6 uppercase tracking-[0.08em] ${toneClasses[statusTone(status)]}`}
    >
      {status || 'UNKNOWN'}
    </Badge>
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
