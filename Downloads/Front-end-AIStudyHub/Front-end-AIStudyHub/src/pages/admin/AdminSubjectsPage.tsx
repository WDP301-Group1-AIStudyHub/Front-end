import { useEffect, useMemo, useState } from 'react'
import { BookMarked, Edit3, Plus, Search, Trash2 } from 'lucide-react'
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
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from '../../services/adminApi'
import type { AdminSubject, AdminSubjectPayload } from '../../types/admin'
import { AdminPageHeader, formatDateTime, StatusBadge } from './adminPageUtils'

const colorOptions = ['#2f73d9', '#18a99d', '#dca53d', '#f26f5b', '#8b5cf6']

const emptyForm: AdminSubjectPayload = {
  code: '',
  color: colorOptions[0],
  description: '',
  name: '',
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null)
  const [form, setForm] = useState<AdminSubjectPayload>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    listSubjects()
      .then(setSubjects)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredSubjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return subjects

    return subjects.filter((subject) =>
      [subject.name, subject.code, subject.description]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [query, subjects])

  function openCreate() {
    setEditingSubject(null)
    setForm(emptyForm)
    setIsSheetOpen(true)
  }

  function openEdit(subject: AdminSubject) {
    setEditingSubject(subject)
    setForm({
      code: subject.code ?? '',
      color: subject.color ?? colorOptions[0],
      description: subject.description ?? '',
      name: subject.name,
    })
    setIsSheetOpen(true)
  }

  async function handleSave() {
    const payload = {
      code: form.code?.trim(),
      color: form.color,
      description: form.description?.trim(),
      name: form.name.trim(),
    }

    if (!payload.name) return

    if (editingSubject) {
      const updatedSubject = await updateSubject(editingSubject.id, payload)
      setSubjects((current) =>
        current.map((subject) =>
          subject.id === updatedSubject.id ? updatedSubject : subject,
        ),
      )
    } else {
      const createdSubject = await createSubject(payload)
      setSubjects((current) => [createdSubject, ...current])
    }

    setIsSheetOpen(false)
  }

  async function handleDelete(subject: AdminSubject) {
    await deleteSubject(subject.id)
    setSubjects((current) => current.filter((item) => item.id !== subject.id))
  }

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <AdminPageHeader
        actions={
          <Button onClick={openCreate} type="button">
            <Plus data-icon="inline-start" aria-hidden="true" />
            New subject
          </Button>
        }
        description="Create and maintain learning subjects used to classify uploaded documents and filter library content."
        eyebrow="Admin subjects"
        title="Manage Subjects"
      />

      <section className="celestial-card celestial-table tone-surface tone-teal mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 md:flex-row md:items-center md:justify-between">
          <label className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subject name, code, description"
              value={query}
            />
          </label>
          <StatusBadge severity="info">{filteredSubjects.length} visible</StatusBadge>
        </div>

        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading subjects...</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center text-muted-foreground">
              <div>
                <BookMarked className="mx-auto mb-3 size-8" />
                <p>No subjects match the current search.</p>
              </div>
            </div>
          ) : (
            filteredSubjects.map((subject) => (
              <article
                className="grid gap-4 p-5 transition-colors hover:bg-muted/35 xl:grid-cols-[1.2fr_1.3fr_130px_160px_160px]"
                key={subject.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="admin-icon-badge size-10"
                    style={{ color: subject.color ?? colorOptions[0] }}
                  >
                    <BookMarked className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{subject.name}</h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {subject.code || 'No code'}
                    </p>
                  </div>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {subject.description || 'No description'}
                </p>
                <StatusBadge severity="success">
                  {subject.documentCount} docs
                </StatusBadge>
                <div className="text-sm text-muted-foreground">
                  <span className="block font-medium text-foreground">Updated</span>
                  {formatDateTime(subject.updatedAt)}
                </div>
                <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                  <Button onClick={() => openEdit(subject)} size="sm" type="button" variant="outline">
                    <Edit3 data-icon="inline-start" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button onClick={() => void handleDelete(subject)} size="sm" type="button" variant="outline">
                    <Trash2 data-icon="inline-start" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingSubject ? 'Edit subject' : 'Create subject'}</SheetTitle>
            <SheetDescription>
              Subject names are used by document forms, search filters, and AI retrieval metadata.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 p-4">
            <label className="grid gap-2 text-sm font-medium">
              Name
              <Input
                maxLength={80}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Computer Science"
                value={form.name}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Code
              <Input
                maxLength={20}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                placeholder="CS101"
                value={form.code ?? ''}
              />
            </label>
            <div className="grid gap-2 text-sm font-medium">
              Color
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    aria-label={`Select ${color}`}
                    className="size-8 rounded-full border border-border ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      background: color,
                      boxShadow: form.color === color ? '0 0 0 3px var(--ring)' : undefined,
                    }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Description
              <Textarea
                maxLength={400}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Documents and learning material for this subject."
                value={form.description ?? ''}
              />
            </label>
          </div>
          <SheetFooter>
            <Button disabled={!form.name.trim()} onClick={() => void handleSave()} type="button">
              {editingSubject ? 'Save subject' : 'Create subject'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  )
}
