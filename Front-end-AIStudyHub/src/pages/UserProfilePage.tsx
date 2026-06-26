import { useEffect, useRef, useState } from 'react'
import {
  AtSign,
  CalendarDays,
  CheckCircle2,
  Pencil,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { CelestialInlineLoader } from '../components/shared/CelestialLoading'
import { updateProfile } from '../services/authApi'
import { getStoredToken, getStoredUser, storeAuthSession } from '../services/authStorage'

function Field({
  disabled,
  icon,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  disabled?: boolean
  icon: React.ReactNode
  label: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  value: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-muted-foreground/70 [&>svg]:size-4">
          {icon}
        </span>
        <input
          className="w-full rounded-xl border border-input bg-muted/30 py-2.5 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </div>
    </div>
  )
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="botanical-card flex items-center gap-3 px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary [&>svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const storedUser = getStoredUser()

  const [fullName, setFullName] = useState(storedUser?.fullName ?? '')
  const [avatar, setAvatar] = useState(storedUser?.avatar ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updateProfile({ fullName, avatar })
      const token = getStoredToken()
      if (token) storeAuthSession(token, updated)
      setSaved(true)
      savedTimerRef.current = setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const joinedDate = storedUser?.createdAt
    ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(storedUser.createdAt),
      )
    : 'Not available'

  return (
    <main className="botanical-page min-h-svh overflow-y-auto p-5 md:p-8">
      <header className="flex flex-col gap-2">
        <p className="botanical-kicker">
          Account settings
        </p>
        <h1 className="moonlit-title text-3xl font-semibold tracking-tight md:text-4xl">
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your display name and avatar across AI Study Hub.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="botanical-bento flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                {avatar ? (
                  <img
                    alt={fullName}
                    className="size-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    src={avatar}
                  />
                ) : null}
                <span
                  className={`absolute inset-0 flex items-center justify-center text-2xl font-semibold text-primary ${avatar ? 'opacity-0' : 'opacity-100'}`}
                >
                  {initials || <UserRound className="size-8" />}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-background shadow">
                <Pencil className="size-3 text-muted-foreground" />
              </div>
            </div>

            <div>
              <p className="text-base font-semibold leading-tight">{fullName || 'Your Name'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{storedUser?.email}</p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                storedUser?.role === 'admin'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <ShieldCheck className="size-3" />
              {storedUser?.role === 'admin' ? 'Administrator' : 'Student'}
            </span>
          </div>

          {/* Info chips */}
          <div className="flex flex-col gap-2">
            <InfoChip
              icon={<AtSign />}
              label="Email"
              value={storedUser?.email ?? 'N/A'}
            />
            <InfoChip
              icon={<CalendarDays />}
              label="Member since"
              value={joinedDate}
            />
            <InfoChip
              icon={<CheckCircle2 />}
              label="Status"
              value={storedUser?.status === 'active' ? 'Active' : storedUser?.isActive ? 'Active' : 'Inactive'}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="botanical-bento p-6">
            <div className="mb-5 border-b border-border/60 pb-4">
              <h2 className="text-base font-semibold">Personal information</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Update your display name and profile picture.
              </p>
            </div>

            <div className="space-y-5">
              <Field
                icon={<UserRound />}
                label="Full name"
                onChange={setFullName}
                placeholder="Enter your full name"
                value={fullName}
              />
              <Field
                icon={<Pencil />}
                label="Avatar URL"
                onChange={setAvatar}
                placeholder="https://example.com/your-photo.jpg"
                value={avatar}
              />

              {avatar && (
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <img
                    alt="Preview"
                    className="size-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ''
                    }}
                    src={avatar}
                  />
                  <p className="text-xs text-muted-foreground">Avatar preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Read-only account info */}
          <div className="botanical-bento p-6">
            <div className="mb-5 border-b border-border/60 pb-4">
              <h2 className="text-base font-semibold">Account details</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                These fields are managed by the system and cannot be changed here.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                disabled
                icon={<AtSign />}
                label="Email address"
                onChange={() => {}}
                value={storedUser?.email ?? ''}
              />
              <Field
                disabled
                icon={<ShieldCheck />}
                label="Role"
                onChange={() => {}}
                value={storedUser?.role === 'admin' ? 'Administrator' : 'Student'}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success */}
          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              Profile updated successfully.
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? (
                <CelestialInlineLoader label="Saving..." />
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
