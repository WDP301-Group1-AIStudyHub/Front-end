import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { CelestialInlineLoader } from '@/components/shared/CelestialLoading'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { notifyAiUsageChanged } from '@/hooks/useAiUsage'
import { ApiClientError } from '@/services/apiClient'
import {
  deleteCredential,
  getCredentialStatus,
  getDevMockScenario,
  isMockAiActive,
  saveCredential,
  setDevMockScenario,
} from '@/services/aiCredentialApi'
import type { AiCredentialStatus, AiScenario } from '@/types/ai'

export function AiCredentialSettings() {
  const [status, setStatus] = useState<AiCredentialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(
    null,
  )
  const [activeScenario, setActiveScenario] = useState<AiScenario>('default')

  // The mock is code-split, so its current scenario can only be read async.
  useEffect(() => {
    if (!isMockAiActive) return
    getDevMockScenario().then(setActiveScenario)
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCredentialStatus()
      setStatus(data)
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Failed to fetch AI key status'
      setError({ message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!apiKeyInput.trim()) {
      setError({ message: 'Please enter a valid API key.' })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await saveCredential({
        provider: 'gemini',
        apiKey: apiKeyInput.trim(),
      })
      setStatus(updated)
      setApiKeyInput('') // Key is paste-oriented and never repopulated from server
      toast.success('API Key validated and saved successfully')
      notifyAiUsageChanged()
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.code === 'CREDENTIAL_UNAVAILABLE') {
          setError({
            message:
              'Google Gemini is currently unavailable. Your key was not saved — please try again later.',
            code: 'CREDENTIAL_UNAVAILABLE',
          })
        } else {
          setError({
            message:
              err.message ||
              'The provided API key could not be validated with Google Gemini.',
            code: err.code || 'CREDENTIAL_INVALID',
          })
        }
      } else {
        setError({
          message:
            err instanceof Error ? err.message : 'An unexpected error occurred.',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteCredential()
      // Notify before refetching: awaiting the status call first serialised the
      // two requests and left the sidebar showing a stale plan for seconds
      // after this card had already updated.
      notifyAiUsageChanged()
      toast.success('API Key removed successfully')
      setApiKeyInput('')
      await fetchStatus()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to remove API key'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleScenarioChange = async (scenario: AiScenario) => {
    setActiveScenario(scenario)
    await setDevMockScenario(scenario)
    toast.info(`Mock scenario set to: ${scenario}`)
    notifyAiUsageChanged()
    await fetchStatus()
  }

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'N/A'
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(isoString))
    } catch {
      return isoString
    }
  }

  return (
    <Card className="border border-border/80 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Bring Your Own Key (BYOK)
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                Connect your Google Gemini API key for unlimited AI features across AI
                Study Hub.
              </CardDescription>
            </div>
          </div>
          {status && status.status === 'valid' && (
            <Badge className="bg-success/15 text-success border-success/30 font-medium">
              <ShieldCheck className="size-3.5 mr-1" /> Valid Key Active
            </Badge>
          )}
          {status && status.status === 'invalid' && (
            <Badge className="bg-warning/15 text-warning-foreground border-warning/30 font-medium">
              <AlertTriangle className="size-3.5 mr-1" /> Action Required
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {/* Loading state */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <CelestialInlineLoader label="Checking credential status..." />
          </div>
        ) : (
          <>
            {/* Key Status Header info when a key is present or invalid */}
            {status && status.status !== 'none' && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Provider
                    </span>
                    <span className="text-sm font-semibold capitalize">
                      Google Gemini
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Key
                    </span>
                    <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">
                      ••••••••{status.last4 || '????'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
                  <div>
                    <span className="font-medium text-foreground">Added: </span>
                    {formatDate(status.addedAt)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Last validated:{' '}
                    </span>
                    {formatDate(status.lastValidatedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Warning banner for invalid key */}
            {status && status.status === 'invalid' && (
              <div className="rounded-xl border border-warning/30 bg-warning/15 p-4 text-xs text-warning-foreground leading-relaxed flex items-start gap-3">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-warning-foreground" />
                <div className="space-y-1">
                  <p className="font-semibold">Key validation failed</p>
                  <p>
                    Your saved Google Gemini API key was rejected during validation. Free quota rules apply until a working key is provided. Please enter a valid key below to restore unlimited access.
                  </p>
                </div>
              </div>
            )}

            {/* Explanation box for NO key */}
            {(!status || status.status === 'none') && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Unlock Unlimited AI Questions
                  </p>
                  <p>
                    Without an API key, your account receives 20 free AI queries per monthly billing cycle. Providing your Google Gemini key gives you unlimited study assistance, faster response generation, and priority document chat.
                  </p>
                </div>
              </div>
            )}

            {/* Input & Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  {status && status.status !== 'none'
                    ? 'Replace API Key'
                    : 'Google Gemini API Key'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="password"
                      placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      disabled={saving || deleting}
                      className="pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
                  </div>
                  <Button
                    type="submit"
                    disabled={saving || deleting || !apiKeyInput.trim()}
                  >
                    {saving ? (
                      <CelestialInlineLoader label="Validating..." />
                    ) : (
                      'Save & Validate'
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Lock className="size-3" />
                  Your key is validated live and encrypted securely. It is never exposed back to the UI.
                </p>
              </div>

              {/* Error display */}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      {error.code === 'CREDENTIAL_UNAVAILABLE'
                        ? 'Upstream Provider Unavailable'
                        : 'Key Validation Failed'}
                    </p>
                    <p className="mt-0.5">{error.message}</p>
                  </div>
                </div>
              )}

              {/* Delete button when key exists */}
              {status && status.status !== 'none' && (
                <div className="pt-2 flex justify-between items-center border-t border-border/60">
                  <span className="text-xs text-muted-foreground">
                    Want to revert to standard quota?
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleting || saving}
                      >
                        <Trash2 className="size-3.5 mr-1.5" /> Remove Key
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove your Google Gemini API key? Your account will revert to the standard 20 free messages per period.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? (
                            <CelestialInlineLoader label="Removing..." />
                          ) : (
                            'Yes, Remove Key'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </form>

            {/* Dev Scenario Control (Mock Mode Only) */}
            {isMockAiActive && (
              <div className="mt-6 pt-4 border-t border-dashed border-border/80 bg-muted/10 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Zap className="size-3 text-warning" /> Dev Mock Scenario Switcher
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => fetchStatus()}
                  >
                    <RefreshCw className="size-3 mr-1" /> Sync
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(
                    [
                      'default',
                      'healthy_byok',
                      'degraded',
                      'quota_exhausted_no_key',
                      'quota_exhausted_broken_key',
                      'admin_exempt',
                    ] as AiScenario[]
                  ).map((scenario) => (
                    <Button
                      key={scenario}
                      type="button"
                      variant={activeScenario === scenario ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleScenarioChange(scenario)}
                    >
                      {scenario}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
