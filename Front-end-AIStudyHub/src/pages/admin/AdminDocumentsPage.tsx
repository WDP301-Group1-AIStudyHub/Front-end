import { useEffect, useMemo, useState } from 'react'
import { Eye, FileCog, Search, FileText, Database, User, Shield, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { LoadingState } from '../../components/shared/CelestialLoading'
import { listAdminDocuments } from '../../services/adminApi'
import type { AdminDocument } from '../../types/admin'
import { AdminPageHeader, StatusBadge } from './adminPageUtils'



function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [viewingDocument, setViewingDocument] = useState<AdminDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'indexed' | 'processing' | 'failed'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    listAdminDocuments()
      .then(setDocuments)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesStatus = statusFilter === 'all' || document.indexedStatus === statusFilter

      if (!normalizedQuery) return matchesStatus
      const subjectName = (typeof document.subject === 'object' ? document.subject?.name : document.subject) || ''
      const matchesQuery = [document.title, subjectName, document.ownerName, document.fileName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery))

      return matchesQuery && matchesStatus
    })
  }, [documents, query, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter])

  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredDocuments, currentPage])

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE)


  return (
    <main className="botanical-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        description="Review all uploaded documents across the platform. Change status, visibility, or remove documents."
        eyebrow="Admin documents"
        title="Document Oversight"
      />

      <section className="botanical-bento moonlit-table tone-surface tone-gold mt-8 overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 md:flex-row md:items-center md:justify-between">
          <label className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, owner, file name..."
              value={query}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Extraction:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All</option>
                <option value="indexed">Indexed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <StatusBadge severity="info">{filteredDocuments.length} documents</StatusBadge>
          </div>
        </div>

        {/* ── Table header ── */}
        <div className="hidden xl:grid xl:grid-cols-[1.4fr_1fr_110px_140px_220px] gap-4 border-b border-border/50 bg-muted/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Document</span>
          <span>Owner</span>
          <span>Extraction</span>
          <span>Status / Visibility</span>
          <span className="text-right">Actions</span>
        </div>

        {/* ── Rows ── */}
        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-5">
              <LoadingState label="Loading documents..." tone="gold" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
              <FileCog className="mb-3 size-12 text-muted-foreground/30" />
              <p>No documents match the current search.</p>
            </div>
          ) : (
            paginatedDocuments.map((document) => (
              <article className="grid gap-4 p-5 transition-colors hover:bg-muted/35 xl:grid-cols-[1.4fr_1fr_110px_140px_220px]" key={document.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="admin-icon-badge admin-tone-gold size-10">
                    <FileCog className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground">{document.title}</h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {document.fileName} · {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-center text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{document.ownerName || 'Unknown'}</span>
                  <span className="truncate text-xs">{document.ownerEmail}</span>
                </div>
                <div className="flex items-center">
                  <StatusBadge severity={document.indexedStatus}>{document.indexedStatus}</StatusBadge>
                </div>
                <div className="flex flex-col justify-center text-sm">
                  <span className="font-medium text-foreground">{document.status ?? 'ACTIVE'}</span>
                  <span className="text-xs text-muted-foreground">{document.visibility ?? 'PRIVATE'}</span>
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                  {document.fileUrl && (
                    <Button asChild size="sm" type="button" variant="outline">
                      <a href={document.fileUrl} rel="noreferrer" target="_blank">Open</a>
                    </Button>
                  )}
                  <Button onClick={() => setViewingDocument(document)} size="sm" type="button" variant="secondary">
                    <Eye data-icon="inline-start" />
                    View
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-4 bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredDocuments.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredDocuments.length, currentPage * ITEMS_PER_PAGE)} of {filteredDocuments.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={Boolean(viewingDocument)} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0 border-0 bg-background/95 backdrop-blur-md">
          <div className="botanical-bento moonlit-table tone-surface tone-gold flex flex-col h-full border-0 shadow-none">
            <div className="flex flex-col gap-2 border-b border-border/70 p-6">
              <div className="flex items-center gap-3">
                <span className="admin-icon-badge admin-tone-gold size-12 shadow-sm">
                  <FileText className="size-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Document Metadata</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Detailed information about "{viewingDocument?.title}"
                  </p>
                </div>
              </div>
            </div>

            {viewingDocument && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* General Info Card */}
                  <section className="col-span-1 lg:col-span-2 rounded-xl border border-border/50 bg-card/40 shadow-sm overflow-hidden">
                    <div className="border-b border-border/50 bg-muted/20 px-4 py-2.5 flex items-center gap-2">
                      <Info className="size-4 text-muted-foreground" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">General Info</h3>
                    </div>
                    <div className="divide-y divide-border/30">
                      <div className="flex flex-col sm:flex-row gap-2 p-4">
                        <div className="sm:w-32 text-sm font-medium text-muted-foreground shrink-0">ID</div>
                        <div className="font-mono text-sm">{viewingDocument.id}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 p-4">
                        <div className="sm:w-32 text-sm font-medium text-muted-foreground shrink-0">Title</div>
                        <div className="text-sm font-semibold">{viewingDocument.title}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 p-4">
                        <div className="sm:w-32 text-sm font-medium text-muted-foreground shrink-0">Description</div>
                        <div className="text-sm">{viewingDocument.description || 'N/A'}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 p-4">
                        <div className="sm:w-32 text-sm font-medium text-muted-foreground shrink-0">Subject</div>
                        <div className="text-sm">{typeof viewingDocument.subject === 'object' ? viewingDocument.subject?.name : viewingDocument.subject || 'N/A'}</div>
                      </div>
                    </div>
                  </section>

                  {/* File Details Card */}
                  <section className="col-span-1 rounded-xl border border-border/50 bg-card/40 shadow-sm overflow-hidden">
                    <div className="border-b border-border/50 bg-muted/20 px-4 py-2.5 flex items-center gap-2">
                      <Database className="size-4 text-muted-foreground" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File Details</h3>
                    </div>
                    <div className="divide-y divide-border/30">
                      <div className="flex flex-col gap-1 p-4">
                        <div className="text-xs font-medium text-muted-foreground">File Name</div>
                        <div className="text-sm break-all">{viewingDocument.fileName}</div>
                      </div>
                      <div className="flex flex-col gap-1 p-4">
                        <div className="text-xs font-medium text-muted-foreground">File Type</div>
                        <div className="text-sm break-all">{viewingDocument.fileType}</div>
                      </div>
                      <div className="flex flex-col gap-1 p-4">
                        <div className="text-xs font-medium text-muted-foreground">Size</div>
                        <div className="text-sm font-mono">{formatFileSize(viewingDocument.fileSize)}</div>
                      </div>
                    </div>
                  </section>

                  {/* Admin Details Card */}
                  <section className="col-span-1 rounded-xl border border-border/50 bg-card/40 shadow-sm overflow-hidden">
                    <div className="border-b border-border/50 bg-muted/20 px-4 py-2.5 flex items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Status</h3>
                    </div>
                    <div className="divide-y divide-border/30">
                      <div className="flex flex-col gap-1 p-4">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Owner</div>
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{viewingDocument.ownerName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">{viewingDocument.ownerEmail}</span>
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <div className="text-xs font-medium text-muted-foreground">Status / Visibility</div>
                        <div className="flex gap-2">
                          <StatusBadge severity="info">{viewingDocument.status ?? 'ACTIVE'}</StatusBadge>
                          <StatusBadge severity="info">{viewingDocument.visibility ?? 'PRIVATE'}</StatusBadge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <div className="text-xs font-medium text-muted-foreground">Extraction</div>
                        <StatusBadge severity={viewingDocument.indexedStatus}>{viewingDocument.indexedStatus}</StatusBadge>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
