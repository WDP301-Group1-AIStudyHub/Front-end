import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import AcademicAside from '../../components/auth/AcademicAside'
import AuthCardShell from '../../components/auth/AuthCardShell'
import AuthScaffold from '../../components/auth/AuthScaffold'
import FloatingField from '../../components/auth/FloatingField'
import { login } from '../../services/authApi'

const initialForm = {
  email: '',
  password: '',
}

export default function LoginPage() {
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
      window.location.href = '/dashboard'
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScaffold action="Sign Up" mode="centered">
      <AcademicAside />
      <AuthCardShell subtitle="Authentication Required" title="Welcome Back">
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
            {loading ? 'Authenticating...' : 'Log In To Dashboard'}
          </button>
        </form>
      </AuthCardShell>
    </AuthScaffold>
  )
}
