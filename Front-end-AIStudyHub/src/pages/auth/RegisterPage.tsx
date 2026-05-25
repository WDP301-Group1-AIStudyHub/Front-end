import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import AcademicAside from '../../components/auth/AcademicAside'
import AuthCardShell from '../../components/auth/AuthCardShell'
import AuthScaffold from '../../components/auth/AuthScaffold'
import FloatingField from '../../components/auth/FloatingField'
import PasswordField from '../../components/auth/PasswordField'
import { register } from '../../services/authApi'

const initialForm = {
  confirmPassword: '',
  email: '',
  fullName: '',
  password: '',
}

export default function RegisterPage() {
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
      window.location.href = '/dashboard'
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScaffold action="Sign In" mode="centered" showFooter>
      <AcademicAside />
      <AuthCardShell subtitle="Join the Academic Constellation" title="Create Account">
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
          <div className="flex items-center justify-between gap-[18px] text-[rgba(196,199,200,0.62)] text-[11px] font-semibold tracking-[0.12em] uppercase">
            <label className="inline-flex items-center gap-2">
              <input checked readOnly type="checkbox" className="w-4 h-4 accent-white" />
              <span>Remember Me</span>
            </label>
            <a href="/forgot-password" className="text-white">Forgot?</a>
          </div>
          {error ? (
            <p className="m-0 text-xs leading-relaxed text-red-300">{error}</p>
          ) : null}
          <button
            disabled={loading}
            type="submit"
            className="w-full min-h-[56px] rounded-lg bg-white text-[#2f3131] text-xs font-semibold tracking-[0.15em] uppercase hover:opacity-90 hover:scale-[1.01] transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-[rgba(196,199,200,0.56)] text-xs text-center">
          Already a researcher? <a href="/login" className="text-white">Sign In</a>
        </p>
      </AuthCardShell>
    </AuthScaffold>
  )
}
