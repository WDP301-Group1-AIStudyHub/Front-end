import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Bell, Database, FileText, Plus, UploadCloud, Leaf, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CelestialInlineLoader } from '../components/shared/CelestialLoading'
import { listDocuments } from '../services/documentApi'
import { useUploadStore } from '../store/useUploadStore'
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
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null)

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

  // Drag and Drop Upload logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setUploadFeedback(`Queueing ${files.length} document(s)...`)
      
      for (const file of files) {
        const payload = {
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "Uploaded via Quick Dropzone",
          subject: "General"
        }
        
        try {
          useUploadStore.getState().processIncomingUpload(payload, docs, () => {
            // refresh library on successful upload
            listDocuments().then(setDocs)
          })
        } catch (err) {
          console.error("Dropzone upload failed:", err)
        }
      }

      setTimeout(() => setUploadFeedback(null), 4000)
    }
  }

  // Study statistics mocked weekly chart data
  const chartData = [
    { day: 'M', value: docs.length ? Math.min(docs.length * 10, 60) : 25, active: false },
    { day: 'T', value: docs.length ? Math.min(docs.length * 15, 80) : 40, active: false },
    { day: 'W', value: docs.length ? Math.min(docs.length * 8, 55) : 30, active: false },
    { day: 'T', value: docs.length ? Math.min(docs.length * 20, 95) : 65, active: true },
    { day: 'F', value: docs.length ? Math.min(docs.length * 12, 70) : 45, active: false },
    { day: 'S', value: 15, active: false },
    { day: 'S', value: 20, active: false }
  ]

  return (
    <main 
      className="celestial-page min-h-svh overflow-y-auto p-5 text-foreground md:p-8"
      onDragEnter={handleDrag}
    >
      {/* Absolute Drag & Drop overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-6"
          >
            <div className="w-full max-w-lg rounded-3xl border-2 border-dashed border-primary/50 bg-card p-12 text-center shadow-xl flex flex-col items-center justify-center gap-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                <UploadCloud className="size-8" />
              </div>
              <h3 className="text-xl font-bold">Drop your study source here</h3>
              <p className="text-sm text-muted-foreground">Upload and link directly to your general workspace</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            Nature-Inspired Workspace
          </p>
          <h1 className="celestial-title mt-2 text-3xl leading-tight md:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Manage your library, ask questions against documents, and review evaluation signals in a distraction-free organic workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {uploadFeedback && (
            <span className="text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-xl animate-pulse">
              {uploadFeedback}
            </span>
          )}
          <Button className="size-11 rounded-xl" size="icon" type="button" variant="outline">
            <Bell aria-hidden="true" className="size-4" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <section className="mt-8 grid gap-5 xl:grid-cols-12">
        {/* Storage card with organic leaf slider */}
        <article className="celestial-card p-6 xl:col-span-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <span className="admin-icon-badge">
              <Database className="size-4" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Space Usage</span>
          </div>
          
          <div className="mt-8">
            {loading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-4xl font-bold tracking-tight text-foreground">{formatStorageSize(storageUsedBytes)}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">of 10 GB organic limit used</p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
            ) : (
              <div className="relative pt-2">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out" 
                    style={{ width: `${storagePercent.toFixed(1)}%` }} 
                  />
                </div>
                {/* Sliding leaf indicator */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -ml-2 transition-all duration-700 ease-out" 
                  style={{ left: `${storagePercent.toFixed(1)}%` }}
                >
                  <Leaf className="size-4 text-primary bg-card rounded-full p-0.5 shadow-sm border border-border/80 rotate-[45deg]" />
                </div>
              </div>
            )}
          </div>
        </article>

        {/* AI Assistant box */}
        <article className="celestial-card p-6 xl:col-span-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            AI Assistant
          </div>
          <h2 className="mt-6 text-xl font-bold leading-relaxed text-foreground">
            Chat with your documents for immediate summaries and practice questions.
          </h2>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="rounded-xl">
              <Link to="/aichatbox">Start AI session</Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              {loading ? <CelestialInlineLoader label="Loading library..." /> : `Ready to analyze ${docs.length} documents.`}
            </span>
          </div>
        </article>

        {/* Study Progress SVG Chart */}
        <article className="celestial-card p-6 xl:col-span-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Study Activity</span>
            <span className="text-primary font-bold">Weekly Flow</span>
          </div>

          {/* Spring-animated SVG Chart */}
          <div className="h-28 mt-4 flex items-end justify-between gap-2">
            {chartData.map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group relative">
                <div className="w-full bg-muted rounded-t-lg overflow-hidden h-20 relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.value}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.05 }}
                    className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-colors ${
                      bar.active ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/50'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">{bar.day}</span>
                
                {/* Micro tooltip */}
                <span className="absolute -top-6 scale-0 group-hover:scale-100 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-transform pointer-events-none">
                  {bar.value}h
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Main Section */}
      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Recent Documents */}
        <article className="celestial-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/80 p-5">
            <div className="flex items-center gap-3">
              <Archive className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight">Recent documents</h2>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/library">View all</Link>
            </Button>
          </div>
          <div className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div className="grid gap-3 p-5 md:grid-cols-[1fr_180px_auto]" key={i}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-24 self-center" />
                </div>
              ))
            ) : recentDocs.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No documents yet. Drag & drop files onto this page to upload.</p>
            ) : (
              recentDocs.map((doc) => (
                <Link
                  className="grid gap-3 p-5 transition-all hover:bg-muted/30 md:grid-cols-[1fr_180px_auto]"
                  key={doc.id}
                  to="/library"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="admin-icon-badge size-10">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground text-sm">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatRelativeTime(doc.createdAt)}</p>
                    </div>
                  </div>
                  <span className="self-center text-xs text-muted-foreground font-medium">
                    {(typeof doc.subject === 'object' ? doc.subject?.name : doc.subject) || 'Uncategorized'}
                  </span>
                  <span className="self-center text-xs font-bold text-primary group-hover:underline">Open</span>
                </Link>
              ))
            )}
          </div>
        </article>

        {/* Sidebar panels */}
        <aside className="flex flex-col gap-5">
          {/* Quick upload card dropzone button */}
          <div 
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="celestial-card flex items-center justify-between gap-5 p-5 border-dashed border-2 border-primary/30 hover:border-primary/60 transition-colors cursor-pointer group"
          >
            <div>
              <h2 className="font-bold tracking-tight text-foreground text-sm">Quick Drop Upload</h2>
              <p className="mt-1 text-xs text-muted-foreground">Drag and drop source files here</p>
            </div>
            <span className="admin-icon-badge group-hover:scale-105 transition-transform">
              <UploadCloud className="size-4" />
            </span>
          </div>

          {/* Subject clusters list */}
          <article className="celestial-card p-5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject clusters</span>
            <div className="mt-5 space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div className="flex items-center justify-between gap-4 p-1" key={i}>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))
              ) : subjectClusters.length === 0 ? (
                <p className="text-xs text-muted-foreground p-1">No subjects yet.</p>
              ) : (
                subjectClusters.map((subject) => (
                  <Link className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 text-sm transition-all hover:bg-muted/40" key={subject.name} to="/library">
                    <span className="font-semibold text-foreground text-xs">{subject.name}</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{subject.count}</span>
                  </Link>
                ))
              )}
            </div>
            <Button asChild className="mt-5 w-full rounded-xl" variant="outline">
              <Link to="/library">Explore all clusters</Link>
            </Button>
          </article>
        </aside>
      </section>

      {/* Footer statistics bar */}
      <section className="celestial-card mt-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between bg-card/65 backdrop-blur-xs">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-2 rounded-full bg-primary shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {docs.length === 0
              ? 'Upload documents to start building your research library.'
              : docsPerDay
                ? `The library grows at ${docsPerDay} documents per day. ${docs.length} total files available.`
                : `${docs.length} document${docs.length === 1 ? '' : 's'} in your library.`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-xs shrink-0">
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">Uptime</p>
            <p className="mt-1 font-bold text-foreground">99.98%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">Workspace</p>
            <p className="mt-1 font-bold text-primary">Connected</p>
          </div>
        </div>
      </section>

      {/* Floating Plus button */}
      <Button asChild className="fixed bottom-6 right-6 z-40 size-12 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform" title="New document">
        <Link to="/library">
          <Plus aria-hidden="true" className="size-5" />
        </Link>
      </Button>
    </main>
  )
}
