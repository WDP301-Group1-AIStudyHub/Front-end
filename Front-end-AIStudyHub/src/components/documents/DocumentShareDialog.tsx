import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Mail, RefreshCw, Trash2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  listDocumentShares,
  revokeDocumentShare,
  shareDocument,
  updateDocumentShare,
} from '../../services/documentApi'
import type {
  DocumentItem,
  DocumentShare,
  DocumentSharePermission,
} from '../../types/document'

type DocumentShareDialogProps = {
  document: DocumentItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const permissionLabel: Record<DocumentSharePermission, string> = {
  EDIT: 'Editor',
  VIEW: 'Viewer',
}

function formatExpiry(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function DocumentShareDialog({
  document,
  onOpenChange,
  open,
}: DocumentShareDialogProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [permission, setPermission] = useState<DocumentSharePermission>('VIEW')
  const [shares, setShares] = useState<DocumentShare[]>([])

  const documentId = document?.id
  const title = document?.title || document?.fileName || 'document'
  const canSubmit = useMemo(
    () => Boolean(documentId && email.trim() && !isSaving),
    [documentId, email, isSaving],
  )

  useEffect(() => {
    if (!open || !documentId) {
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    listDocumentShares(documentId)
      .then((nextShares) => {
        if (!cancelled) setShares(nextShares)
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load sharing list',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [documentId, open])

  useEffect(() => {
    if (!open) {
      setEmail('')
      setError(null)
      setPermission('VIEW')
    }
  }, [open])

  async function handleShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!documentId || !canSubmit) return

    setIsSaving(true)
    setError(null)

    try {
      const nextShare = await shareDocument(documentId, {
        email: email.trim(),
        permission,
      })
      setShares((current) => {
        const exists = current.some((item) => item.id === nextShare.id)
        return exists
          ? current.map((item) => (item.id === nextShare.id ? nextShare : item))
          : [nextShare, ...current]
      })
      setEmail('')
      setPermission('VIEW')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to share document',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePermissionChange(
    share: DocumentShare,
    nextPermission: DocumentSharePermission,
  ) {
    if (!documentId || share.permission === nextPermission) return

    setError(null)

    try {
      const updated = await updateDocumentShare(
        documentId,
        share.id,
        nextPermission,
      )
      setShares((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update permission',
      )
    }
  }

  async function handleRevoke(share: DocumentShare) {
    if (!documentId) return

    setError(null)

    try {
      await revokeDocumentShare(documentId, share.id)
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
            Share document
          </DialogTitle>
          <DialogDescription>
            Manage who can access "{title}".
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]" onSubmit={handleShare}>
          <Input
            aria-label="Recipient email"
            disabled={isSaving}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            type="email"
            value={email}
          />
          <select
            aria-label="Permission"
            className="h-9 rounded-md border-2 border-foreground bg-background px-3 text-sm font-semibold outline-none disabled:opacity-50"
            disabled={isSaving}
            onChange={(event) =>
              setPermission(event.target.value === 'EDIT' ? 'EDIT' : 'VIEW')
            }
            value={permission}
          >
            <option value="VIEW">Viewer</option>
            <option value="EDIT">Editor</option>
          </select>
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
                <TableHead>Permission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
                      Loading sharing list...
                    </span>
                  </TableCell>
                </TableRow>
              ) : shares.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    This document has not been shared yet.
                  </TableCell>
                </TableRow>
              ) : (
                shares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {share.status === 'PENDING'
                            ? 'Invitation pending'
                            : share.sharedWithUser.fullName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {share.sharedWithUser.email}
                        </div>
                        {share.status === 'PENDING' ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">Pending</Badge>
                            <span className="text-xs text-muted-foreground">
                              Expires {formatExpiry(share.expiresAt)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        aria-label={`Permission for ${share.sharedWithUser.email}`}
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold outline-none"
                        onChange={(event) =>
                          void handlePermissionChange(
                            share,
                            event.target.value === 'EDIT' ? 'EDIT' : 'VIEW',
                          )
                        }
                        value={share.permission}
                      >
                        <option value="VIEW">{permissionLabel.VIEW}</option>
                        <option value="EDIT">{permissionLabel.EDIT}</option>
                      </select>
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
