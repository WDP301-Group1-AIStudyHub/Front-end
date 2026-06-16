import { BookOpenCheck, FileSearch, Library, MessageSquareText } from 'lucide-react'
import PublicNav from './components/shared/PublicNav'

const stats = [
  ['12M+', 'Papers indexed'],
  ['800K', 'Active learners'],
  ['99.9%', 'Workspace uptime'],
  ['142', 'Academic partners'],
]

const features = [
  {
    icon: FileSearch,
    title: 'Structured document review',
    text: 'Upload study material, keep metadata clear, and move from source files to focused summaries.',
  },
  {
    icon: MessageSquareText,
    title: 'Grounded AI chat',
    text: 'Ask questions against your own library while keeping the conversation tied to selected documents.',
  },
  {
    icon: BookOpenCheck,
    title: 'Benchmark your answers',
    text: 'Compare retrieval modes and inspect evidence so evaluation feels practical, not abstract.',
  },
]

export default function LandingPage() {
  return (
    <div className="celestial-page min-h-svh overflow-x-hidden font-sans text-foreground">
      <PublicNav />

      <main className="relative z-[1] pb-20 pt-28 md:pt-32">
        <section className="mx-auto grid w-[min(100%,1180px)] items-center gap-10 px-4 py-12 md:grid-cols-[0.95fr_1.05fr] md:px-6 lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold text-primary">
              AI Study Hub
            </p>
            <h1 className="celestial-title text-[clamp(2.6rem,6vw,5.25rem)] leading-[0.98]">
              A quieter workspace for serious study.
            </h1>
            <p className="mt-6 max-w-[58ch] text-base leading-7 text-muted-foreground md:text-lg">
              Organize documents, chat with your sources, and evaluate RAG answers in one calm academic workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]"
              >
                Create account
              </a>
              <a
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Sign in
              </a>
            </div>
          </div>

          <div className="celestial-card overflow-hidden p-3">
            <img
              src="/landing-assets/hero-illustration.png"
              alt="AI Study Hub workspace preview"
              className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
            />
          </div>
        </section>

        <section id="dashboard" className="mx-auto w-[min(100%,1180px)] px-4 py-10 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article className="celestial-card p-6" key={feature.title}>
                  <span className="admin-icon-badge mb-5">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-xl font-semibold tracking-tight">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mx-auto w-[min(100%,1180px)] px-4 py-10 md:px-6">
          <div className="celestial-panel grid gap-0 overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border p-6 md:border-b-0 md:border-r md:p-8">
              <Library className="mb-5 size-8 text-primary" aria-hidden="true" />
              <h2 className="celestial-title text-3xl leading-tight md:text-4xl">
                From library to answer, with less noise.
              </h2>
            </div>
            <div className="grid gap-4 p-6 md:p-8">
              {[
                'Keep documents, subjects, versions, and metadata legible.',
                'Move into chat with a selected source instead of searching from scratch.',
                'Run evaluations when you need evidence about answer quality.',
              ].map((item) => (
                <div className="flex gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0" key={item}>
                  <span className="mt-2 size-2 rounded-full bg-primary" aria-hidden="true" />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(100%,1180px)] px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
            {stats.map(([value, label]) => (
              <div className="bg-card p-6" key={label}>
                <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
                <span className="mt-2 block text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(100%,900px)] px-4 py-12 text-center md:px-6">
          <div className="celestial-card p-8 md:p-12">
            <h2 className="celestial-title text-3xl leading-tight md:text-4xl">Ready for a cleaner study routine?</h2>
            <p className="mx-auto mt-4 max-w-[54ch] text-sm leading-6 text-muted-foreground">
              Start with your library, then let chat and evaluation help you learn from it.
            </p>
            <a
              href="/register"
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]"
            >
              Create free account
            </a>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-border bg-card py-8 text-foreground">
        <div className="mx-auto flex w-[min(100%,1180px)] flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <div className="font-semibold text-foreground">AI Study Hub</div>
          <div className="flex flex-wrap items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Contact'].map((label) => (
              <a className="transition-colors hover:text-foreground" href={`#${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>
                {label}
              </a>
            ))}
          </div>
          <div>2024 AI Study Hub. Built for researchers.</div>
        </div>
      </footer>
    </div>
  )
}
