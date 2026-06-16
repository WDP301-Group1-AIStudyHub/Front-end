import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Bell, Database, FileText, MessageSquareText, Plus, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CelestialInlineLoader, CelestialProgress } from '../components/shared/CelestialLoading'
import { listDocuments } from '../services/documentApi'
import type { DocumentItem } from '../types/document'

const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export default function DashboardPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  const storageUsedBytes = useMemo(
    () => docs.reduce((sum, d) => sum + (d.fileSize ?? 0), 0),
    [docs],
  )

  const storagePercent = useMemo(
    () => Math.min((storageUsedBytes / STORAGE_LIMIT_BYTES) * 100, 100),
    [storageUsedBytes],
  )

  const recentDocs = useMemo(
    () =>
      [...docs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [docs],
  )

  const subjectClusters = useMemo(() => {
    const map = new Map<string, number>()
    for (const doc of docs) {
      const subjectName = (typeof doc.subject === 'object' ? doc.subject?.name : doc.subject) || ''
      const key = subjectName.trim() || 'Uncategorized'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }, [docs])

  const docsPerDay = useMemo(() => {
    if (docs.length < 2) return null
    const dates = docs.map((d) => new Date(d.createdAt).getTime()).filter((t) => !Number.isNaN(t))
    const span = (Math.max(...dates) - Math.min(...dates)) / 86_400_000
    if (span < 1) return null
    return (docs.length / span).toFixed(1)
  }, [docs])

  useEffect(() => {
    listDocuments()
      .then((data) => setDocs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 text-foreground md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Workspace</p>
          <h1 className="celestial-title mt-2 text-3xl leading-tight md:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your library, ask questions against documents, and review evaluation signals.
          </p>
        </div>
        <Button className="size-11 rounded-lg" size="icon" type="button" variant="outline">
          <Bell aria-hidden="true" />
          <span className="sr-only">Notifications</span>
        </Button>
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-12">
        <article className="celestial-card p-6 xl:col-span-4">
          <div className="flex items-start justify-between gap-4">
            <span className="admin-icon-badge">
              <Database className="size-5" />
            </span>
            <span className="text-sm font-medium text-muted-foreground">Storage</span>
          </div>
          <div className="mt-12">
            {loading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-4xl font-semibold tracking-tight">{formatStorageSize(storageUsedBytes)}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">of 10 GB limit used</p>
          </div>
          <div className="mt-8">
            {loading ? (
              <CelestialProgress tone="teal" />
            ) : (
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${storagePercent.toFixed(1)}%` }} />
              </div>
            )}
          </div>
        </article>

        <article className="celestial-card p-6 xl:col-span-8">
          <div className="flex h-full min-h-56 flex-col justify-between gap-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MessageSquareText className="size-5" aria-hidden="true" />
              AI assistant
            </div>
            <h2 className="max-w-xl text-2xl font-semibold leading-snug text-foreground">
              Chat with your documents for immediate summaries and practice questions.
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild>
                <Link to="/aichatbox">Start AI session</Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {loading ? <CelestialInlineLoader label="Loading library..." /> : `Ready to analyze ${docs.length} documents.`}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="celestial-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <Archive className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight">Recent documents</h2>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/library">View all</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div className="grid gap-3 p-5 md:grid-cols-[1fr_180px_auto]" key={i}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-24 self-center" />
                </div>
              ))
            ) : recentDocs.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No documents yet. Upload one to get started.</p>
            ) : (
              recentDocs.map((doc) => (
                <Link
                  className="grid gap-3 p-5 transition-colors hover:bg-muted/60 md:grid-cols-[1fr_180px_auto]"
                  key={doc.id}
                  to="/library"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="admin-icon-badge size-10">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(doc.createdAt)}</p>
                    </div>
                  </div>
                  <span className="self-center text-xs text-muted-foreground">
                    {(typeof doc.subject === 'object' ? doc.subject?.name : doc.subject) || 'Uncategorized'}
                  </span>
                  <span className="self-center text-muted-foreground">Open</span>
                </Link>
              ))
            )}
          </div>
        </article>

        <aside className="flex flex-col gap-5">
          <Link className="celestial-card flex items-center justify-between gap-5 p-5" to="/library">
            <div>
              <h2 className="font-semibold tracking-tight">Sync documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload new source files</p>
            </div>
            <span className="admin-icon-badge">
              <UploadCloud className="size-5" />
            </span>
          </Link>

          <article className="celestial-card p-5">
            <span className="text-sm font-medium text-muted-foreground">Subject clusters</span>
            <div className="mt-5 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div className="flex items-center justify-between gap-4 p-1" key={i}>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))
              ) : subjectClusters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects yet.</p>
              ) : (
                subjectClusters.map((subject) => (
                  <Link className="flex items-center justify-between gap-4 rounded-lg p-1 transition-colors hover:bg-muted" key={subject.name} to="/library">
                    <span className="font-medium text-foreground">{subject.name}</span>
                    <span className="text-xs text-muted-foreground">{subject.count}</span>
                  </Link>
                ))
              )}
            </div>
            <Button asChild className="mt-5 w-full" variant="outline">
              <Link to="/library">Explore all clusters</Link>
            </Button>
          </article>
        </aside>
      </section>

      <section className="celestial-card mt-5 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-2 rounded-full bg-primary" />
          <p className="text-sm text-muted-foreground">
            {docs.length === 0
              ? 'Upload documents to start building your research library.'
              : docsPerDay
                ? `The library grows at ${docsPerDay} documents per day. ${docs.length} total files available.`
                : `${docs.length} document${docs.length === 1 ? '' : 's'} in your library.`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="mt-1 font-semibold text-foreground">99.98%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sync status</p>
            <p className="mt-1 font-semibold text-foreground">Connected</p>
          </div>
        </div>
      </section>

      <Button className="fixed bottom-6 right-6 z-40 size-12 rounded-lg" title="New document" type="button">
        <Plus aria-hidden="true" />
      </Button>
    </main>
  )
}
