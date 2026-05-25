import AuthIcon from './AuthIcon'

export default function AcademicAside() {
  return (
    <aside className="max-w-[320px]">
      <h1 className="celestial-title m-0 mb-5 text-[32px] font-light leading-[1.2]">Enter the Academic Cosmos</h1>
      <p className="m-0 mb-7 text-sm leading-[1.65] text-muted-foreground">
        Access your celestial study nodes and continue your journey through the expanse of knowledge.
      </p>
      <div className="celestial-card tone-surface tone-gold inline-flex min-w-[250px] items-center gap-[14px] px-5 py-[18px]">
        <AuthIcon name="school" className="h-[22px] w-[22px] flex-shrink-0 text-[var(--accent-gold)]" />
        <span className="grid gap-1 text-[11px] tracking-[0.02em] text-muted-foreground">
          <strong className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Active Research</strong>
          2,831 Students Online
        </span>
      </div>
    </aside>
  )
}
