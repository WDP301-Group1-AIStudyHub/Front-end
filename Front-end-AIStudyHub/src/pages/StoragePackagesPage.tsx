import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CurrentPlanDropZone } from '../components/storage/CurrentPlanDropZone'
import { PurchaseConfirmDialog } from '../components/storage/PurchaseConfirmDialog'
import { StoragePackageCard } from '../components/storage/StoragePackageCard'
import { useStorageStore } from '../store/useStorageStore'
import { useToast } from '../hooks/useToast'
import { useStoragePurchase } from '../hooks/useStoragePurchase'
import { fetchTransactions, reconcileStorage } from '../services/storageApi'
import { formatStorageBytes, formatVnd } from '../utils/formatStorage'
import type { StorageTransaction } from '../types/storage'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default function StoragePackagesPage() {
  const { showToast } = useToast()

  const storage = useStorageStore((state) => state.storage)
  const packages = useStorageStore((state) => state.packages)
  const currentPackageId = useStorageStore((state) => state.currentPackageId)
  const loading = useStorageStore((state) => state.loading)
  const loadStorage = useStorageStore((state) => state.loadStorage)
  const loadPackages = useStorageStore((state) => state.loadPackages)
  const setStorage = useStorageStore((state) => state.setStorage)

  const [transactions, setTransactions] = useState<StorageTransaction[]>([])
  const [isReconciling, setIsReconciling] = useState(false)

  // Track the plan count so the grid fills the row instead of leaving a gap
  // where a fourth card would be. Tailwind needs whole class names, hence the
  // lookup rather than an interpolated column count.
  const gridClass = useMemo(() => {
    const columns: Record<number, string> = {
      1: 'grid gap-4 grid-cols-1 sm:max-w-sm',
      2: 'grid gap-4 grid-cols-1 sm:grid-cols-2',
      3: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
    }

    // While loading, packages is empty and three skeletons are rendered.
    return columns[packages.length] ?? columns[3]
  }, [packages.length])

  // Native HTML5 drag is pointer-only; on touch the card button is the path.
  const supportsDrag = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
    [],
  )

  const refreshTransactions = useCallback(() => {
    fetchTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]))
  }, [])

  useEffect(() => {
    void loadStorage({ force: true })
    void loadPackages()
    refreshTransactions()
  }, [loadPackages, loadStorage, refreshTransactions])


  const { blockReason, confirmPurchase, isSubmitting, setTarget, target } =
    useStoragePurchase({ onSettled: refreshTransactions })

  const handleReconcile = async () => {
    setIsReconciling(true)
    try {
      const result = await reconcileStorage()
      setStorage(result)
      showToast({
        tone: 'success',
        message:
          result.drift === 0
            ? 'Usage already matches your actual files.'
            : `Adjusted by ${formatStorageBytes(Math.abs(result.drift))}.`,
      })
    } catch (error) {
      showToast({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Could not recalculate usage',
      })
    } finally {
      setIsReconciling(false)
    }
  }

  return (
    <main className="moonlit-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="botanical-kicker">Storage</p>
            <h1 className="moonlit-title page-title">Storage plans</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick the plan that fits how much you upload. Every plan caps
              individual files at 10 MB.
            </p>
          </div>
          <Button
            className="min-h-11!"
            disabled={isReconciling}
            onClick={handleReconcile}
            type="button"
            variant="outline"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${isReconciling ? 'animate-spin' : ''}`}
            />
            Recalculate usage
          </Button>
        </header>

        {loading && !storage ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <CurrentPlanDropZone
            canAccept={blockReason}
            onDropPackage={setTarget}
            packages={packages}
            storage={storage}
          />
        )}

        <section>
          <h2 className="sr-only">Available storage plans</h2>
          {packages.length === 0 ? (
            <div className={gridClass}>
              {[0, 1, 2].map((key) => (
                <Skeleton className="h-80 w-full" key={key} />
              ))}
            </div>
          ) : (
            <div className={gridClass}>
              {packages.map((pkg) => (
                <StoragePackageCard
                  draggable={supportsDrag}
                  hideAction={
                    pkg.priceVnd === 0 &&
                    Boolean(
                      storage?.package && storage.package.priceVnd > 0,
                    )
                  }
                  isCurrent={pkg.id === currentPackageId}
                  key={pkg.id}
                  onSelect={setTarget}
                  pkg={pkg}
                  unavailableReason={
                    pkg.id === currentPackageId ? null : blockReason(pkg)
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Payment history
          </h2>

          {transactions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No payments yet.
            </p>
          ) : (
            <>
              {/* Below md the table would overflow, so rows become cards. */}
              <ul className="flex flex-col gap-3 md:hidden">
                {transactions.map((item) => (
                  <li className="moonlit-card p-4" key={item.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{item.package.name}</span>
                      <span className="status-badge status-info">
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatVnd(item.amountVnd)} ·{' '}
                      {formatDateTime(item.createdAt)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {item.orderRef}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="moonlit-table w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="text-left">Order</th>
                      <th className="text-left">Plan</th>
                      <th className="text-right">Amount</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr key={item.id}>
                        <td className="font-mono text-xs">{item.orderRef}</td>
                        <td>{item.package.name}</td>
                        <td className="text-right">
                          {formatVnd(item.amountVnd)}
                        </td>
                        <td>
                          <span className="status-badge status-info">
                            {STATUS_LABEL[item.status] ?? item.status}
                          </span>
                        </td>
                        <td>{formatDateTime(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <PurchaseConfirmDialog
        isSubmitting={isSubmitting}
        onConfirm={confirmPurchase}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
        storage={storage}
        target={target}
      />
    </main>
  )
}
