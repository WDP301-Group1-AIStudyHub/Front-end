import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  MessageSquareText,
  MoreHorizontal,
  Search,
  Share2,
  Sparkles,
  UploadCloud,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import PublicNav from '@/components/shared/PublicNav'

const productRows = [
  { access: 'Owner', name: 'Machine Learning Notes', subject: 'CSE301', type: 'PDF' },
  { access: 'Editor', name: 'Research Methodology', subject: 'RES201', type: 'DOCX' },
  { access: 'Viewer', name: 'Project Requirements', subject: 'WDP301', type: 'PPTX' },
  { access: 'Owner', name: 'Data Structures Review', subject: 'CSD203', type: 'PDF' },
]

const workflow = [
  {
    icon: UploadCloud,
    title: 'Keep every source organized',
    description: 'Upload common document formats, assign subjects, track versions, and recover deleted files from one workspace.',
  },
  {
    icon: Share2,
    title: 'Share without losing control',
    description: 'Invite collaborators with Viewer or Editor access while ownership and destructive actions remain protected.',
  },
  {
    icon: MessageSquareText,
    title: 'Ask questions with context',
    description: 'Choose the documents and subjects AI can use, then inspect grounded answers without leaving your study flow.',
  },
]

function ProductPreview() {
  return (
    <div className="h-full min-w-[720px] overflow-hidden border border-border bg-white shadow-[0_8px_24px_rgb(16_24_20_/_0.1)]">
      <div className="flex h-14 items-center gap-3 border-b border-border px-5">
        <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <FileText className="size-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">My Document</p>
          <p className="text-xs text-muted-foreground">18 documents</p>
        </div>
        <Button className="ml-auto" type="button">
          <UploadCloud data-icon="inline-start" aria-hidden="true" />
          Upload
        </Button>
      </div>

      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-5 py-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <div className="h-9 rounded-md border border-input bg-card pl-9 pt-2 text-xs text-muted-foreground">
            Search documents
          </div>
        </div>
        <span className="rounded-md border border-border bg-card px-3 py-2 text-xs">All subjects</span>
        <span className="rounded-md border border-border bg-card px-3 py-2 text-xs">Recently updated</span>
      </div>

      <div className="grid grid-cols-[minmax(280px,1fr)_130px_100px_44px] border-b border-border bg-sidebar px-5 py-3 text-xs font-semibold text-muted-foreground">
        <span>Name</span>
        <span>Subject</span>
        <span>Access</span>
        <span />
      </div>
      {productRows.map((row) => (
        <div
          className="grid grid-cols-[minmax(280px,1fr)_130px_100px_44px] items-center border-b border-border px-5 py-4"
          key={row.name}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-accent bg-accent/50 text-primary">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.type} document</p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium">{row.subject}</span>
          <span className="text-xs text-muted-foreground">{row.access}</span>
          <MoreHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground">
      <PublicNav ctaLabel="Start studying" />

      <main>
        <section className="relative min-h-[640px] overflow-hidden border-b border-border px-5 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <div className="max-w-[590px] pt-8 lg:pt-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                Study from the documents you trust
              </div>
              <h1 className="max-w-[11ch] text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[5rem]">
                AI Study Hub
              </h1>
              <p className="mt-6 max-w-[50ch] text-base leading-7 text-muted-foreground sm:text-lg">
                Organize course documents, collaborate with your team, and ask grounded questions without switching between disconnected tools.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground" href="/register">
                  Create account
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a className="inline-flex h-11 items-center rounded-md border border-border bg-card px-5 text-sm font-semibold" href="/login">
                  Sign in
                </a>
              </div>
              <div className="mt-9 h-[180px] overflow-hidden border-y border-border sm:hidden" aria-hidden="true">
                <div className="h-[375px] w-[720px] origin-top-left scale-[0.48]">
                  <ProductPreview />
                </div>
              </div>
              <div className="mt-8 hidden flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:flex">
                {['Protected sharing', 'Version history', 'Grounded AI chat'].map((item) => (
                  <span className="inline-flex items-center gap-2" key={item}>
                    <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-[-20px] left-[52%] right-[-180px] top-[210px] hidden lg:block xl:left-[48%]" aria-hidden="true">
            <ProductPreview />
          </div>
        </section>

        <section className="border-b border-border bg-sidebar px-5 pb-20 pt-10 sm:px-8 lg:px-12" id="workflow">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">A direct path from source to study</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                The workspace stays familiar at every step, so documents remain the center of the experience.
              </p>
            </div>
            <div className="mt-12 divide-y divide-border border-y border-border">
              {workflow.map((item) => {
                const Icon = item.icon
                return (
                  <article className="grid gap-4 py-8 md:grid-cols-[56px_280px_1fr] md:items-start" key={item.title}>
                    <span className="grid size-10 place-items-center rounded-md border border-border bg-white text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <Brain className="size-8 text-primary" aria-hidden="true" />
              <h2 className="mt-5 max-w-[16ch] text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                AI answers stay tied to your study context
              </h2>
              <p className="mt-5 max-w-[65ch] text-base leading-7 text-muted-foreground">
                Select a subject, document, or version before asking. AI Study Hub keeps retrieval scope visible so you always know what informed an answer.
              </p>
            </div>
            <div className="border-y border-border py-4">
              <div className="flex justify-end py-3">
                <p className="max-w-[80%] rounded-lg bg-primary px-4 py-3 text-sm text-white">Summarize the key arguments in this document.</p>
              </div>
              <div className="py-3">
                <p className="max-w-[88%] rounded-lg border border-border bg-muted px-4 py-3 text-sm leading-6">
                  The document presents three main arguments and connects each one to the source sections selected in your current context.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Based on 3 selected sources</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-primary px-5 py-16 text-white sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Bring your next document into focus.</h2>
              <p className="mt-2 text-sm text-white/80">Create a workspace and start with the material you already use.</p>
            </div>
            <a className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-primary" href="/register">
              Get started
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
