import type { FormEvent } from 'react'
import AcademicAside from '../../components/auth/AcademicAside'
import AuthCardShell from '../../components/auth/AuthCardShell'
import AuthScaffold from '../../components/auth/AuthScaffold'
import FloatingField from '../../components/auth/FloatingField'
import SocialButtons from '../../components/auth/SocialButtons'

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

export default function LoginPage() {
  return (
    <AuthScaffold action="Sign Up" mode="centered">
      <AcademicAside />
      <AuthCardShell subtitle="Authentication Required" title="Welcome Back">
        <form className="grid gap-[22px] mt-10" onSubmit={handleSubmit}>
          <FloatingField id="email" label="Email Address" type="email" />
          <FloatingField id="password" label="Password" type="password" />
          <div className="flex items-center justify-between gap-[18px] text-[rgba(196,199,200,0.62)] text-[11px] font-semibold tracking-[0.12em] uppercase">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 accent-white" />
              <span>Remember Me</span>
            </label>
            <a href="/forgot-password" className="text-white">Forgot?</a>
          </div>
          <button
            type="submit"
            className="w-full min-h-[56px] rounded-lg bg-white text-[#2f3131] text-xs font-semibold tracking-[0.15em] uppercase hover:opacity-90 hover:scale-[1.01] transition-all"
          >
            Log In To Dashboard
          </button>
        </form>
        <div className="auth-divider">
          <span className="auth-divider-label">Or continue with</span>
        </div>
        <SocialButtons />
      </AuthCardShell>
    </AuthScaffold>
  )
}
