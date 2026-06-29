import { useEffect, useMemo, useState } from 'react'
import { Ban, Search, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { LoadingState } from '../../components/shared/CelestialLoading'
import { listAdminUsers, banUser, unbanUser } from '../../services/adminApi'
import type { AdminUser } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [users, setUsers] = useState<AdminUser[]>([])

  // Ban dialog state
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)
  const [banReason, setBanReason] = useState('')

  useEffect(() => {
    listAdminUsers()
      .then(setUsers)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.fullName.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [query, statusFilter, users])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter])

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)

  function openBanDialog(user: AdminUser) {
    setBanTarget(user)
    setBanReason('')
  }

  async function handleBan() {
    if (!banTarget || !banReason.trim()) return
    try {
      const nextUser = await banUser(banTarget.id, banReason.trim())
      setUsers((cur) => cur.map((u) => (u.id === nextUser.id ? nextUser : u)))
      setBanTarget(null)
    } catch (err: any) {
      alert(err.message || 'Failed to ban user')
    }
  }

  async function handleUnban(user: AdminUser) {
    try {
      const nextUser = await unbanUser(user.id)
      setUsers((cur) => cur.map((u) => (u.id === nextUser.id ? nextUser : u)))
    } catch (err: any) {
      alert(err.message || 'Failed to unban user')
    }
  }



  return (
    <main className="botanical-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        description="View users, update roles, and ban or unban accounts."
        eyebrow="Admin users"
        title="User Management"
      />

      <section className="botanical-bento moonlit-table tone-surface tone-teal mt-8 overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users by name or email"
              value={query}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Status:</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Banned</option>
              </select>
            </div>
            <StatusBadge severity="info">{filteredUsers.length} users</StatusBadge>
          </div>
        </div>

        {/* ── Table header ── */}
        <div className="hidden xl:grid xl:grid-cols-[1fr_140px_170px_200px] gap-4 border-b border-border/50 bg-muted/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>User</span>
          <span>Status</span>
          <span>Joined</span>
          <span className="text-right">Actions</span>
        </div>

        {/* ── Rows ── */}
        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-5">
              <LoadingState label="Loading users..." tone="teal" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Users className="mb-3 size-12 text-muted-foreground/30" />
              <p>No users match the current filters.</p>
            </div>
          ) : (
            paginatedUsers.map((user) => (
              <article className="grid gap-4 p-5 transition-colors hover:bg-muted/35 xl:grid-cols-[1fr_140px_170px_200px]" key={user.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--accent-teal)]/35 bg-[color-mix(in_oklab,var(--accent-teal)_16%,transparent)]">
                    {user.avatar ? (
                      <img alt="" className="size-9 rounded-lg object-cover" src={user.avatar} />
                    ) : (
                      <Users className="size-5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground">{user.fullName}</h2>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <StatusBadge severity={user.isActive ? 'active' : 'inactive'}>
                    {user.isActive ? 'Active' : 'Banned'}
                  </StatusBadge>
                  {user.banReason && (
                    <p className="mt-1 text-xs text-muted-foreground truncate" title={user.banReason}>
                      {user.banReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {formatDateTime(user.createdAt)}
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                  {user.isActive ? (
                    <Button onClick={() => openBanDialog(user)} size="sm" type="button" variant="destructive">
                      <Ban data-icon="inline-start" />
                      Ban
                    </Button>
                  ) : (
                    <Button onClick={() => void handleUnban(user)} size="sm" type="button" variant="default">
                      <ShieldCheck data-icon="inline-start" />
                      Unban
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-5 py-4 bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredUsers.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(filteredUsers.length, currentPage * ITEMS_PER_PAGE)} of {filteredUsers.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>



      {/* Ban dialog sheet */}
      <Sheet open={Boolean(banTarget)} onOpenChange={(open) => !open && setBanTarget(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Ban user account</SheetTitle>
            <SheetDescription>
              You are about to ban <strong>{banTarget?.fullName}</strong> ({banTarget?.email}).
              Please provide a reason.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 p-4">
            <label className="grid gap-2 text-sm font-medium">
              Ban reason (required)
              <Textarea
                placeholder="e.g. Violation of community guidelines"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </label>
          </div>
          <SheetFooter>
            <Button
              disabled={!banReason.trim()}
              onClick={() => void handleBan()}
              type="button"
              variant="destructive"
            >
              Confirm ban
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  )
}
