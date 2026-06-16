import { Link } from 'react-router-dom'
import AuthScaffold from '../../components/auth/AuthScaffold'
import SplitInfoCard from '../../components/auth/SplitInfoCard'

export default function ResetPasswordPage() {
  return (
    <AuthScaffold action="Register" mode="split" showFooter>
      <SplitInfoCard
        eyebrow="Account recovery"
        footer="Recovery support"
        title={<>Reset access</>}
        variant="found"
      />
      <section className="celestial-card relative min-h-[430px] overflow-hidden p-12">
        <h2 className="celestial-title m-0 mb-3 text-[32px] leading-[1.2]">Reset password</h2>
        <p className="mb-9 max-w-[360px] text-sm leading-[1.5] text-muted-foreground">
          Password reset links are not active on this backend yet. Request a recovery email or return to sign in.
        </p>
        <div className="grid gap-4">
          <a
            href="/forgot-password"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]"
          >
            Request recovery
          </a>
          <a
            href="/login"
            className="inline-flex w-full items-center justify-center text-xs font-semibold text-foreground hover:text-primary"
          >
            Back to sign in
          </a>
        </div>
        <Link to="/" className="mt-[26px] inline-flex w-full items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground">
          Return home
        </Link>
      </section>
    </AuthScaffold>
  )
}
