export default function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[{ src: '/auth-assets/social-1.png', label: 'Google' }, { src: '/auth-assets/social-2.png', label: 'Facebook' }].map(s => (
        <button
          key={s.label}
          type="button"
          className="inline-flex min-h-[50px] items-center justify-center gap-[10px] rounded-xl border border-border/70 bg-card/45 text-muted-foreground uppercase transition-colors hover:border-primary/45 hover:bg-muted/45 hover:text-foreground"
        >
          <img src={s.src} alt="" className="w-5 h-5 object-contain" />
          <span className="text-xs font-semibold tracking-[0.12em]">{s.label}</span>
        </button>
      ))}
    </div>
  )
}
