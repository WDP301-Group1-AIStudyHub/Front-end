import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import AcademicAside from '@/components/auth/AcademicAside'
import AuthCardShell from '@/components/auth/AuthCardShell'
import AuthScaffold from '@/components/auth/AuthScaffold'
import FloatingField from '@/components/auth/FloatingField'
import { CelestialInlineLoader } from '@/components/shared/CelestialLoading'
import { login } from '@/services/authApi'

const initialForm = {
  email: '',
  password: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
      const returnTo = searchParams.get('returnTo')
      navigate(returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard', {
        replace: true,
      })
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
            <div className="flex items-center gap-2">
              <Checkbox checked id="remember" />
              <Label htmlFor="remember">Remember me</Label>
            </div>
            <Link to="/forgot-password" className="text-foreground hover:text-primary">Forgot?</Link>
          </div>
          {error ? (
            <p className="m-0 text-xs leading-relaxed text-destructive">{error}</p>
          ) : null}
          <Button
            className="min-h-[52px] w-full"
            disabled={loading}
            size="lg"
            type="submit"
          >
            {loading ? <CelestialInlineLoader className="justify-center" label="Authenticating..." /> : 'Log in to dashboard'}
          </Button>
        </form>
      </AuthCardShell>
    </AuthScaffold>
  )
}
