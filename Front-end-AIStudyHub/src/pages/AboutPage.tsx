import { BookOpenCheck, Brain, Compass, Library, Sparkles } from 'lucide-react'
import PublicNav from '../components/shared/PublicNav'

const stats = [
  ['12M+', 'Papers Indexed'],
  ['800K', 'Active Researchers'],
  ['99.9%', 'Uptime Library'],
  ['142', 'Academic Partners'],
]

const values = [
  {
    icon: Brain,
    title: 'Human-first AI',
    text: 'AI Study Hub is designed to clarify research, not replace the thinking that makes study meaningful.',
  },
  {
    icon: Library,
    title: 'Structured knowledge',
    text: 'Documents, notes, chats, and evaluations stay connected so learners can move through complex material with less friction.',
  },
  {
    icon: Compass,
    title: 'Calm focus',
    text: 'The interface stays quiet, legible, and purposeful so deep work remains the center of the experience.',
  },
]

export default function AboutPage() {
  return (
    <div className="celestial-page min-h-svh overflow-x-hidden bg-transparent font-sans text-foreground">
      <PublicNav dashboardHref="/#dashboard" />

      <main className="relative z-[1] pb-24 pt-[190px] md:pt-[240px]">
        <section className="mx-auto w-[min(100%,1120px)] px-5 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-[18px]">
            <Sparkles className="size-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
            <span className="text-[13px] font-medium text-white/74">Built for scholarly orbit</span>
          </div>
          <h1 className="celestial-title lp-stellar-text-glow mx-auto max-w-[760px] text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.14]">
            About AI Study Hub
          </h1>
          <p className="mx-auto mt-6 max-w-[720px] text-base leading-7 text-white/70">
            AI Study Hub helps students and researchers turn dense academic material into
            searchable insight, guided study, and sharper evaluation without losing focus.
          </p>
        </section>

        <section className="mx-auto mt-20 grid w-[min(100%,1120px)] gap-6 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="celestial-card tone-surface lp-premium-card p-8 md:p-10">
            <BookOpenCheck className="mb-8 size-9 text-[var(--accent-gold)]" aria-hidden="true" />
            <h2 className="text-3xl font-medium leading-tight md:text-4xl">A calmer way to study with AI</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
              Our mission is to make academic work feel navigable. The platform organizes
              documents, extracts context, supports AI conversations, and turns progress into
              visible learning signals.
            </p>
          </article>

          <aside className="grid gap-4">
            {values.map((item) => {
              const Icon = item.icon
              return (
                <article className="celestial-card tone-surface lp-premium-card flex gap-4 p-5" key={item.title}>
                  <span className="lp-soft-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              )
            })}
          </aside>
        </section>

        <section className="mx-auto mt-20 w-[min(100%,1120px)] px-5">
          <div className="celestial-card tone-surface lp-premium-card grid gap-6 p-6 md:grid-cols-4 md:p-8">
            {stats.map(([value, label]) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center" key={label}>
                <div className="text-3xl font-medium leading-none">{value}</div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 px-5 text-center">
          <div className="celestial-card tone-surface lp-premium-card mx-auto w-[min(100%,820px)] p-8 md:p-12">
            <h2 className="celestial-title text-[clamp(2rem,4vw,3rem)] font-medium leading-tight">
              Ready to build your study orbit?
            </h2>
            <p className="mx-auto mt-4 max-w-[540px] text-sm leading-7 text-muted-foreground">
              Join the scholars who have already claimed their place in the intellectual cosmos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a className="lp-pulsing-btn inline-flex min-h-[46px] items-center rounded-full px-[29px] text-sm font-medium" href="/register">
                Start Exploration
              </a>
              <a className="video-pill-ghost inline-flex min-h-[46px] items-center rounded-full px-[29px] text-sm font-medium" href="/login">
                Log In
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
