import AuthIcon from './AuthIcon'

export default function AcademicAside() {
  return (
    <aside className="max-w-[320px] text-white">
      <h1 className="m-0 mb-5 text-white text-[32px] font-light leading-[1.2]">Enter the Academic Cosmos</h1>
      <p className="m-0 mb-7 text-[rgba(196,199,200,0.72)] text-sm leading-[1.65]">
        Access your celestial study nodes and continue your journey through the expanse of knowledge.
      </p>
      <div className="inline-flex min-w-[250px] items-center gap-[14px] px-5 py-[18px] border border-white/10 rounded-[10px] bg-white/[0.03] backdrop-blur-[20px]">
        <AuthIcon name="school" className="w-[22px] h-[22px] text-white flex-shrink-0" />
        <span className="grid gap-1 text-[rgba(229,226,225,0.55)] text-[11px] tracking-[0.02em]">
          <strong className="text-white text-xs font-semibold tracking-[0.15em] uppercase">Active Research</strong>
          2,831 Students Online
        </span>
      </div>
    </aside>
  )
}
