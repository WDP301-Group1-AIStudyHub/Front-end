import { useCallback, useEffect, useMemo, useState } from 'react'
import { HardDrive, RefreshCw, Search, Settings2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingState } from '@/components/shared/CelestialLoading'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'
import { AdminStatCard, StatusBadge, formatDateTime } from './adminPageUtils'
import { useToast } from '@/hooks/useToast'
import {
  assignAdminStoragePackage,
  createAdminStoragePackage,
  getAdminStorageOverview,
  getAdminStorageUser,
  listAdminStoragePackages,
  listAdminStorageUsers,
  reconcileAdminStorageUser,
  reconcileAllAdminStorage,
  updateAdminStoragePackage,
} from '@/services/adminStorageApi'
import type { AdminStorageOverview, AdminStoragePackage, AdminStorageUserDetail, AdminStorageUserRow, StorageAdminStatus } from '@/types/adminStorage'

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`

type PackageFormState = {
  name: string
  capacityMb: string
  priceVnd: string
  description: string
  features: string
  sortOrder: string
  highlight: boolean
  isActive: boolean
  isDefault: boolean
}

const packageToForm = (pkg: AdminStoragePackage): PackageFormState => ({
  name: pkg.name,
  capacityMb: String(Math.round(pkg.capacityBytes / 1024 / 1024)),
  priceVnd: String(pkg.priceVnd),
  description: pkg.description || '',
  features: pkg.features.join('\n'),
  sortOrder: String(pkg.sortOrder),
  highlight: pkg.highlight,
  isActive: pkg.isActive,
  isDefault: pkg.isDefault,
})

export default function AdminStoragePage() {
  const { showToast } = useToast()
  const [overview, setOverview] = useState<AdminStorageOverview | null>(null)
  const [users, setUsers] = useState<AdminStorageUserRow[]>([])
  const [packages, setPackages] = useState<AdminStoragePackage[]>([])
  const [detail, setDetail] = useState<AdminStorageUserDetail | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StorageAdminStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [packageDraft, setPackageDraft] = useState({ code: '', name: '', capacityMb: '100', priceVnd: '0' })
  const [editingPackage, setEditingPackage] = useState<AdminStoragePackage | null>(null)
  const [packageForm, setPackageForm] = useState<PackageFormState | null>(null)
  const [pendingPackageChange, setPendingPackageChange] = useState<{ userId: string; packageId: string; packageName: string } | null>(null)
  const [packageChangeReason, setPackageChangeReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextOverview, nextUsers, nextPackages] = await Promise.all([
        getAdminStorageOverview(),
        listAdminStorageUsers({ search: search || undefined, status: status || undefined, limit: 50 }),
        listAdminStoragePackages(),
      ])
      setOverview(nextOverview)
      setUsers(nextUsers.items)
      setPackages(nextPackages)
    } catch (error) {
      showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Unable to load storage management' })
    } finally {
      setLoading(false)
    }
  }, [search, showToast, status])

  useEffect(() => { void load() }, [load])

  const packageOptions = useMemo(() => packages.filter((pkg) => pkg.isActive), [packages])

  const openDetail = async (userId: string) => {
    setDetailLoading(true)
    try { setDetail(await getAdminStorageUser(userId)) } catch (error) {
      showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Unable to load user detail' })
    } finally { setDetailLoading(false) }
  }

  const reconcileUser = async (userId: string) => {
    setBusy(true)
    try {
      const result = await reconcileAdminStorageUser(userId)
      showToast({ tone: 'success', message: `Reconciled. Drift: ${formatBytes(Math.abs(result.reconciliation.drift || 0))}` })
      await load()
      if (detail?.user.id === userId) setDetail(result)
    } catch (error) { showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Reconcile failed' }) } finally { setBusy(false) }
  }

  const reconcileAll = async () => {
    setBusy(true)
    try {
      const result = await reconcileAllAdminStorage()
      showToast({ tone: 'success', message: `Scanned ${result.scanned || 0} users; corrected ${result.corrected || 0}.` })
      await load()
    } catch (error) { showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Reconcile failed' }) } finally { setBusy(false) }
  }

  const requestPackageChange = (userId: string, packageId: string) => {
    const target = packages.find((pkg) => pkg.id === packageId)
    if (!target) return
    setPendingPackageChange({ userId, packageId, packageName: target.name })
    setPackageChangeReason('')
  }

  const changePackage = async (userId?: string, packageId?: string) => {
    if (userId && packageId) {
      requestPackageChange(userId, packageId)
      return
    }
    if (!pendingPackageChange || !packageChangeReason.trim()) {
      showToast({ tone: 'error', message: 'A reason is required for package changes.' })
      return
    }
    setBusy(true)
    try {
      const result = await assignAdminStoragePackage(pendingPackageChange.userId, pendingPackageChange.packageId, packageChangeReason.trim())
      showToast({ tone: 'success', message: `Package changed to ${result.package?.name || 'selected package'}.` })
      setPendingPackageChange(null)
      setPackageChangeReason('')
      await load()
      await openDetail(pendingPackageChange.userId)
    } catch (error) { showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Package change failed' }) } finally { setBusy(false) }
  }

  const createPackage = async () => {
    if (!packageDraft.code || !packageDraft.name) return
    setBusy(true)
    try {
      await createAdminStoragePackage({
        code: packageDraft.code,
        name: packageDraft.name,
        capacityBytes: Number(packageDraft.capacityMb) * 1024 * 1024,
        priceVnd: Number(packageDraft.priceVnd),
        description: '', features: [], sortOrder: packages.length, highlight: false, isDefault: false, isActive: true,
      })
      setPackageDraft({ code: '', name: '', capacityMb: '100', priceVnd: '0' })
      showToast({ tone: 'success', message: 'Storage package created.' })
      await load()
    } catch (error) { showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Package creation failed' }) } finally { setBusy(false) }
  }

  const togglePackage = async (pkg: AdminStoragePackage) => {
    setBusy(true)
    try {
      await updateAdminStoragePackage(pkg.id, { isActive: !pkg.isActive })
      showToast({ tone: 'success', message: `${pkg.name} is now ${pkg.isActive ? 'inactive' : 'active'}.` })
      await load()
    } catch (error) { showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Package update failed' }) } finally { setBusy(false) }
  }

  const openEditPackage = (pkg: AdminStoragePackage) => {
    setEditingPackage(pkg)
    setPackageForm(packageToForm(pkg))
  }

  // Kept as a small event-handler alias for the package list action.
  const editPackage = (pkg: AdminStoragePackage) => openEditPackage(pkg)

  const savePackage = async () => {
    if (!editingPackage || !packageForm) return
    const name = packageForm.name.trim()
    const capacityMb = Number(packageForm.capacityMb)
    const priceVnd = Number(packageForm.priceVnd)
    const sortOrder = Number(packageForm.sortOrder)
    const features = packageForm.features.split('\n').map((feature) => feature.trim()).filter(Boolean)

    if (!name) {
      showToast({ tone: 'error', message: 'Package name is required.' })
      return
    }
    if (!Number.isFinite(capacityMb) || capacityMb < 0) {
      showToast({ tone: 'error', message: 'Capacity must be a valid non-negative number.' })
      return
    }
    if (!Number.isFinite(priceVnd) || priceVnd < 0) {
      showToast({ tone: 'error', message: 'Price must be a valid non-negative number.' })
      return
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      showToast({ tone: 'error', message: 'Sort order must be a non-negative integer.' })
      return
    }
    if (features.some((feature) => feature.length > 200)) {
      showToast({ tone: 'error', message: 'Each feature must be 200 characters or fewer.' })
      return
    }

    setBusy(true)
    try {
      await updateAdminStoragePackage(editingPackage.id, {
        name,
        capacityBytes: capacityMb * 1024 * 1024,
        priceVnd,
        description: packageForm.description.trim(),
        features,
        sortOrder,
        highlight: packageForm.highlight,
        isActive: packageForm.isDefault ? true : packageForm.isActive,
        isDefault: packageForm.isDefault,
      })
      showToast({ tone: 'success', message: `${editingPackage.name} updated.` })
      setEditingPackage(null)
      setPackageForm(null)
      await load()
    } catch (error) {
      showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Package update failed' })
    } finally {
      setBusy(false)
    }
  }

  const makeDefault = async (pkg: AdminStoragePackage) => {
    setBusy(true)
    try {
      await updateAdminStoragePackage(pkg.id, { isDefault: true, isActive: true })
      showToast({ tone: 'success', message: `${pkg.name} is now the default package.` })
      await load()
    } catch (error) { showToast({ tone: 'error', message: error instanceof Error ? error.message : 'Default package update failed' }) } finally { setBusy(false) }
  }

  return <PageShell>
    <PageHeader eyebrow="Admin workspace" title="Storage management" description="Monitor quota, change valid packages and reconcile actual document usage." actions={<Button disabled={busy} onClick={() => void reconcileAll()}><RefreshCw /> Reconcile all</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard icon={<Users />} label="Users" value={loading ? '...' : String(overview?.totalUsers ?? 0)} tone="blue" />
      <AdminStatCard icon={<HardDrive />} label="Quota allocated" value={loading ? '...' : formatBytes(overview?.totalQuotaBytes ?? 0)} tone="teal" />
      <AdminStatCard icon={<HardDrive />} label="Used + reserved" value={loading ? '...' : formatBytes((overview?.totalUsedBytes ?? 0) + (overview?.totalReservedBytes ?? 0))} tone="gold" />
      <AdminStatCard icon={<Settings2 />} label="Users at risk" value={loading ? '...' : String(overview?.usersAtRisk ?? 0)} tone="coral" />
    </section>
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <Card>
        <CardHeader><CardTitle>Users and quota</CardTitle><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as StorageAdminStatus | '')}><option value="">All status</option><option value="OK">OK</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option><option value="FULL">Full</option></select></div></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y text-left"><tr><th className="p-3">User</th><th className="p-3">Package</th><th className="p-3">Usage</th><th className="p-3">Actions</th></tr></thead><tbody>{loading ? <tr><td className="p-5" colSpan={4}><LoadingState label="Loading storage users..." tone="sapphire" /></td></tr> : users.length === 0 ? <tr><td className="p-8 text-center text-muted-foreground" colSpan={4}>No storage users found.</td></tr> : users.map((row) => <tr className="border-b" key={row.user?.id}><td className="p-3"><button className="text-left font-medium hover:underline" onClick={() => row.user && void openDetail(row.user.id)}>{row.user?.fullName || 'Unknown'}<span className="block text-xs text-muted-foreground">{row.user?.email}</span></button></td><td className="p-3">{row.storage.package?.name || 'Unknown'}<span className="block text-xs text-muted-foreground">{formatBytes(row.storage.quotaBytes)}</span></td><td className="p-3"><StatusBadge severity={row.storage.status.toLowerCase()}>{row.storage.usagePercent}% · {formatBytes(row.storage.usedBytes + row.storage.reservedBytes)}</StatusBadge></td><td className="p-3"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => row.user && void openDetail(row.user.id)}>Details</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => row.user && void reconcileUser(row.user.id)}>Reconcile</Button></div></td></tr>)}</tbody></table></div></CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Packages</CardTitle></CardHeader><CardContent className="space-y-3">{packages.map((pkg) => <div className="flex items-center justify-between gap-3 rounded-lg border p-3" key={pkg.id}><div><p className="font-medium">{pkg.name} <span className="text-xs text-muted-foreground">({formatBytes(pkg.capacityBytes)})</span></p><p className="text-xs text-muted-foreground">{pkg.isDefault ? 'Default · ' : ''}{pkg.isActive ? formatVnd(pkg.priceVnd) : 'Inactive'}</p></div><div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="ghost" disabled={busy} onClick={() => void editPackage(pkg)}>Edit</Button>{!pkg.isDefault ? <Button size="sm" variant="ghost" disabled={busy || !pkg.isActive} onClick={() => void makeDefault(pkg)}>Default</Button> : null}<Button size="sm" variant="outline" disabled={busy || pkg.isDefault} onClick={() => void togglePackage(pkg)}>{pkg.isActive ? 'Disable' : 'Enable'}</Button></div></div>)}<div className="border-t pt-4"><p className="mb-2 text-sm font-medium">Create package</p><div className="grid gap-2 sm:grid-cols-2"><Input placeholder="Code" value={packageDraft.code} onChange={(event) => setPackageDraft((draft) => ({ ...draft, code: event.target.value }))} /><Input placeholder="Name" value={packageDraft.name} onChange={(event) => setPackageDraft((draft) => ({ ...draft, name: event.target.value }))} /><Input type="number" placeholder="Capacity MB" value={packageDraft.capacityMb} onChange={(event) => setPackageDraft((draft) => ({ ...draft, capacityMb: event.target.value }))} /><Input type="number" placeholder="Price VND" value={packageDraft.priceVnd} onChange={(event) => setPackageDraft((draft) => ({ ...draft, priceVnd: event.target.value }))} /></div><Button className="mt-3 w-full" disabled={busy || !packageDraft.code || !packageDraft.name} onClick={() => void createPackage()}>Create package</Button></div></CardContent></Card>
    </section>
    {detail ? <Card><CardHeader><CardTitle className="flex items-center justify-between"><span>{detail.user.fullName} · storage detail</span><Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Close</Button></CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Email</p><p>{detail.user.email}</p></div><div><p className="text-xs text-muted-foreground">Used</p><p>{formatBytes(detail.storage.usedBytes)}</p></div><div><p className="text-xs text-muted-foreground">Reserved</p><p>{formatBytes(detail.storage.reservedBytes)}</p></div><div><p className="text-xs text-muted-foreground">Package</p><p>{detail.package?.name || 'Unknown'}</p></div></div><div className="flex flex-wrap items-center gap-2"><select className="h-9 rounded-md border bg-background px-2 text-sm" value={detail.package?.id || ''} onChange={(event) => void changePackage(detail.user.id, event.target.value)}><option value="" disabled>Change package</option>{packageOptions.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · {formatBytes(pkg.capacityBytes)}</option>)}</select><Button variant="outline" disabled={busy} onClick={() => void reconcileUser(detail.user.id)}>Reconcile this user</Button></div><div><p className="mb-2 text-sm font-medium">Recent transactions</p><div className="space-y-1 text-sm">{detail.recentTransactions.length ? detail.recentTransactions.map((transaction) => <div className="flex flex-wrap justify-between gap-2 border-b py-2" key={transaction.orderRef}><span>{transaction.orderRef} · {transaction.package.name}</span><StatusBadge severity={transaction.status.toLowerCase()}>{transaction.status}</StatusBadge></div>) : <span className="text-muted-foreground">No transactions.</span>}</div></div><p className="text-xs text-muted-foreground">Last reconciled: {formatDateTime(detail.storage.lastReconciledAt || undefined)}</p></CardContent></Card> : null}
    <Dialog
      open={Boolean(detail)}
      onOpenChange={(open) => {
        if (!open) setDetail(null)
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detailLoading ? 'Loading user detail…' : detail ? `${detail.user.fullName} · storage detail` : 'Storage detail'}</DialogTitle>
          <DialogDescription>Quota, usage, assigned package and recent payment transactions.</DialogDescription>
        </DialogHeader>
        {detail ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Email</p><p className="break-words">{detail.user.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Used</p><p>{formatBytes(detail.storage.usedBytes)}</p></div>
              <div><p className="text-xs text-muted-foreground">Reserved</p><p>{formatBytes(detail.storage.reservedBytes)}</p></div>
              <div><p className="text-xs text-muted-foreground">Package</p><p>{detail.package?.name || 'Unknown'}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <Label htmlFor="admin-detail-package">Change package</Label>
              <select id="admin-detail-package" className="h-9 min-w-48 rounded-md border bg-background px-2 text-sm" value={detail.package?.id || ''} onChange={(event) => void changePackage(detail.user.id, event.target.value)}>
                <option value="" disabled>Select package</option>
                {packageOptions.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · {formatBytes(pkg.capacityBytes)}</option>)}
              </select>
              <Button variant="outline" disabled={busy} onClick={() => void reconcileUser(detail.user.id)}>Reconcile</Button>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Recent transactions</p>
              <div className="space-y-1 text-sm">{detail.recentTransactions.length ? detail.recentTransactions.map((transaction) => <div className="flex flex-wrap justify-between gap-2 border-b py-2" key={transaction.orderRef}><span className="break-all">{transaction.orderRef} · {transaction.package.name}</span><StatusBadge severity={transaction.status.toLowerCase()}>{transaction.status}</StatusBadge></div>) : <span className="text-muted-foreground">No transactions.</span>}</div>
            </div>
            <p className="text-xs text-muted-foreground">Last reconciled: {formatDateTime(detail.storage.lastReconciledAt || undefined)}</p>
          </div>
        ) : <LoadingState label="Loading user detail..." tone="sapphire" />}
      </DialogContent>
    </Dialog>
    <Dialog
      open={Boolean(editingPackage)}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setEditingPackage(null)
          setPackageForm(null)
        }
      }}
    >
      {editingPackage && packageForm ? (
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit storage package</DialogTitle>
            <DialogDescription>
              Update the package settings used for new purchases. Existing subscribers keep their current quota.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              void savePackage()
            }}
          >
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Package code: </span>
              <span className="font-mono font-medium">{editingPackage.code}</span>
              <span className="ml-2 text-xs text-muted-foreground">Code cannot be changed after creation.</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-package-name">Name</Label>
                <Input
                  id="admin-package-name"
                  value={packageForm.name}
                  onChange={(event) => setPackageForm((draft) => draft && ({ ...draft, name: event.target.value }))}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-package-capacity">Capacity (MB)</Label>
                <Input
                  id="admin-package-capacity"
                  type="number"
                  min="0"
                  step="1"
                  value={packageForm.capacityMb}
                  onChange={(event) => setPackageForm((draft) => draft && ({ ...draft, capacityMb: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-package-price">Price (VND)</Label>
                <Input
                  id="admin-package-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={packageForm.priceVnd}
                  onChange={(event) => setPackageForm((draft) => draft && ({ ...draft, priceVnd: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-package-sort">Sort order</Label>
                <Input
                  id="admin-package-sort"
                  type="number"
                  min="0"
                  step="1"
                  value={packageForm.sortOrder}
                  onChange={(event) => setPackageForm((draft) => draft && ({ ...draft, sortOrder: event.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-package-description">Description</Label>
              <Textarea
                id="admin-package-description"
                value={packageForm.description}
                onChange={(event) => setPackageForm((draft) => draft && ({ ...draft, description: event.target.value }))}
                maxLength={500}
                rows={3}
                placeholder="Explain who this package is for"
              />
              <p className="text-xs text-muted-foreground">{packageForm.description.length}/500 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-package-features">Features</Label>
              <Textarea
                id="admin-package-features"
                value={packageForm.features}
                onChange={(event) => setPackageForm((draft) => draft && ({ ...draft, features: event.target.value }))}
                rows={5}
                placeholder={'One feature per line\nAI chat over uploaded documents\nDocument sharing'}
              />
              <p className="text-xs text-muted-foreground">Enter one feature per line. Empty lines are removed when saved.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={packageForm.highlight}
                  onCheckedChange={(checked) => setPackageForm((draft) => draft && ({ ...draft, highlight: checked === true }))}
                />
                <span><span className="block font-medium">Highlight</span><span className="text-xs text-muted-foreground">Show as a featured plan.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={packageForm.isActive}
                  disabled={packageForm.isDefault}
                  onCheckedChange={(checked) => setPackageForm((draft) => draft && ({ ...draft, isActive: checked === true }))}
                />
                <span><span className="block font-medium">Active</span><span className="text-xs text-muted-foreground">Available for new purchases.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={packageForm.isDefault}
                  onCheckedChange={(checked) => setPackageForm((draft) => draft && ({ ...draft, isDefault: checked === true, isActive: checked === true ? true : draft.isActive }))}
                />
                <span><span className="block font-medium">Default package</span><span className="text-xs text-muted-foreground">Used when provisioning a new user.</span></span>
              </label>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={busy}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
    <Dialog
      open={Boolean(pendingPackageChange)}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setPendingPackageChange(null)
          setPackageChangeReason('')
        }
      }}
    >
      {pendingPackageChange ? (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm package change</DialogTitle>
            <DialogDescription>
              Assign <span className="font-medium text-foreground">{pendingPackageChange.packageName}</span> to this user. This action is recorded in the activity log.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void changePackage()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-package-change-reason">Reason</Label>
              <Textarea
                id="admin-package-change-reason"
                value={packageChangeReason}
                onChange={(event) => setPackageChangeReason(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Explain why this package is being assigned"
                required
              />
              <p className="text-xs text-muted-foreground">{packageChangeReason.length}/500 characters</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={busy}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={busy || !packageChangeReason.trim()}>{busy ? 'Applying…' : 'Apply package'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  </PageShell>
}
