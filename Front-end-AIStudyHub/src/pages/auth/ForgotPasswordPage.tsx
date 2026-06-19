import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import AuthIcon from '../../components/auth/AuthIcon'
import AuthScaffold from '../../components/auth/AuthScaffold'
import SplitInfoCard from '../../components/auth/SplitInfoCard'
import { CelestialInlineLoader } from '../../components/shared/CelestialLoading'
import { forgotPassword } from '../../services/authApi'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await forgotPassword({ email })
      setSuccess(response.message)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to request recovery')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScaffold action="Register" mode="split">
      <SplitInfoCard
        eyebrow="Account recovery"
        footer="Recovery support"
        title={<>Need access<br />again?</>}
        variant="lost"
      />
      <section className="moonlit-card relative min-h-[430px] overflow-hidden p-12">
        <h2 className="moonlit-title m-0 mb-4 text-[32px] leading-[1.2]">Recovery</h2>
        <p className="mb-9 max-w-[330px] text-sm leading-[1.6] text-muted-foreground">Enter your email to receive a secure reset link.</p>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2" htmlFor="recovery-email">
            <span className="text-sm font-medium text-muted-foreground">Email address</span>
            <input
              autoComplete="email"
              disabled={loading}
              id="recovery-email"
              name="email"
              onChange={handleChange}
              placeholder="scholar@example.edu"
              required
              type="email"
              value={email}
              className="min-h-[54px] w-full rounded-md border border-input bg-background/45 pl-4 pr-4 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          {error ? (
            <p className="m-0 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">{error}</p>
          ) : null}
          {success ? (
            <p className="m-0 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs leading-relaxed text-primary">{success}</p>
          ) : null}
          <button
            disabled={loading}
            type="submit"
            className="min-h-[52px] w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <CelestialInlineLoader className="justify-center" label="Sending..." /> : 'Send recovery link'}
          </button>
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
