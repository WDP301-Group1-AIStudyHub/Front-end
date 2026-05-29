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
        eyebrow="Navigation Lost"
        footer="Guidance System Active"
        title={<>Lost in<br />Space?</>}
        variant="lost"
      />
      <section className="celestial-card tone-surface tone-cyan relative min-h-[430px] overflow-hidden p-12">
        <h2 className="celestial-title m-0 mb-9 text-[32px] font-light leading-[1.2]">Recovery</h2>
        <p className="mb-9 max-w-[330px] text-sm leading-[1.5] text-muted-foreground">Enter your email to receive a celestial link to reset your access.</p>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2" htmlFor="recovery-email">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Stellar Identifier</span>
            <input
              autoComplete="email"
              disabled={loading}
              id="recovery-email"
              name="email"
              onChange={handleChange}
              placeholder="scholar@astronomy.edu"
              required
              type="email"
              value={email}
              className="min-h-[54px] w-full rounded-md border border-input bg-background/45 pl-4 pr-4 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          {error ? (
            <p className="m-0 text-xs leading-relaxed text-red-300">{error}</p>
          ) : null}
          {success ? (
            <p className="m-0 text-xs leading-relaxed text-emerald-200">{success}</p>
          ) : null}
          <button
            disabled={loading}
            type="submit"
            className="min-h-[56px] w-full rounded-lg bg-primary text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground transition-all hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? <CelestialInlineLoader className="justify-center" label="Sending..." /> : 'Send Recovery Link'}
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
