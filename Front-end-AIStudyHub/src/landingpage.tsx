import { BookOpenCheck, FileSearch, Library, MessageSquareText, Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'motion/react'
import PublicNav from './components/shared/PublicNav'
import CelestialBackdrop from './components/shared/CelestialBackdrop'

const stats = [
  ['12M+', 'Papers indexed', 'Nguồn tài liệu học thuật'],
  ['800K', 'Active learners', 'Học viên tích cực'],
  ['99.9%', 'Workspace uptime', 'Thời gian hoạt động'],
  ['142', 'Academic partners', 'Đối tác học thuật'],
]

const features = [
  {
    icon: FileSearch,
    title: 'Structured document review',
    text: 'Upload study material, keep metadata clear, and move from source files to focused summaries.',
    colSpan: 'md:col-span-2',
    element: (
      <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
        <div className="flex items-center gap-2 border-b border-border/50 pb-2 text-xs font-semibold text-primary">
          <FileSearch className="size-3.5" />
          <span>reviewing_rag_source.pdf</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Processing</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-3/4 rounded-full bg-muted-foreground/10" />
          <div className="h-2 w-5/6 rounded-full bg-muted-foreground/10" />
          <div className="h-2 w-1/2 rounded-full bg-muted-foreground/10" />
        </div>
      </div>
    )
  },
  {
    icon: MessageSquareText,
    title: 'Grounded AI chat',
    text: 'Ask questions against your own library while keeping the conversation tied to selected documents.',
    colSpan: 'md:col-span-1',
    element: (
      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
        <div className="self-end rounded-lg bg-primary px-2.5 py-1 text-primary-foreground">
          What is RAG?
        </div>
        <div className="self-start rounded-lg bg-secondary px-2.5 py-1 text-foreground border border-border/40">
          Retrieval-Augmented Generation relies on...
        </div>
      </div>
    )
  },
  {
    icon: BookOpenCheck,
    title: 'Benchmark your answers',
    text: 'Compare retrieval modes and inspect evidence so evaluation feels practical, not abstract.',
    colSpan: 'md:col-span-1',
    element: (
      <div className="mt-6 space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Faithfulness</span>
          <span className="font-semibold text-primary">96%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: '96%' }} />
        </div>
      </div>
    )
  },
  {
    icon: Shield,
    title: 'Safe Academic Environment',
    text: 'An organic, distraction-free space built specifically for deep academic reading and model assessment.',
    colSpan: 'md:col-span-2',
    element: (
      <div className="mt-6 flex flex-wrap gap-2">
        {['No ads', 'Earthy design', 'Optimized CPU', 'E2E Encryption'].map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
            <CheckCircle2 className="size-3 text-primary" />
            {tag}
          </span>
        ))}
      </div>
    )
  }
]

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 25
      }
    }
  } as const

  return (
    <div className="celestial-page min-h-svh overflow-x-hidden font-sans text-foreground">
      {/* Nature Background */}
      <CelestialBackdrop />

      <PublicNav />

      <main className="relative z-10 pb-20 pt-28 md:pt-32">
        {/* Hero Section */}
        <section className="mx-auto grid w-[min(100%,1180px)] items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-6 lg:py-16">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-2xl z-10"
          >
            <motion.p variants={itemVariants} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              AI Study Hub • Nature-inspired RAG Workspace
            </motion.p>
            <motion.h1 variants={itemVariants} className="celestial-title text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.02] tracking-tight">
              A quieter workspace for serious study.
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-6 max-w-[54ch] text-base leading-relaxed text-muted-foreground md:text-lg">
              Organize documents, chat with your sources, and evaluate RAG answers in one calm, biophilic academic workspace.
            </motion.p>
            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Create account
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card/65 backdrop-blur-sm px-5 text-sm font-semibold text-foreground transition-all hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign in
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
            className="celestial-card overflow-hidden p-3 bg-card/50 backdrop-blur-xs relative group"
          >
            {/* Fine botanical line art background overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-15 transition-opacity" />
            <img
              src="/landing-assets/hero-illustration.png"
              alt="AI Study Hub workspace preview"
              className="aspect-[4/3] w-full rounded-lg border border-border/80 object-cover filter contrast-[1.02] transition-transform duration-700 group-hover:scale-[1.01]"
              onError={(e) => {
                // fallback if the image doesn't exist yet
                e.currentTarget.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop";
              }}
            />
          </motion.div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="dashboard" className="mx-auto w-[min(100%,1180px)] px-4 py-12 md:px-6">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-sm font-bold tracking-wider text-primary uppercase">Core Features</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Designed for organic learning flow</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.article 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20, delay: idx * 0.1 }}
                  className={`celestial-card p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform ${feature.colSpan}`}
                  key={feature.title}
                >
                  <div>
                    <span className="admin-icon-badge mb-5">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                  </div>
                  {feature.element}
                </motion.article>
              )
            })}
          </div>
        </section>

        {/* Informational Section */}
        <section className="mx-auto w-[min(100%,1180px)] px-4 py-10 md:px-6">
          <div className="celestial-panel grid gap-0 overflow-hidden md:grid-cols-[0.9fr_1.1fr] bg-card/40 backdrop-blur-xs">
            <div className="border-b border-border/70 p-6 md:border-b-0 md:border-r md:p-8 flex flex-col justify-between">
              <div>
                <Library className="mb-5 size-8 text-primary" aria-hidden="true" />
                <h2 className="celestial-title text-3xl leading-tight md:text-4xl">
                  From library to answer, with less noise.
                </h2>
              </div>
              <p className="mt-6 text-xs text-muted-foreground/80">Organic structure reduces learning fatigue.</p>
            </div>
            <div className="grid gap-5 p-6 md:p-8 justify-center">
              {[
                'Keep documents, subjects, versions, and metadata legible.',
                'Move into chat with a selected source instead of searching from scratch.',
                'Run evaluations when you need evidence about answer quality.',
              ].map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="flex gap-4 border-b border-border/50 pb-4 last:border-b-0 last:pb-0" 
                  key={item}
                >
                  <span className="mt-2 size-2 rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mx-auto w-[min(100%,1180px)] px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/40 md:grid-cols-4 shadow-xs">
            {stats.map(([value, label, desc]) => (
              <div className="bg-card/75 backdrop-blur-xs p-6 flex flex-col justify-between" key={label}>
                <div>
                  <div className="text-3xl font-bold tracking-tight text-primary">{value}</div>
                  <span className="mt-1 block text-sm font-semibold text-foreground">{label}</span>
                </div>
                <span className="mt-4 block text-[11px] text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto w-[min(100%,900px)] px-4 py-12 text-center md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="celestial-card p-8 md:p-12 bg-card/65 backdrop-blur-xs relative overflow-hidden"
          >
            <h2 className="celestial-title text-3xl leading-tight md:text-4xl">Ready for a cleaner study routine?</h2>
            <p className="mx-auto mt-4 max-w-[50ch] text-sm leading-relaxed text-muted-foreground">
              Start with your library, then let chat and evaluation help you learn from it in a distraction-free organic environment.
            </p>
            <a
              href="/register"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-primary bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Create free account
            </a>
          </motion.div>
        </section>
      </main>

      <footer className="w-full border-t border-border/60 bg-card/80 backdrop-blur-sm py-8 text-foreground relative z-10">
        <div className="mx-auto flex w-[min(100%,1180px)] flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <div className="font-bold text-primary flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" />
            AI Study Hub
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Contact'].map((label) => (
              <a className="transition-colors hover:text-foreground" href={`#${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>
                {label}
              </a>
            ))}
          </div>
          <div>2026 AI Study Hub. Developed with organic motion principles.</div>
        </div>
      </footer>
    </div>
  )
}
