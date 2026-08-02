import { Check, HardDrive } from 'lucide-react'
import { formatStorageBytes, formatVnd } from '../../utils/formatStorage'
import type { StoragePackage } from '../../types/storage'

export function StoragePackageCard({
  draggable = false,
  hideAction = false,
  isCurrent,
  onDragEnd,
  onDragStart,
  onSelect,
  pkg,
  unavailableReason,
}: {
  draggable?: boolean
  hideAction?: boolean
  isCurrent: boolean
  onDragEnd?: () => void
  onDragStart?: (pkg: StoragePackage) => void
  onSelect: (pkg: StoragePackage) => void
  pkg: StoragePackage
  /** Set when the package cannot be bought right now. */
  unavailableReason?: string | null
}) {
  const disabled = isCurrent || Boolean(unavailableReason)

  // redesign.css pins hover border/shadow/transform on .botanical-bento with
  // !important, so the hover state needs the important modifier to land, and a
  // background tint rather than a shadow or lift.
  const interactiveClasses = disabled
    ? ''
    : 'cursor-pointer transition-colors duration-150 hover:border-primary! hover:bg-primary/5 focus-within:border-primary!'

  return (
    <article
      className={`botanical-bento flex h-full flex-col p-6 ${
        pkg.highlight ? 'border-primary!' : ''
      } ${interactiveClasses}`}
      draggable={draggable && !disabled}
      onClick={() => {
        // Mouse-only convenience: the whole card selects the plan. The button
        // below stays the keyboard- and screen-reader-accessible control.
        if (!disabled) onSelect(pkg)
      }}
      onDragEnd={onDragEnd}
      onDragStart={(event) => {
        // A custom MIME type keeps unrelated drags (files, text) out of the drop
        // zone, which is what lets the zone reject them cleanly.
        event.dataTransfer.setData('application/x-storage-package', pkg.id)
        event.dataTransfer.effectAllowed = 'move'
        onDragStart?.(pkg)
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="admin-icon-badge">
          <HardDrive className="size-4" aria-hidden="true" />
        </span>
        {isCurrent ? (
          <span className="status-badge status-active">Current plan</span>
        ) : pkg.highlight ? (
          <span className="status-badge status-info">Most popular</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight">{pkg.name}</h3>
      <p className="mt-1 text-3xl font-bold tracking-tight">
        {formatStorageBytes(pkg.capacityBytes)}
      </p>
      <p className="mt-1 text-sm font-semibold text-primary">
        {formatVnd(pkg.priceVnd)}
      </p>

      {pkg.description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {pkg.description}
        </p>
      ) : null}

      {pkg.features.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {pkg.features.map((feature) => (
            <li className="flex items-start gap-2" key={feature}>
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!hideAction ? (
        <button
          className={`storage-plan-action mt-auto min-h-11 w-full ${
            isCurrent
              ? 'storage-plan-button-current cursor-default!'
              : 'storage-plan-button-selectable'
          }`}
          disabled={disabled}
          onClick={(event) => {
            // The article already handles the click; stop it bubbling so the
            // dialog is not opened twice.
            event.stopPropagation()
            onSelect(pkg)
          }}
          type="button"
        >
          {isCurrent ? 'Your current plan' : 'Choose this plan'}
        </button>
      ) : null}
    </article>
  )
}
