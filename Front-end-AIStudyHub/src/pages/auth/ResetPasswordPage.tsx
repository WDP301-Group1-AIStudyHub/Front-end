import type { FormEvent } from 'react'
import AuthScaffold from '../../components/auth/AuthScaffold'
import PasswordField from '../../components/auth/PasswordField'
import SplitInfoCard from '../../components/auth/SplitInfoCard'

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

export default function ResetPasswordPage() {
  return (
    <AuthScaffold action="Register" mode="split" showFooter>
      <SplitInfoCard
        eyebrow="Navigation Lost"
        footer="Guidance System Active"
        title={<>Found You !</>}
        variant="found"
      />
      <section className="relative overflow-hidden min-h-[430px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-[0_0_40px_rgba(0,0,0,0.24)] rounded-[18px] p-12">
        <h2 className="m-0 mb-3 text-white text-[32px] font-light leading-[1.2]">Reset My Orbit</h2>
        <p className="max-w-[330px] mb-9 text-[rgba(196,199,200,0.8)] text-sm leading-[1.5]">Realign your stellar navigation credentials.</p>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <PasswordField id="new-password" label="New Password" placeholder="MIN. 8 STARS" />
          <PasswordField id="confirm-reset-password" label="Confirm New Password" placeholder="RE-ENTER PATHWAY" />
          <button
            type="submit"
            className="w-full min-h-[56px] rounded-full bg-white text-[#2f3131] text-xs font-semibold tracking-[0.15em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:opacity-90 hover:scale-[1.01] transition-all"
          >
            Reset My Orbit
          </button>
        </form>
        <a href="/" className="inline-flex items-center justify-center w-full mt-[26px] text-white text-xs font-semibold">
          Return to Dashboard
        </a>
      </section>
    </AuthScaffold>
  )
}
