import { Link } from 'react-router-dom'
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
      <section className="celestial-card relative min-h-[430px] overflow-hidden p-12">
        <h2 className="m-0 mb-3 text-[32px] font-light leading-[1.2]">Reset My Orbit</h2>
        <p className="mb-9 max-w-[360px] text-sm leading-normal text-muted-foreground">
          Password reset links are not active on this backend yet. Request a recovery email or return to sign in.
        </p>
        <div className="grid gap-4">
          <a
            href="/forgot-password"
            className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-all hover:scale-[1.01] hover:opacity-95"
          >
            Request Recovery
          </a>
          <a
            href="/login"
            className="inline-flex w-full items-center justify-center text-xs font-semibold text-foreground hover:text-primary"
          >
            Back to Sign In
          </a>
        </div>
        <Link to="/" className="mt-[26px] inline-flex w-full items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground">
          Return Home
        </Link>
      </section>
    </AuthScaffold>
  )
}
