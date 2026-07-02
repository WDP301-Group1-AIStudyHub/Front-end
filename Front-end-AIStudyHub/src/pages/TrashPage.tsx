import { useEffect, useState } from 'react'
import { FileText, RotateCcw, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteDocumentPermanently,
  emptyTrash,
  listTrashDocuments,
  restoreDocument,
} from '../services/documentApi'
import type { DocumentItem, DocumentSubject } from '../types/document'
import { getFileBadgeClass } from '../utils/formatters'

function formatDate(value?: string | null): string {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function subjectLabel(document: DocumentItem): string {
  const subject =
    document.subject && typeof document.subject === 'object'
      ? (document.subject as DocumentSubject)
      : null

  if (subject) {
    return [subject.code, subject.name].filter(Boolean).join(' ')
  }

  return typeof document.subject === 'string' ? document.subject : 'Unsorted'
}

function daysRemainingLabel(days?: number | null): string {
  if (days === null || days === undefined) return 'Unknown'
  if (days <= 0) return 'Expires today'
  return `${days} day${days === 1 ? '' : 's'} left`
}

export default function TrashPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isEmptying, setIsEmptying] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadTrash() {
    setIsLoading(true)
    setError(null)
    try {
      setDocuments(await listTrashDocuments())
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load trash')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTrash()
  }, [])

  async function restore(document: DocumentItem) {
    setBusyId(document.id)
    setError(null)
    try {
      await restoreDocument(document.id)
      setDocuments((current) => current.filter((item) => item.id !== document.id))
      setFeedback(`"${document.title}" restored to My Document.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to restore document')
    } finally {
      setBusyId(null)
    }
  }

  async function permanentDelete(document: DocumentItem) {
    const ok = window.confirm(`Permanently delete "${document.title}"? This cannot be undone.`)
    if (!ok) return

    setBusyId(document.id)
    setError(null)
    try {
      await deleteDocumentPermanently(document.id)
      setDocuments((current) => current.filter((item) => item.id !== document.id))
      setFeedback(`"${document.title}" permanently deleted.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to permanently delete document')
    } finally {
      setBusyId(null)
    }
  }

  async function emptyAll() {
    if (documents.length === 0) return
    const ok = window.confirm(`Permanently delete all ${documents.length} document(s) in Trash?`)
    if (!ok) return

    setIsEmptying(true)
    setError(null)
    try {
      const result = await emptyTrash()
      setDocuments([])
      setFeedback(`${result.deletedCount} document(s) permanently deleted.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to empty trash')
    } finally {
      setIsEmptying(false)
    }
  }

  return (
    <main className="moonlit-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="moonlit-title page-title">
                Trash
              </h1>
              <Badge className="rounded-full px-2.5 py-1" variant="secondary">
                {documents.length} total
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Deleted documents stay here for 30 days before permanent cleanup.
            </p>
          </div>
          <Button
            disabled={documents.length === 0 || isEmptying}
            onClick={() => void emptyAll()}
            type="button"
            variant="destructive"
          >
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            {isEmptying ? 'Emptying...' : 'Empty trash'}
          </Button>
        </header>

        {feedback ? (
          <div className="moonlit-card tone-surface tone-emerald px-4 py-3 text-sm" role="status">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="moonlit-card tone-surface tone-coral px-4 py-3 text-sm" role="alert">
            {error}
          </div>
        ) : null}

        <section className="moonlit-card moonlit-table tone-surface tone-sapphire overflow-x-auto">
          <Table className="min-w-[500px] md:min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Deleted</TableHead>
                <TableHead className="hidden sm:table-cell">Retention</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`admin-icon-badge ${getFileBadgeClass(document.fileName)} flex size-9 shrink-0 items-center justify-center rounded-lg`}>
                        <FileText aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {document.title || document.fileName}
                        </div>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="truncate text-xs text-muted-foreground">
                            {document.fileName}
                          </span>
                          <Badge className="h-5 rounded-full px-1.5 text-[0.65rem]" variant="secondary">
                            In trash
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{subjectLabel(document)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatFileSize(document.fileSize)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(document.deletedAt)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{daysRemainingLabel(document.trashDaysRemaining)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      <Button
                        disabled={busyId === document.id}
                        onClick={() => void restore(document)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <RotateCcw data-icon="inline-start" aria-hidden="true" />
                        Restore
                      </Button>
                      <Button
                        disabled={busyId === document.id}
                        onClick={() => void permanentDelete(document)}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 data-icon="inline-start" aria-hidden="true" />
                        Delete permanently
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!isLoading && documents.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 border-t border-border p-8 text-center">
              <Trash2 className="text-muted-foreground" aria-hidden="true" />
              <h2 className="font-medium">Trash is empty</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Documents moved to trash will appear here until they are restored or permanently deleted.
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
              Loading trash...
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
