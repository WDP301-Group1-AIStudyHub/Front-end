export default function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[{ src: '/auth-assets/social-1.png', label: 'Google' }, { src: '/auth-assets/social-2.png', label: 'Facebook' }].map(s => (
        <button
          key={s.label}
          type="button"
          className="inline-flex min-h-[50px] items-center justify-center gap-[10px] border border-white/10 rounded-xl text-[rgba(229,226,225,0.62)] bg-white/[0.03] uppercase hover:bg-white/[0.05] transition-colors"
        >
          <img src={s.src} alt="" className="w-5 h-5 object-contain" />
          <span className="text-xs font-semibold tracking-[0.12em]">{s.label}</span>
        </button>
      ))}
    </div>
  )
}
