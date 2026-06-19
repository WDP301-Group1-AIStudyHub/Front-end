import { BookOpenCheck, Brain, Compass, Library } from 'lucide-react'
import CelestialBackdrop from '../components/shared/CelestialBackdrop'
import PublicNav from '../components/shared/PublicNav'

const stats = [
  ['Multi-format', 'Document support'],
  ['Grounded', 'AI answers'],
  ['Traceable', 'Source panels'],
  ['Measured', 'RAG evaluation'],
]

const values = [
  {
    icon: Brain,
    title: 'Human-first AI',
    text: 'The product clarifies research material without replacing the judgment that makes learning meaningful.',
  },
  {
    icon: Library,
    title: 'Structured knowledge',
    text: 'Documents, chats, subjects, and evaluations stay connected across the study workflow.',
  },
  {
    icon: Compass,
    title: 'Calm focus',
    text: 'The interface favors legibility, quiet hierarchy, and fewer distractions during deep work.',
  },
]

export default function AboutPage() {
  return (
    <div className="botanical-page min-h-svh overflow-x-hidden font-sans text-foreground">
      <CelestialBackdrop intensity="subtle" />
      <PublicNav dashboardHref="/#dashboard" />

      <main className="relative z-[1] pb-20 pt-28 md:pt-32">
        <section className="mx-auto grid w-[min(100%,1120px)] gap-8 px-4 py-12 md:grid-cols-[0.75fr_1fr] md:px-6">
          <p className="botanical-kicker">Built for researchers</p>
          <div>
            <h1 className="moonlit-title text-[clamp(2.5rem,6vw,4.8rem)] leading-none">
              About AI Study Hub
            </h1>
            <p className="mt-6 max-w-[68ch] text-base leading-7 text-muted-foreground md:text-lg">
              AI Study Hub helps students and researchers turn dense academic material into searchable insight, guided study, and sharper evaluation.
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-[min(100%,1120px)] gap-5 px-4 md:grid-cols-[1.05fr_0.95fr] md:px-6">
          <article className="botanical-bento p-7 md:p-9">
            <BookOpenCheck className="mb-7 size-9 text-primary" aria-hidden="true" />
            <h2 className="moonlit-title text-3xl leading-tight md:text-4xl">A simpler way to study with AI</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Our mission is to make academic work feel navigable. The platform organizes documents, extracts context, supports AI conversations, and turns progress into visible learning signals.
            </p>
          </article>

          <aside className="grid gap-4">
            {values.map((item) => {
              const Icon = item.icon
              return (
                <article className="botanical-card flex gap-4 p-5" key={item.title}>
                  <span className="admin-icon-badge size-10 shrink-0">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              )
            })}
          </aside>
        </section>

        <section className="mx-auto w-[min(100%,1120px)] px-4 py-12 md:px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
            {stats.map(([value, label]) => (
              <div className="bg-card p-6 text-left" key={label}>
                <div className="text-3xl font-semibold tracking-tight">{value}</div>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(100%,820px)] px-4 py-8 text-center md:px-6">
          <div className="botanical-bento p-8 md:p-12">
            <h2 className="moonlit-title text-3xl leading-tight md:text-4xl">Ready to start?</h2>
            <p className="mx-auto mt-4 max-w-[540px] text-sm leading-6 text-muted-foreground">
              Create an account to organize your files and begin practicing with your own material.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]" href="/register">
                Get started
              </a>
              <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted" href="/login">
                Log in
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
