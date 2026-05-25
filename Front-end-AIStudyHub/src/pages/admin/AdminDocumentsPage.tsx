import { useEffect, useMemo, useState } from 'react'
import { FileCog, Search } from 'lucide-react'
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
import { listAdminDocuments, updateDocumentMetadata } from '../../services/adminApi'
import type { AdminDocument } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

type DocumentFormState = Pick<AdminDocument, 'description' | 'subject' | 'title'>

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [editingDocument, setEditingDocument] = useState<AdminDocument | null>(null)
  const [form, setForm] = useState<DocumentFormState>({ description: '', subject: '', title: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    listAdminDocuments()
      .then(setDocuments)
      .finally(() => setIsLoading(false))
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

      <section className="celestial-card mt-8 overflow-hidden">
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
              <article className="grid gap-4 p-5 xl:grid-cols-[1.4fr_1fr_150px_160px_180px]" key={document.id}>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{document.title}</h2>
                  <p className="truncate text-sm text-muted-foreground">{document.fileName}</p>
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
                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
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
              <Input value={form.subject ?? ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
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
    </main>
  )
}
