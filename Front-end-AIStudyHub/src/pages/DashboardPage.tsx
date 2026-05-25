import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Bell,
  Database,
  FileText,
  Plus,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
      const key = doc.subject?.trim() || 'Uncategorized'
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

  useEffect(() => {
    const createRipple = (x: number, y: number) => {
      const element = document.createElement('div')
      element.className = 'db-ripple'
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      document.body.appendChild(element)
      window.setTimeout(() => element.remove(), 1200)
    }

    const onMouseMove = (event: MouseEvent) => {
      if (Math.random() > 0.965) createRipple(event.clientX, event.clientY)
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="celestial-title text-4xl font-semibold tracking-tight md:text-5xl">
            Commander's Deck
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your scholarly universe, synchronized across the dark expanse of information.
          </p>
        </div>
        <Button className="rounded-full" size="icon" type="button" variant="outline">
          <Bell aria-hidden="true" />
          <span className="sr-only">Notifications</span>
        </Button>
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-12">
        <article className="celestial-card tone-surface tone-teal p-6 xl:col-span-4">
          <div className="flex items-start justify-between">
            <span className="admin-icon-badge admin-tone-teal">
              <Database />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Storage
            </span>
          </div>
          <div className="mt-14">
            {loading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-4xl font-light tracking-tight">{formatStorageSize(storageUsedBytes)}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">of 10 GB limit used</p>
          </div>
          <div className="mt-8 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--accent-teal)] transition-all"
              style={{ width: `${storagePercent.toFixed(1)}%` }}
            />
          </div>
        </article>

        <article className="celestial-card tone-surface tone-gold group relative overflow-hidden p-6 xl:col-span-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[color-mix(in_oklab,var(--accent-blue)_24%,transparent)] blur-3xl transition-opacity group-hover:opacity-80" />
          <div className="relative z-[1] flex h-full min-h-56 flex-col justify-between gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--accent-gold)]" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Zenith Intelligence
              </span>
            </div>
            <h2 className="max-w-xl text-2xl font-light leading-snug">
              Transcend with AI: Interrogate your entire research library.
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild className="rounded-full">
                <a href="/aichatbox">Initiate Dialogue</a>
              </Button>
              <span className="text-sm italic text-muted-foreground">
                {loading ? 'Loading library...' : `Searching ${docs.length} archived papers...`}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="celestial-card celestial-table overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 p-5">
            <div className="flex items-center gap-3">
              <Archive className="size-5 text-[var(--accent-blue)]" aria-hidden="true" />
              <h2 className="font-semibold">Recent Archives</h2>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href="/library">View all</a>
            </Button>
          </div>
          <div className="divide-y divide-border/60">
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
                <a
                  className="grid gap-3 p-5 transition-colors hover:bg-muted/45 md:grid-cols-[1fr_180px_auto]"
                  href="/library"
                  key={doc.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="admin-icon-badge admin-tone-blue size-10">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {formatRelativeTime(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="self-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {doc.subject || '—'}
                  </span>
                  <span className="self-center text-muted-foreground">...</span>
                </a>
              ))
            )}
          </div>
        </article>

        <aside className="flex flex-col gap-5">
          <a className="celestial-card tone-surface tone-cyan flex items-center justify-between gap-5 p-5" href="/library">
            <div>
              <h2 className="font-semibold">Sync Documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload to library</p>
            </div>
            <span className="admin-icon-badge admin-tone-teal">
              <UploadCloud />
            </span>
          </a>

          <article className="celestial-card tone-surface tone-violet p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Subject Clusters
            </span>
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
                  <a className="flex items-center justify-between gap-4 rounded-lg p-1 transition-colors hover:bg-muted/45" href="/library" key={subject.name}>
                    <span>{subject.name}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{subject.count}</span>
                  </a>
                ))
              )}
            </div>
            <Button asChild className="mt-5 w-full" variant="outline">
              <a href="/library">Explore All Clusters</a>
            </Button>
          </article>
        </aside>
      </section>

      <section className="celestial-card tone-surface tone-emerald mt-5 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="db-pulse-dot" />
          <p className="text-sm italic text-muted-foreground">
            {docs.length === 0
              ? 'Upload documents to start building your research library.'
              : docsPerDay
              ? `The library grows at ${docsPerDay} documents per day. ${docs.length} total archives available.`
              : `${docs.length} document${docs.length === 1 ? '' : 's'} in your research library.`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Uptime</p>
            <p className="mt-1">99.98%</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Neural Sync</p>
            <p className="mt-1">Active</p>
          </div>
        </div>
      </section>

      <Button
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-2xl"
        title="New Document"
        type="button"
      >
        <Plus aria-hidden="true" />
      </Button>
    </main>
  )
}
