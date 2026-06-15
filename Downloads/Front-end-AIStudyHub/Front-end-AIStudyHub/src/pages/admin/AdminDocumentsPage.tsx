import { useEffect, useMemo, useState } from 'react'
import { Eye, FileCog, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { listAdminDocuments, listSubjects, updateDocumentMetadata } from '../../services/adminApi'
import type { AdminDocument, AdminSubject } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

type DocumentFormState = Pick<AdminDocument, 'description' | 'subject' | 'title'>

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [editingDocument, setEditingDocument] = useState<AdminDocument | null>(null)
  const [form, setForm] = useState<DocumentFormState>({ description: '', subject: '', title: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<AdminDocument | null>(null)
  const [subjects, setSubjects] = useState<AdminSubject[]>([])

  useEffect(() => {
    listAdminDocuments()
      .then(setDocuments)
      .finally(() => setIsLoading(false))
    listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return documents.filter((document) => {
      if (!normalizedQuery) return true
      return [document.title, document.subject, document.ownerName, document.fileName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [documents, query])

  function openEditor(document: AdminDocument) {
    setEditingDocument(document)
    setForm({
      description: document.description ?? '',
      subject: document.subject ?? '',
      title: document.title,
    })
  }

  async function handleSave() {
    if (!editingDocument) return

    const nextDocument = await updateDocumentMetadata(editingDocument.id, {
      description: form.description?.trim(),
      subject: form.subject?.trim(),
      title: form.title.trim(),
    })
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === nextDocument.id ? nextDocument : document,
      ),
    )
    setEditingDocument(null)
  }

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        description="Review uploaded documents and edit metadata that powers library search and AI retrieval."
        eyebrow="Admin documents"
        title="Documents Metadata"
      />

      <section className="celestial-card celestial-table tone-surface tone-gold mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 md:flex-row md:items-center md:justify-between">
          <label className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, owner, subject, file"
              value={query}
            />
          </label>
          <StatusBadge severity="info">{filteredDocuments.length} visible</StatusBadge>
        </div>

        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center text-muted-foreground">
              <div>
                <FileCog className="mx-auto mb-3 size-8" />
                <p>No documents match the current search.</p>
              </div>
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <article className="grid gap-4 p-5 transition-colors hover:bg-muted/35 xl:grid-cols-[1.35fr_1fr_150px_170px_180px_190px]" key={document.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="admin-icon-badge admin-tone-gold size-10">
                    <FileCog className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <button
                      className="truncate text-left font-semibold hover:text-primary"
                      onClick={() => setSelectedDocument(document)}
                      type="button"
                    >
                      {document.title}
                    </button>
                    <p className="truncate text-sm text-muted-foreground">{document.fileName}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="block font-medium text-foreground">{document.ownerName}</span>
                  {document.ownerEmail}
                </div>
                <StatusBadge severity={document.indexedStatus}>{document.indexedStatus}</StatusBadge>
                <div className="text-sm text-muted-foreground">
                  <span className="block font-medium text-foreground">{document.subject || 'Unsorted'}</span>
                  {formatDateTime(document.updatedAt)}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <span>{document.uploadStatus || 'completed'}</span>
                    <span>{document.uploadProgress ?? 100}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${document.uploadProgress ?? 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <Button onClick={() => setSelectedDocument(document)} size="sm" type="button" variant="outline">
                    <Eye data-icon="inline-start" aria-hidden="true" />
                    Details
                  </Button>
                  <Button asChild size="sm" type="button" variant="outline">
                    <a href={document.fileUrl} rel="noreferrer" target="_blank">Open</a>
                  </Button>
                  <Button onClick={() => openEditor(document)} size="sm" type="button">
                    Edit metadata
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Sheet open={Boolean(editingDocument)} onOpenChange={(open) => !open && setEditingDocument(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit metadata</SheetTitle>
            <SheetDescription>
              Metadata updates are stored in the admin mock service and mirror the future backend contract.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 p-4">
            <label className="grid gap-2 text-sm font-medium">
              Title
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Subject
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={form.subject ?? ''}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Description
              <Textarea
                value={form.description ?? ''}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
          </div>
          <SheetFooter>
            <Button onClick={() => void handleSave()} type="button">Save metadata</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedDocument)} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Document details</SheetTitle>
            <SheetDescription>
              Read-only document metadata, upload progress, and file information.
            </SheetDescription>
          </SheetHeader>
          {selectedDocument && (
            <div className="grid gap-4 p-4">
              <div className="celestial-card tone-surface tone-gold p-4">
                <div className="flex items-start gap-3">
                  <span className="admin-icon-badge admin-tone-gold size-10">
                    <FileText aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{selectedDocument.title}</h2>
                    <p className="truncate text-sm text-muted-foreground">{selectedDocument.fileName}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/55 p-3">
                <div className="mb-2 flex items-center justify-between text-sm font-medium">
                  <span>Upload progress</span>
                  <span>{selectedDocument.uploadProgress ?? 100}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${selectedDocument.uploadProgress ?? 100}%` }}
                  />
                </div>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <DetailItem label="Owner" value={`${selectedDocument.ownerName} (${selectedDocument.ownerEmail})`} />
                <DetailItem label="Subject" value={selectedDocument.subject || 'Unsorted'} />
                <DetailItem label="Status" value={selectedDocument.indexedStatus} />
                <DetailItem label="Upload status" value={selectedDocument.uploadStatus || 'completed'} />
                <DetailItem label="File size" value={formatFileSize(selectedDocument.fileSize)} />
                <DetailItem label="Updated" value={formatDateTime(selectedDocument.updatedAt)} />
              </div>
              <DetailItem label="Description" value={selectedDocument.description || 'No description'} />
              <DetailItem label="Extracted text" value={selectedDocument.extractedText || 'No extracted text available'} />
            </div>
          )}
          <SheetFooter>
            {selectedDocument && (
              <Button asChild type="button">
                <a href={selectedDocument.fileUrl} rel="noreferrer" target="_blank">
                  Open file
                </a>
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  )
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/55 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm leading-6">{value}</p>
    </div>
  )
}
