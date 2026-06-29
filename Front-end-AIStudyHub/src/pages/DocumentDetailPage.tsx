import { useEffect, useState } from 'react'
import { ArrowLeft, Download, FileText, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteDocument, getDocument, listDocumentVersions, updateDocument } from '../services/documentApi'
import { listSubjects, type SubjectItem } from '../services/subjectApi'
import type {
  DocumentDetail,
  DocumentSubject,
  DocumentVersion,
} from '../types/document'

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
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function statusClass(status?: string): string {
  const normalized = status?.toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'INDEXED' || normalized === 'COMPLETED') {
    return 'status-success'
  }
  if (normalized === 'FAILED' || normalized === 'DELETED') return 'status-error'
  if (normalized === 'PROCESSING' || normalized === 'PENDING') return 'status-warning'
  return 'status-info'
}

function InfoCard({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; value: string | number }>
}) {
  return (
    <section className="botanical-bento tone-surface tone-sapphire p-5">
      <h2 className="text-lg font-black">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div className="min-w-0" key={item.label}>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm">{item.value || 'None'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSubjectId, setEditSubjectId] = useState('')
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Document id is missing')
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all([
      getDocument(id),
      listDocumentVersions(id),
      listSubjects().catch(() => []),
    ])
      .then(([nextDocument, nextVersions, nextSubjects]) => {
        if (cancelled) return
        setDocument(nextDocument)
        setVersions(nextVersions)
        setSubjects(nextSubjects)
      })
      .catch((caughtError) => {
        if (cancelled) return
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load document',
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])



  const subject =
    document?.subject && typeof document.subject === 'object'
      ? (document.subject as DocumentSubject)
      : null
  const subjectLabel =
    subject
      ? [subject.code, subject.name].filter(Boolean).join(' ')
      : typeof document?.subject === 'string'
        ? document.subject
        : 'Unsorted'

  function downloadDocument() {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function openEdit() {
    if (!document) return
    setEditTitle(document.title)
    setEditDescription(document.description ?? '')
    setEditSubjectId(document.subjectId ?? subject?._id ?? '')
    setEditVisibility(document.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE')
    setIsEditOpen(true)
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!document || !id) return
    const title = editTitle.trim()
    if (!title) {
      setError('Title is required')
      return
    }

    setIsSavingEdit(true)
    setError(null)
    try {
      const updated = await updateDocument(id, {
        description: editDescription.trim(),
        subjectId: editSubjectId || undefined,
        title,
        visibility: editVisibility,
      })
      setDocument(updated as DocumentDetail)
      setIsEditOpen(false)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update document',
      )
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function confirmDelete() {
    if (!document || !id) return
    const ok = window.confirm(`Delete "${document.title}"? This cannot be undone.`)
    if (!ok) return

    setIsDeleting(true)
    setError(null)
    try {
      await deleteDocument(id)
      navigate('/library')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to delete document',
      )
      setIsDeleting(false)
    }
  }

  return (
    <main className="botanical-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Button asChild variant="secondary">
              <Link to="/library">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Back to library
              </Link>
            </Button>
            <h1 className="moonlit-title mt-4 break-words text-3xl font-black tracking-tight md:text-5xl">
              {document?.title || 'Document detail'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={!document} onClick={openEdit} type="button" variant="secondary">
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Edit details
            </Button>
            <Button disabled={!document?.fileUrl} onClick={downloadDocument} type="button">
              <Download data-icon="inline-start" aria-hidden="true" />
              Download
            </Button>
            <Button disabled={!document || isDeleting} onClick={confirmDelete} type="button" variant="destructive">
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </header>

        {error ? (
          <div className="moonlit-card tone-surface tone-coral px-4 py-3 text-sm" role="alert">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <section className="botanical-card p-5" key={index}>
                <Skeleton className="h-6 w-48" />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((__, itemIndex) => (
                    <Skeleton className="h-10" key={itemIndex} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {!isLoading && document ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoCard
                title="Document information"
                items={[
                  { label: 'Title', value: document.title },
                  { label: 'Description', value: document.description || 'No description' },
                  { label: 'Subject', value: subjectLabel },
                  { label: 'Visibility', value: document.visibility || 'PRIVATE' },
                  { label: 'Status', value: document.status || 'ACTIVE' },
                  { label: 'Created', value: formatDate(document.createdAt) },
                  { label: 'Updated', value: formatDate(document.updatedAt) },
                  { label: 'Views', value: document.totalViews ?? 0 },
                  { label: 'Downloads', value: document.totalDownloads ?? 0 },
                ]}
              />
              <InfoCard
                title="File information"
                items={[
                  { label: 'Original name', value: document.originalFileName || document.fileName },
                  { label: 'Stored name', value: document.storedFileName || document.fileName },
                  { label: 'File type', value: document.mimeType || document.fileType || 'Unknown' },
                  { label: 'File size', value: formatFileSize(document.fileSize) },
                  { label: 'Extraction', value: document.extractionStatus || 'Unknown' },
                  { label: 'Chunks', value: document.totalChunks ?? 0 },
                  { label: 'Versions', value: document.totalVersions ?? versions.length },
                  { label: 'Last indexed', value: formatDate(document.lastIndexedAt) },
                ]}
              />
            </div>

            <section className="botanical-bento moonlit-table tone-surface tone-sapphire overflow-x-auto">
              <div className="flex items-center gap-3 p-5">
                <FileText aria-hidden="true" />
                <h2 className="text-lg font-black">Version history</h2>
              </div>
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Upload mode</TableHead>
                    <TableHead>Processing</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-bold">
                        v{version.versionNumber}{version.isActive ? ' (Active)' : ''}
                      </TableCell>
                      <TableCell>{version.fileName}</TableCell>
                      <TableCell>{version.uploadMode}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${statusClass(version.processingStatus)}`}>
                          {version.processingStatus || 'UNKNOWN'}
                        </span>
                      </TableCell>
                      <TableCell>{version.totalChunks}</TableCell>
                      <TableCell>{formatDate(version.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {versions.length === 0 ? (
                <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
                  No version history available.
                </div>
              ) : null}
            </section>

          </>
        ) : null}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form className="flex flex-col gap-4" onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>Edit document</DialogTitle>
            </DialogHeader>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Title
              <Input
                disabled={isSavingEdit}
                maxLength={160}
                onChange={(event) => setEditTitle(event.target.value)}
                value={editTitle}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Subject
              <select
                className="h-9 w-full rounded-md border-2 border-foreground bg-background px-3 text-sm font-semibold outline-none disabled:opacity-50"
                disabled={isSavingEdit}
                onChange={(event) => setEditSubjectId(event.target.value)}
                value={editSubjectId}
              >
                <option value="">Keep current subject</option>
                {subjects.map((item) => (
                  <option key={item._id} value={item._id}>
                    {[item.code, item.name].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Description
              <Textarea
                disabled={isSavingEdit}
                maxLength={1000}
                onChange={(event) => setEditDescription(event.target.value)}
                value={editDescription}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Visibility
              <select
                className="h-9 w-full rounded-md border-2 border-foreground bg-background px-3 text-sm font-semibold outline-none disabled:opacity-50"
                disabled={isSavingEdit}
                onChange={(event) =>
                  setEditVisibility(event.target.value === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE')
                }
                value={editVisibility}
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>

            <DialogFooter>
              <Button disabled={isSavingEdit} type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button disabled={isSavingEdit} type="submit">
                {isSavingEdit ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
