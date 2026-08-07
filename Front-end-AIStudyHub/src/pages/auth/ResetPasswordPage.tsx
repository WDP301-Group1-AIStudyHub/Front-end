import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import AuthIcon from '@/components/auth/AuthIcon'
import AuthScaffold from '@/components/auth/AuthScaffold'
import SplitInfoCard from '@/components/auth/SplitInfoCard'
import { CelestialInlineLoader } from '@/components/shared/CelestialLoading'
import { resetPassword } from '@/services/authApi'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? undefined

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, email, password })
      setSuccess(true)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthScaffold action="Register" mode="split">
        <SplitInfoCard
          eyebrow="Account recovery"
          footer="Recovery support"
          title={<>Reset access</>}
          variant="found"
        />
        <section className="relative min-h-[430px] overflow-hidden p-12">
          <h2 className="m-0 mb-3 text-2xl font-bold leading-[1.2]">Reset password</h2>
          <p className="mb-9 max-w-[360px] text-sm leading-[1.5] text-muted-foreground">
            This reset link is missing or invalid. Request a new one below.
          </p>
          <a
            href="/forgot-password"
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]"
          >
            Request recovery
          </a>
        </section>
      </AuthScaffold>
    )
  }

  if (success) {
    return (
      <AuthScaffold action="Register" mode="split">
        <SplitInfoCard
          eyebrow="Account recovery"
          footer="Recovery support"
          title={<>Password reset</>}
          variant="found"
        />
        <section className="relative min-h-[430px] overflow-hidden p-12">
          <h2 className="m-0 mb-3 text-2xl font-bold leading-[1.2]">You're all set</h2>
          <p className="mb-9 max-w-[360px] text-sm leading-[1.5] text-muted-foreground">
            Your password has been reset successfully. Sign in with your new password.
          </p>
          <a
            href="/login"
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)]"
          >
            Back to sign in
          </a>
        </section>
      </AuthScaffold>
    )
  }

  return (
    <AuthScaffold action="Register" mode="split">
      <SplitInfoCard
        eyebrow="Account recovery"
        footer="Recovery support"
        title={<>Reset access</>}
        variant="found"
      />
      <section className="relative min-h-[430px] overflow-hidden p-12">
        <h2 className="m-0 mb-4 text-2xl font-bold leading-[1.2]">Reset password</h2>
        <p className="mb-9 max-w-[330px] text-sm leading-[1.6] text-muted-foreground">
          Choose a new password for your account.
        </p>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2" htmlFor="new-password">
            <span className="text-sm font-medium text-muted-foreground">New password</span>
            <input
              autoComplete="new-password"
              disabled={loading}
              id="new-password"
              name="password"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              placeholder="Min. 8 characters"
              required
              type="password"
              value={password}
              className="min-h-[54px] w-full rounded-md border border-input bg-background/45 pl-4 pr-4 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <label className="grid gap-2" htmlFor="confirm-password">
            <span className="text-sm font-medium text-muted-foreground">Confirm password</span>
            <input
              autoComplete="new-password"
              disabled={loading}
              id="confirm-password"
              name="confirmPassword"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              required
              type="password"
              value={confirmPassword}
              className="min-h-[54px] w-full rounded-md border border-input bg-background/45 pl-4 pr-4 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          {error ? (
            <p className="m-0 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">{error}</p>
          ) : null}
          <Button
            className="min-h-[52px] w-full"
            disabled={loading}
            size="lg"
            type="submit"
          >
            {loading ? <CelestialInlineLoader className="justify-center" label="Resetting..." /> : 'Reset password'}
          </Button>
        </form>
        <a
          href="/login"
          className="mt-[26px] inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-foreground hover:text-primary"
        >
          <AuthIcon name="arrow_back" className="w-[18px] h-[18px]" />
          Back to Sign In
        </a>
      </section>
    </AuthScaffold>
  )
}
