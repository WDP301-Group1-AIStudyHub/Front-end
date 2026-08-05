import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Mail, RefreshCw, Trash2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiClientError } from '@/services/apiClient'
import {
  listArtifactShares,
  revokeArtifactShare,
  shareArtifact,
  type ArtifactShare,
} from '@/services/artifactApi'

type SummaryShareDialogProps = {
  artifactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

/**
 * Share modal for an AI summary artifact. Structurally a copy of
 * DocumentShareDialog, but simpler: summary shares are account-only (no
 * email-a-stranger invite flow), always VIEW (no permission picker), and
 * always active immediately (no PENDING/notificationStatus state to show).
 */
export default function SummaryShareDialog({
  artifactId,
  onOpenChange,
  open,
  title,
}: SummaryShareDialogProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shares, setShares] = useState<ArtifactShare[]>([])

  const canSubmit = useMemo(
    () => Boolean(artifactId && email.trim() && !isSaving),
    [artifactId, email, isSaving],
  )

  useEffect(() => {
    if (!open || !artifactId) {
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    listArtifactShares(artifactId)
      .then((nextShares) => {
        if (!cancelled) setShares(nextShares)
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load the sharing list',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [artifactId, open])

  useEffect(() => {
    if (!open) {
      setEmail('')
      setError(null)
    }
  }, [open])

  async function handleShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!artifactId || !canSubmit) return

    setIsSaving(true)
    setError(null)

    try {
      const nextShare = await shareArtifact(artifactId, email.trim())
      setShares((current) => {
        const exists = current.some((item) => item.id === nextShare.id)
        return exists
          ? current.map((item) => (item.id === nextShare.id ? nextShare : item))
          : [nextShare, ...current]
      })
      setEmail('')
    } catch (caughtError) {
      if (
        caughtError instanceof ApiClientError &&
        caughtError.code === 'RECIPIENT_NOT_FOUND'
      ) {
        setError('No AI Study Hub account found for that email.')
      } else if (caughtError instanceof ApiClientError && caughtError.status === 400) {
        setError("You can't share a summary with yourself.")
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to share this summary',
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRevoke(share: ArtifactShare) {
    if (!artifactId) return

    setError(null)

    try {
      await revokeArtifactShare(artifactId, share.id)
      setShares((current) => current.filter((item) => item.id !== share.id))
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to revoke access',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" aria-hidden="true" />
            Share summary
          </DialogTitle>
          <DialogDescription>
            Give someone view access to the AI summary of "{title || 'this document'}
            " — without sharing the document itself.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleShare}>
          <Input
            aria-label="Recipient email"
            disabled={isSaving}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            type="email"
            value={email}
          />
          <Button disabled={!canSubmit} type="submit">
            <Mail data-icon="inline-start" aria-hidden="true" />
            {isSaving ? 'Sharing...' : 'Share'}
          </Button>
        </form>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : null}

        <div className="max-h-80 overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
                      Loading sharing list...
                    </span>
                  </TableCell>
                </TableRow>
              ) : shares.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    This summary has not been shared yet.
                  </TableCell>
                </TableRow>
              ) : (
                shares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {share.sharedWithUser.fullName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {share.sharedWithUser.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Revoke access for ${share.sharedWithUser.email}`}
                        onClick={() => void handleRevoke(share)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="secondary">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
