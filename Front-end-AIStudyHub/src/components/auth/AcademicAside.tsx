import AuthIcon from './AuthIcon'

export default function AcademicAside() {
  return (
    <aside className="max-w-[360px]">
      <p className="botanical-kicker mb-5">Study garden</p>
      <h1 className="moonlit-title m-0 mb-5 text-[42px] leading-[1.02]">Enter a calmer workspace</h1>
      <p className="m-0 mb-7 text-sm leading-[1.65] text-muted-foreground">
        Access documents, questions, and recent sessions from one focused place designed to feel quiet and familiar.
      </p>
      <div className="moonlit-media-frame mb-5 h-44">
        <img
          alt="Moonlit botanical study desk"
          className="moonlit-image"
          src="/landing-assets/moonlit-study-still.webp"
        />
      </div>
      <div className="botanical-card inline-flex min-w-[250px] items-center gap-[14px] px-5 py-[18px]">
        <AuthIcon name="school" className="h-[22px] w-[22px] flex-shrink-0 text-primary" />
        <span className="grid gap-1 text-[11px] tracking-[0.02em] text-muted-foreground">
          <strong className="text-xs font-semibold text-foreground">Active research</strong>
          2,831 study sessions online
        </span>
      </div>
    </aside>
  )
}
