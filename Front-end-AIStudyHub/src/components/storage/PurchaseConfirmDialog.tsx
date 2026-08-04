import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatStorageBytes, formatVnd } from '../../utils/formatStorage'
import type { StoragePackage, UserStorage } from '../../types/storage'

export function PurchaseConfirmDialog({
  isSubmitting,
  onConfirm,
  onOpenChange,
  storage,
  target,
}: {
  isSubmitting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  storage: UserStorage | null
  target: StoragePackage | null
}) {
  if (!target) {
    return null
  }

  const isFree = target.priceVnd <= 0

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(target)}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm plan change</DialogTitle>
          <DialogDescription>
            Review the details before continuing to payment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="truncate font-semibold">
              {storage?.package?.name ?? '—'}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatStorageBytes(storage?.quotaBytes ?? 0)}
            </p>
          </div>
          <ArrowRight
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 text-right">
            <p className="text-xs text-muted-foreground">New plan</p>
            <p className="truncate font-semibold">{target.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatStorageBytes(target.capacityBytes)}
            </p>
          </div>
        </div>

        <dl className="flex items-center justify-between text-sm">
          <dt className="text-muted-foreground">Amount due</dt>
          <dd className="text-lg font-bold">{formatVnd(target.priceVnd)}</dd>
        </dl>

        {/* The replace-not-add rule surprises people who expect capacity to
            stack, so it is stated on the confirmation itself. */}
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
          The new plan <strong>replaces</strong> your current one — capacity does
          not stack. Your quota becomes{' '}
          {formatStorageBytes(target.capacityBytes)}. Documents you already
          uploaded are unaffected.
        </p>

        <DialogFooter>
          <Button
            className="min-h-11!"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="min-h-11!"
            disabled={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            {isSubmitting
              ? 'Processing...'
              : isFree
                ? 'Switch to this plan'
                : 'Continue to payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
