import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, ExternalLink, FileText, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  downloadDocumentFile,
  listStarredDocuments,
  setDocumentStar,
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

function accessBadge(document: DocumentItem) {
  const role = document.accessRole ?? 'OWNER'

  if (role === 'EDITOR') {
    return {
      className: 'border-amber-300 bg-amber-50 text-amber-700',
      label: 'Editor',
    }
  }

  if (role === 'VIEWER') {
    return {
      className: 'border-slate-300 bg-slate-50 text-slate-700',
      label: 'Viewer',
    }
  }

  return {
    className: 'border-primary/25 bg-primary/10 text-primary',
    label: 'Owner',
  }
}

export default function StarredDocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listStarredDocuments()
      .then((nextDocuments) => {
        if (!cancelled) setDocuments(nextDocuments)
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load starred documents')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function unstar(document: DocumentItem) {
    setBusyId(document.id)
    setError(null)
    try {
      await setDocumentStar(document.id, false)
      setDocuments((current) => current.filter((item) => item.id !== document.id))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to unstar document')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Starred documents
            </h1>
            <Badge className="rounded-full px-2.5 py-1" variant="secondary">
              {documents.length} total
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Documents you marked as important across your own files and shared access.
          </p>
        </header>

        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="overflow-x-auto">
          <Table className="min-w-[420px] md:min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="hidden md:table-cell">Access</TableHead>
                <TableHead className="hidden lg:table-cell">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Starred</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <button
                      className="flex min-w-0 items-center gap-3 text-left group"
                      onClick={() => navigate(`/documents/${document.id}`)}
                      type="button"
                    >
                      <div className={`admin-icon-badge ${getFileBadgeClass(document.fileName)} flex size-9 shrink-0 items-center justify-center rounded-lg`}>
                        <FileText aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {document.title || document.fileName}
                        </div>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="truncate text-xs text-muted-foreground">
                            {document.fileName}
                          </span>
                          {document.isShared ? (
                            <Badge className="h-5 rounded-full px-1.5 text-[0.65rem]" variant="secondary">
                              Shared
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{subjectLabel(document)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(() => {
                      const access = accessBadge(document)
                      return (
                        <Badge className={`w-fit rounded-full border px-2 py-0.5 ${access.className}`} variant="outline">
                          {access.label}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatFileSize(document.fileSize)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(document.starredAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label="Open details"
                        onClick={() => navigate(`/documents/${document.id}`)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <ExternalLink aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label="Download"
                        onClick={() => void downloadDocumentFile(document)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Download aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label="Unstar"
                        disabled={busyId === document.id}
                        onClick={() => void unstar(document)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Star className="fill-amber-400 text-amber-500" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!isLoading && documents.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 border-t border-border p-8 text-center">
              <Star className="text-muted-foreground" aria-hidden="true" />
              <h2 className="font-medium">No starred documents yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Use the star icon in My Document or Document Detail to keep important files here.
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
              Loading starred documents...
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
