import { CheckCircle2, Files, MessageSquareText, Share2 } from 'lucide-react'

const benefits = [
  { icon: Files, label: 'Organize documents by subject and semester' },
  { icon: Share2, label: 'Share with Viewer or Editor permissions' },
  { icon: MessageSquareText, label: 'Ask AI with a visible document scope' },
]

export default function AcademicAside() {
  return (
    <aside className="max-w-[390px] lg:pr-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-primary">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        One workspace for your study sources
      </div>
      <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.03em] text-foreground">
        Continue where your documents left off.
      </h1>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        Sign in to manage files, continue recent conversations, and keep study material connected to its source.
      </p>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {benefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <li className="flex items-center gap-3 py-4 text-sm font-medium" key={benefit.label}>
              <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {benefit.label}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
