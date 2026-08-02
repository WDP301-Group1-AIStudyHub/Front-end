import { useRef, useState } from 'react'
import { StorageUsageBar } from './StorageUsageBar'
import { formatStorageBytes } from '../../utils/formatStorage'
import type { StoragePackage, UserStorage } from '../../types/storage'

/**
 * The drag-and-drop target required by the spec. It is a deliberate secondary
 * affordance: dropping only opens the confirmation dialog, never completes a
 * purchase, and it is disabled entirely on touch devices where the button on
 * each card is the only sensible path.
 */
export function CurrentPlanDropZone({
  canAccept,
  onDropPackage,
  packages,
  storage,
}: {
  /** Returns null when the package may be dropped, or the reason it may not. */
  canAccept: (pkg: StoragePackage) => string | null
  onDropPackage: (pkg: StoragePackage) => void
  packages: StoragePackage[]
  storage: UserStorage | null
}) {
  const [isOver, setIsOver] = useState(false)
  const [rejection, setRejection] = useState<string | null>(null)
  // Entering a child element fires dragleave on the parent; counting depth is
  // the standard fix for the resulting flicker.
  const depth = useRef(0)

  const resolvePackage = (event: React.DragEvent): StoragePackage | null => {
    const id = event.dataTransfer.getData('application/x-storage-package')
    return packages.find((pkg) => pkg.id === id) ?? null
  }

  return (
    <section
      aria-label="Current plan. You can drag another plan here to switch to it."
      className={`botanical-bento p-6 transition-shadow ${
        isOver && !rejection ? 'ring-2 ring-primary' : ''
      } ${rejection ? 'tone-coral ring-2 ring-destructive' : ''}`}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes('application/x-storage-package')) {
          return
        }
        depth.current += 1
        setIsOver(true)
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) {
          setIsOver(false)
          setRejection(null)
        }
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes('application/x-storage-package')) {
          return
        }
        event.preventDefault()
        event.dataTransfer.dropEffect = rejection ? 'none' : 'move'
      }}
      onDrop={(event) => {
        event.preventDefault()
        depth.current = 0
        setIsOver(false)

        const pkg = resolvePackage(event)
        if (!pkg) {
          return
        }

        const reason = canAccept(pkg)
        if (reason) {
          setRejection(reason)
          setTimeout(() => setRejection(null), 4000)
          return
        }

        setRejection(null)
        onDropPackage(pkg)
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        <div className="min-w-0 flex-1">
          <p className="botanical-kicker">Current plan</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {storage?.package?.name ?? 'Loading...'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatStorageBytes(storage?.usedBytes ?? 0)} of{' '}
            {formatStorageBytes(storage?.quotaBytes ?? 0)} used ·{' '}
            {formatStorageBytes(storage?.availableBytes ?? 0)} free
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <StorageUsageBar
            quotaBytes={storage?.quotaBytes ?? 0}
            status={storage?.status ?? 'OK'}
            usedBytes={storage?.usedBytes ?? 0}
          />
        </div>
      </div>

      {rejection ? (
        <p className="mt-4 text-sm font-medium text-destructive" role="alert">
          {rejection}
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Tip: drag a plan from below onto this card to open the confirmation
          dialog.
        </p>
      )}
    </section>
  )
}
