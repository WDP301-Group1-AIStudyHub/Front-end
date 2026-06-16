import AuthIcon from './AuthIcon'

export default function AcademicAside() {
  return (
    <aside className="video-contrast-copy max-w-[320px]">
      <h1 className="celestial-title m-0 mb-5 text-[32px] leading-[1.2]">Enter your study workspace</h1>
      <p className="m-0 mb-7 text-sm leading-[1.65] text-muted-foreground">
        Access your documents, questions, and recent sessions from one focused place.
      </p>
      <div className="celestial-card inline-flex min-w-[250px] items-center gap-[14px] px-5 py-[18px]">
        <AuthIcon name="school" className="h-[22px] w-[22px] flex-shrink-0 text-primary" />
        <span className="grid gap-1 text-[11px] tracking-[0.02em] text-muted-foreground">
          <strong className="text-xs font-semibold text-foreground">Active research</strong>
          2,831 students online
        </span>
      </div>
    </aside>
  )
}
