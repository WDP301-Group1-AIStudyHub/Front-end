import { useEffect } from 'react'
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

const recentFiles = [
  { name: 'Quantum Entanglement Patterns.pdf', modified: '2h ago', subject: 'Physics' },
  { name: 'Neural Network Topologies.epub', modified: '5h ago', subject: 'AI Research' },
  { name: 'Global Economic Shifts 2025.pdf', modified: 'Yesterday', subject: 'Macroeconomics' },
  { name: 'Metaphysics of Digital Reality.docx', modified: '2 days ago', subject: 'Philosophy' },
]

const subjects = [
  { name: 'Theoretical Physics', count: 124 },
  { name: 'Neural Engineering', count: 89 },
  { name: 'Ethics in AI', count: 56 },
  { name: 'Astro-Biology', count: 42 },
  { name: 'Quantum Computing', count: 31 },
]

export default function DashboardPage() {
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
          <h1 className="lp-stellar-text-glow text-4xl font-semibold tracking-tight md:text-5xl">
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
        <article className="celestial-card p-6 xl:col-span-4">
          <div className="flex items-start justify-between">
            <span className="admin-icon-badge admin-tone-teal">
              <Database />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Storage
            </span>
          </div>
          <div className="mt-14">
            <p className="text-4xl font-light tracking-tight">1.2 GB</p>
            <p className="mt-1 text-sm text-muted-foreground">of 10 GB limit used</p>
          </div>
          <div className="mt-8 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[12%] rounded-full bg-[var(--accent-teal)]" />
          </div>
        </article>

        <article className="celestial-card group relative overflow-hidden p-6 xl:col-span-8">
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
                Searching 432 archived papers...
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="celestial-card overflow-hidden">
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
            {recentFiles.map((file) => (
              <a
                className="grid gap-3 p-5 transition-colors hover:bg-muted/45 md:grid-cols-[1fr_180px_auto]"
                href="/library"
                key={file.name}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="admin-icon-badge admin-tone-blue size-10">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {file.modified}
                    </p>
                  </div>
                </div>
                <span className="self-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {file.subject}
                </span>
                <span className="self-center text-muted-foreground">...</span>
              </a>
            ))}
          </div>
        </article>

        <aside className="flex flex-col gap-5">
          <a className="celestial-card flex items-center justify-between gap-5 p-5" href="/library">
            <div>
              <h2 className="font-semibold">Sync Documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload to library</p>
            </div>
            <span className="admin-icon-badge admin-tone-teal">
              <UploadCloud />
            </span>
          </a>

          <article className="celestial-card p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Subject Clusters
            </span>
            <div className="mt-5 space-y-3">
              {subjects.map((subject) => (
                <a className="flex items-center justify-between gap-4 rounded-lg p-1 transition-colors hover:bg-muted/45" href="/library" key={subject.name}>
                  <span>{subject.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{subject.count}</span>
                </a>
              ))}
            </div>
            <Button asChild className="mt-5 w-full" variant="outline">
              <a href="/library">Explore All Clusters</a>
            </Button>
          </article>
        </aside>
      </section>

      <section className="celestial-card mt-5 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="db-pulse-dot" />
          <p className="text-sm italic text-muted-foreground">
            "The library grows at 4.2 documents per day. Deep analysis recommended for Recent Archives."
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
