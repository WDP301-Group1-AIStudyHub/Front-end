import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UserCog, Users } from 'lucide-react'
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
import { listAdminUsers, toggleUserActive, updateAdminUser } from '../../services/adminApi'
import type { AdminUser } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

type UserFormState = Pick<AdminUser, 'email' | 'fullName' | 'role'>

export default function AdminUsersPage() {
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormState>({ email: '', fullName: '', role: 'user' })
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [users, setUsers] = useState<AdminUser[]>([])

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
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesQuery && matchesRole && matchesStatus
    })
  }, [query, roleFilter, statusFilter, users])

  function openEditor(user: AdminUser) {
    setEditingUser(user)
    setForm({ email: user.email, fullName: user.fullName, role: user.role })
  }

  async function handleToggle(user: AdminUser) {
    const nextUser = await toggleUserActive(user.id, !user.isActive)
    setUsers((currentUsers) =>
      currentUsers.map((currentUser) => (currentUser.id === nextUser.id ? nextUser : currentUser)),
    )
  }

  async function handleSave() {
    if (!editingUser) return

    const nextUser = await updateAdminUser(editingUser.id, {
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      role: form.role,
    })
    setUsers((currentUsers) =>
      currentUsers.map((currentUser) => (currentUser.id === nextUser.id ? nextUser : currentUser)),
    )
    setEditingUser(null)
  }

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        description="View users, update account details, and activate or deactivate accounts from a single control surface."
        eyebrow="Admin users"
        title="User Management"
      />

      <section className="celestial-card celestial-table tone-surface tone-teal mt-8 overflow-hidden">
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
          <div className="flex flex-wrap gap-2">
            {(['all', 'admin', 'user'] as const).map((role) => (
              <Button
                key={role}
                onClick={() => setRoleFilter(role)}
                size="sm"
                type="button"
                variant={roleFilter === role ? 'default' : 'outline'}
              >
                {role}
              </Button>
            ))}
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                size="sm"
                type="button"
                variant={statusFilter === status ? 'default' : 'outline'}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center text-muted-foreground">
              <div>
                <Users className="mx-auto mb-3 size-8" />
                <p>No users match the current filters.</p>
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <article className="grid gap-4 p-5 transition-colors hover:bg-muted/35 xl:grid-cols-[1fr_130px_160px_190px_220px]" key={user.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--accent-teal)]/35 bg-[color-mix(in_oklab,var(--accent-teal)_16%,transparent)] shadow-[0_0_22px_color-mix(in_oklab,var(--accent-teal)_22%,transparent)]">
                    <img alt="" className="size-9 rounded-lg object-cover" src={user.avatar} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{user.fullName}</h2>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <StatusBadge severity={user.role === 'admin' ? 'warning' : 'info'}>
                  {user.role}
                </StatusBadge>
                <StatusBadge severity={user.status}>{user.status}</StatusBadge>
                <div className="text-sm text-muted-foreground">
                  <span className="block font-medium text-foreground">{user.documentCount} docs</span>
                  {formatDateTime(user.lastLoginAt)}
                </div>
                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <Button onClick={() => openEditor(user)} size="sm" type="button" variant="outline">
                    <UserCog data-icon="inline-start" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => void handleToggle(user)}
                    size="sm"
                    type="button"
                    variant={user.isActive ? 'destructive' : 'default'}
                  >
                    <ShieldCheck data-icon="inline-start" />
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Sheet open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Update user information</SheetTitle>
            <SheetDescription>
              Admins can edit profile metadata and role assignment from this mock API surface.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 p-4">
            <label className="grid gap-2 text-sm font-medium">
              Full name
              <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Email
              <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Role
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as AdminUser['role'] })}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </div>
          <SheetFooter>
            <Button onClick={() => void handleSave()} type="button">Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  )
}
