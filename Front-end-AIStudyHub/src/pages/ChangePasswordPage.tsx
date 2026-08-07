import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { CelestialInlineLoader } from '@/components/shared/CelestialLoading'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/layout/PageShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { changePassword } from '@/services/authApi'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must differ from your current password.')
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => navigate('/profile'), 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Account settings"
        title="Change Password"
        description="Choose a strong password with at least 8 characters."
      />

      <div className="max-w-md">
        <form className="flex flex-col gap-5 p-6" onSubmit={handleSubmit}>
          <label className="space-y-1.5 text-sm font-medium">
            <span className="block text-muted-foreground">Current password</span>
            <div className="relative flex items-center">
              <KeyRound className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-input bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                type="password"
                value={currentPassword}
              />
            </div>
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            <span className="block text-muted-foreground">New password</span>
            <div className="relative flex items-center">
              <KeyRound className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-input bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Min. 8 characters"
                type="password"
                value={newPassword}
              />
            </div>
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            <span className="block text-muted-foreground">Confirm new password</span>
            <div className="relative flex items-center">
              <KeyRound className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground/70" />
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-input bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat new password"
                type="password"
                value={confirmPassword}
              />
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              Your password has been updated successfully.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              disabled={saving}
              onClick={() => navigate('/profile')}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? <CelestialInlineLoader label="Saving..." /> : 'Change password'}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
