import type { FormEvent } from 'react'
import AuthIcon from '../../components/auth/AuthIcon'
import AuthScaffold from '../../components/auth/AuthScaffold'
import SplitInfoCard from '../../components/auth/SplitInfoCard'

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

export default function ForgotPasswordPage() {
  return (
    <AuthScaffold action="Register" mode="split">
      <SplitInfoCard
        eyebrow="Navigation Lost"
        footer="Guidance System Active"
        title={<>Lost in<br />Space?</>}
        variant="lost"
      />
      <section className="relative overflow-hidden min-h-[430px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-[0_0_40px_rgba(0,0,0,0.24)] rounded-[18px] p-12">
        <h2 className="m-0 mb-9 text-white text-[32px] font-light leading-[1.2]">Recovery</h2>
        <p className="max-w-[330px] mb-9 text-[rgba(196,199,200,0.8)] text-sm leading-[1.5]">Enter your email to receive a celestial link to reset your access.</p>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2" htmlFor="recovery-email">
            <span className="text-[rgba(196,199,200,0.82)] text-xs font-semibold tracking-[0.15em] uppercase">Stellar Identifier</span>
            <input
              id="recovery-email"
              placeholder="scholar@astronomy.edu"
              type="email"
              className="w-full min-h-[54px] pl-4 pr-4 border border-white/[0.08] rounded-[6px] text-white bg-white/[0.03] outline-none focus:border-white/[0.28]"
            />
          </label>
          <button
            type="submit"
            className="w-full min-h-[56px] rounded-lg bg-white text-[#2f3131] text-xs font-semibold tracking-[0.15em] uppercase hover:opacity-90 hover:scale-[1.01] transition-all"
          >
            Send Recovery Link
          </button>
        </form>
        <a
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full mt-[26px] text-white text-xs font-semibold"
        >
          <AuthIcon name="arrow_back" className="w-[18px] h-[18px]" />
          Back to Sign In
        </a>
      </section>
    </AuthScaffold>
  )
}
