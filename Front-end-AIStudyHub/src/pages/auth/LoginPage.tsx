import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AcademicAside from '../../components/auth/AcademicAside'
import AuthCardShell from '../../components/auth/AuthCardShell'
import AuthScaffold from '../../components/auth/AuthScaffold'
import FloatingField from '../../components/auth/FloatingField'
import { CelestialInlineLoader } from '../../components/shared/CelestialLoading'
import { login } from '../../services/authApi'

const initialForm = {
  email: '',
  password: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({
        email: form.email,
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScaffold action="Sign Up" mode="centered">
      <AcademicAside />
      <AuthCardShell subtitle="Authentication required" title="Welcome back">
        <form className="grid gap-[22px] mt-10" onSubmit={handleSubmit}>
          <FloatingField
            autoComplete="email"
            disabled={loading}
            id="email"
            label="Email Address"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
          <FloatingField
            autoComplete="current-password"
            disabled={loading}
            id="password"
            label="Password"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
          <div className="flex items-center justify-between gap-[18px] text-xs font-medium text-muted-foreground">
            <label className="inline-flex items-center gap-2">
              <input checked readOnly type="checkbox" className="h-4 w-4 accent-[var(--accent-blue)]" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-foreground hover:text-primary">Forgot?</Link>
          </div>
          {error ? (
            <p className="m-0 text-xs leading-relaxed text-destructive">{error}</p>
          ) : null}
          <button
            disabled={loading}
            type="submit"
            className="min-h-[52px] w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <CelestialInlineLoader className="justify-center" label="Authenticating..." /> : 'Log in to dashboard'}
          </button>
        </form>
      </AuthCardShell>
    </AuthScaffold>
  )
}
