import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  Library,
  MessageSquareText,
  Shield,
  Sprout,
} from 'lucide-react'
import { motion } from 'motion/react'
import PublicNav from './components/shared/PublicNav'
import CelestialBackdrop from './components/shared/CelestialBackdrop'

const stats = [
  ['Multi-format', 'Document intake', 'PDF, DOCX, PPTX, XLSX, TXT, and MD sources'],
  ['Subject color', 'Organized context', 'Course codes stay visually tied to each subject'],
  ['Basic + corrective', 'RAG modes', 'Compare retrieval behavior before trusting an answer'],
  ['Benchmark-ready', 'Evaluation flow', 'Create questions and inspect answer quality'],
]

const features = [
  {
    icon: FileSearch,
    title: 'Library that stays readable',
    text: 'Upload study documents, keep metadata tidy, and move from source files to summaries without losing context.',
    colSpan: 'md:col-span-2',
  },
  {
    icon: MessageSquareText,
    title: 'Grounded AI chat',
    text: 'Ask against selected documents so answers stay close to your own material.',
    colSpan: 'md:col-span-1',
  },
  {
    icon: BookOpenCheck,
    title: 'Practical evaluation',
    text: 'Compare RAG modes, inspect sources, and understand answer quality before you trust it.',
    colSpan: 'md:col-span-1',
  },
  {
    icon: Shield,
    title: 'Quiet by design',
    text: 'A warm, low-noise study surface built for focus, review, and repeat use.',
    colSpan: 'md:col-span-2',
  },
]

const process = [
  'Plant your course documents in one organized library.',
  'Choose a subject or document before starting an AI study session.',
  'Use evaluation signals to decide what needs another pass.',
]

export default function LandingPage() {
  return (
    <div className="botanical-page min-h-svh overflow-x-hidden font-sans text-foreground">
      <CelestialBackdrop intensity="subtle" />
      <PublicNav ctaLabel="Start studying" />

      <main className="relative z-10 pb-20 pt-28 md:pt-32">
        <section className="mx-auto grid w-[min(100%,1180px)] items-end gap-10 px-4 py-10 md:grid-cols-[0.95fr_1.05fr] md:px-6 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="botanical-kicker">Moonlit botanical workspace</p>
            <h1 className="moonlit-title mt-5 text-[clamp(3rem,8vw,6.2rem)] leading-[0.94]">
              AI Study Hub
            </h1>
            <p className="mt-6 max-w-[58ch] text-base leading-7 text-muted-foreground md:text-lg">
              A softer way to organize documents, chat with trusted sources, and evaluate RAG answers without turning study time into another noisy dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] active:scale-[0.98]"
              >
                Create account
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              >
                Sign in
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]"
          >
            <div className="moonlit-media-frame min-h-[420px] p-5 md:translate-y-10">
              <video
                aria-hidden="true"
                autoPlay
                className="moonlit-video absolute inset-0"
                loop
                muted
                playsInline
                poster="/landing-assets/moonlit-botanical-poster.webp"
                preload="metadata"
              >
                <source src="/landing-assets/moonlit-botanical-loop.mp4" type="video/mp4" />
              </video>
              <img
                alt=""
                aria-hidden="true"
                className="moonlit-image moonlit-video-poster absolute inset-0"
                src="/landing-assets/moonlit-botanical-poster.webp"
              />
              <div className="absolute inset-0 bg-[rgb(247_248_241_/_0.32)]" aria-hidden="true" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <span className="admin-icon-badge admin-tone-teal">
                    <Sprout className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-sm font-semibold text-muted-foreground">Today under soft light</p>
                  <h2 className="mt-2 font-heading text-3xl font-bold leading-tight">4 documents ready for review</h2>
                </div>
                <div className="space-y-3">
                  {['WDP301 notes', 'TrietHoc outline', 'RAG evaluation'].map((item, index) => (
                    <div className="rounded-2xl border border-border bg-card/85 p-3 backdrop-blur-sm" key={item}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold">{item}</span>
                        <span className="botanical-chip">{index === 0 ? 'Fresh' : 'Indexed'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="botanical-bento overflow-hidden p-4">
                <div className="moonlit-media-frame relative z-10 h-36">
                  <img
                    alt="A calm moonlit study desk with paper and plants"
                    className="moonlit-image"
                    src="/landing-assets/moonlit-study-still.webp"
                  />
                </div>
                <div className="relative z-10 mt-4 rounded-2xl border border-border bg-[var(--sun-wash)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">Selected source</p>
                      <p className="mt-2 text-lg font-bold">retrieval_notes.pdf</p>
                    </div>
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-primary">96%</span>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="h-2 w-5/6 rounded-full bg-card" />
                    <div className="h-2 w-2/3 rounded-full bg-card" />
                    <div className="h-2 w-3/4 rounded-full bg-card" />
                  </div>
                </div>
              </div>
              <div className="botanical-bento p-5">
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="self-end rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    Explain corrective RAG.
                  </div>
                  <div className="self-start rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                    It checks retrieval quality before answering...
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="dashboard" className="mx-auto w-[min(100%,1180px)] px-4 py-12 md:px-6">
          <div className="mb-8 max-w-2xl">
            <p className="botanical-kicker">Bento workflow</p>
            <h2 className="moonlit-title mt-3 text-3xl leading-tight md:text-5xl">Designed for organic learning flow</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className={`botanical-bento p-6 ${feature.colSpan}`}
                  key={feature.title}
                >
                  <div className="relative z-10">
                    <span className="admin-icon-badge">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-xl font-bold tracking-normal">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </section>

        <section className="mx-auto grid w-[min(100%,1180px)] gap-5 px-4 py-10 md:grid-cols-[0.88fr_1.12fr] md:px-6">
          <article className="botanical-bento p-7 md:p-9">
            <div className="relative z-10">
              <Library className="mb-6 size-9 text-primary" aria-hidden="true" />
              <h2 className="moonlit-title text-3xl leading-tight md:text-4xl">From library to answer, with less friction.</h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground md:text-base">
                AI Study Hub keeps the loop simple: organize the source, ask a grounded question, inspect the evidence, then keep learning.
              </p>
            </div>
          </article>

          <div className="grid gap-4">
            <article className="moonlit-media-frame min-h-52">
              <img
                alt="A quiet botanical library surface in soft moon-paper light"
                className="moonlit-image"
                src="/landing-assets/moonlit-library-still.webp"
              />
            </article>
            {process.map((item, index) => (
              <article className="botanical-card p-5" key={item}>
                <div className="relative z-10 flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-[#f7efd2] text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(100%,1180px)] px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(([value, label, desc]) => (
              <div className="botanical-card p-5" key={label}>
                <div className="relative z-10">
                  <div className="font-heading text-3xl font-bold text-primary">{value}</div>
                  <span className="mt-2 block text-sm font-bold">{label}</span>
                  <span className="mt-4 block text-xs leading-5 text-muted-foreground">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(100%,900px)] px-4 py-12 text-center md:px-6">
          <div className="botanical-bento p-8 md:p-12">
            <div className="relative z-10">
              <h2 className="moonlit-title text-3xl leading-tight md:text-4xl">Ready for a cleaner study routine?</h2>
              <p className="mx-auto mt-4 max-w-[54ch] text-sm leading-6 text-muted-foreground">
                Start with one document. Grow a library, a chat history, and a better review rhythm from there.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {['No ads', 'Readable sources', 'Calm motion', 'Evaluation-ready'].map((tag) => (
                  <span className="botanical-chip" key={tag}>
                    <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href="/register"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] active:scale-[0.98]"
              >
                Create free account
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/70 bg-card/80 py-8">
        <div className="mx-auto flex w-[min(100%,1180px)] flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <strong className="text-primary">AI Study Hub</strong>
          <div className="flex flex-wrap items-center gap-5">
            {['Privacy', 'Terms', 'Contact'].map((label) => (
              <a className="transition-colors hover:text-foreground" href={`#${label.toLowerCase()}`} key={label}>
                {label}
              </a>
            ))}
          </div>
          <div>2026. Botanical Bento study interface.</div>
        </div>
      </footer>
    </div>
  )
}
