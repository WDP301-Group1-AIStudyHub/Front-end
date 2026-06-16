import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AcademicAside from '../../components/auth/AcademicAside'
import AuthCardShell from '../../components/auth/AuthCardShell'
import AuthScaffold from '../../components/auth/AuthScaffold'
import FloatingField from '../../components/auth/FloatingField'
import PasswordField from '../../components/auth/PasswordField'
import { CelestialInlineLoader } from '../../components/shared/CelestialLoading'
import { register } from '../../services/authApi'

const initialForm = {
  confirmPassword: '',
  email: '',
  fullName: '',
  password: '',
}

export default function RegisterPage() {
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await register({
        email: form.email,
        fullName: form.fullName,
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScaffold action="Sign In" mode="centered" showFooter>
      <AcademicAside />
      <AuthCardShell subtitle="Create your study workspace" title="Create account">
        <form className="grid gap-5 mt-8" onSubmit={handleSubmit}>
          <FloatingField
            autoComplete="name"
            disabled={loading}
            id="full-name"
            label="Full Name"
            name="fullName"
            onChange={handleChange}
            required
            value={form.fullName}
          />
          <FloatingField
            autoComplete="email"
            disabled={loading}
            id="register-email"
            label="Email Address"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
          <PasswordField
            autoComplete="new-password"
            disabled={loading}
            id="register-password"
            label="Password"
            name="password"
            onChange={handleChange}
            required
            value={form.password}
          />
          <PasswordField
            autoComplete="new-password"
            disabled={loading}
            id="confirm-password"
            label="Confirm Password"
            name="confirmPassword"
            onChange={handleChange}
            required
            value={form.confirmPassword}
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
            {loading ? <CelestialInlineLoader className="justify-center" label="Creating account..." /> : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already a researcher? <Link to="/login" className="text-foreground hover:text-primary">Sign in</Link>
        </p>
      </AuthCardShell>
    </AuthScaffold>
  )
}
