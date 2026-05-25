import AuthScaffold from '../../components/auth/AuthScaffold'
import SplitInfoCard from '../../components/auth/SplitInfoCard'

export default function ResetPasswordPage() {
  return (
    <AuthScaffold action="Register" mode="split" showFooter>
      <SplitInfoCard
        eyebrow="Navigation Lost"
        footer="Guidance System Active"
        title={<>Found You !</>}
        variant="found"
      />
      <section className="relative overflow-hidden min-h-[430px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-[0_0_40px_rgba(0,0,0,0.24)] rounded-[18px] p-12">
        <h2 className="m-0 mb-3 text-white text-[32px] font-light leading-[1.2]">Reset My Orbit</h2>
        <p className="max-w-[360px] mb-9 text-[rgba(196,199,200,0.8)] text-sm leading-[1.5]">
          Password reset links are not active on this backend yet. Request a recovery email or return to sign in.
        </p>
        <div className="grid gap-4">
          <a
            href="/forgot-password"
            className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-white text-[#2f3131] text-xs font-semibold tracking-[0.15em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:opacity-90 hover:scale-[1.01] transition-all"
          >
            Request Recovery
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center w-full text-white text-xs font-semibold"
          >
            Back to Sign In
          </a>
        </div>
        <a href="/" className="inline-flex items-center justify-center w-full mt-[26px] text-white/50 text-xs font-semibold">
          Return Home
        </a>
      </section>
    </AuthScaffold>
  )
}
