import { useMemo, useState } from 'react'
import { BookMarked, Palette, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '../components/management/EmptyState'
import { useSubjects } from '../hooks/useSubjects'
import { useToast } from '../hooks/useToast'
import type { Subject } from '../types/subject'
import { formatDate } from '../utils/formatters'

type SubjectForm = {
  name: string
  code: string
  description: string
  color: string
}

const emptyForm: SubjectForm = {
  code: '',
  color: '#38bdf8',
  description: '',
  name: '',
}

function SubjectFormFields({
  disabled,
  form,
  onChange,
}: {
  disabled: boolean
  form: SubjectForm
  onChange: (form: SubjectForm) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">
        Name
        <Input
          disabled={disabled}
          maxLength={120}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder="Software Engineering"
          required
          value={form.name}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Code
        <Input
          disabled={disabled}
          maxLength={32}
          onChange={(event) => onChange({ ...form, code: event.target.value })}
          placeholder="SE101"
          value={form.code}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Description
        <Textarea
          disabled={disabled}
          maxLength={600}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          placeholder="Course notes, assignments, and reference material"
          value={form.description}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Color
        <div className="flex items-center gap-3">
          <Input
            aria-label="Subject color"
            className="h-10 w-16 p-1"
            disabled={disabled}
            onChange={(event) => onChange({ ...form, color: event.target.value })}
            type="color"
            value={form.color}
          />
          <Input
            disabled={disabled}
            onChange={(event) => onChange({ ...form, color: event.target.value })}
            value={form.color}
          />
        </div>
      </label>
    </div>
  )
}

export default function SubjectsPage() {
  const { addSubject, error, isLoading, removeSubject, saveSubject, subjects } = useSubjects()
  const { showToast } = useToast()
  const [form, setForm] = useState<SubjectForm>(emptyForm)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const sortedSubjects = useMemo(
    () =>
      [...subjects].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [subjects],
  )

  function openCreate() {
    setEditingSubject(null)
    setForm(emptyForm)
    setIsSheetOpen(true)
  }

  function openEdit(subject: Subject) {
    setEditingSubject(subject)
    setForm({
      code: subject.code ?? '',
      color: subject.color ?? '#38bdf8',
      description: subject.description ?? '',
      name: subject.name,
    })
    setIsSheetOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      showToast({ tone: 'warning', message: 'Subject name is required' })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        code: form.code.trim() || undefined,
        color: form.color,
        description: form.description.trim() || undefined,
        name: form.name.trim(),
      }

      if (editingSubject) {
        await saveSubject(editingSubject._id, payload)
        showToast({ tone: 'success', message: 'Subject updated successfully' })
      } else {
        await addSubject(payload)
        showToast({ tone: 'success', message: 'Subject created successfully' })
      }

      setIsSheetOpen(false)
      setEditingSubject(null)
      setForm(emptyForm)
    } catch (caughtError) {
      showToast({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Unable to save subject',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deletingSubject) {
      return
    }

    setIsDeleting(true)

    try {
      await removeSubject(deletingSubject._id)
      showToast({ tone: 'success', message: 'Subject deleted successfully' })
      setDeletingSubject(null)
    } catch (caughtError) {
      showToast({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Unable to delete subject',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="celestial-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Study workspace
            </p>
            <h1 className="celestial-title mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
              Subjects
            </h1>
          </div>
          <Button className="self-start lg:self-auto" onClick={openCreate} type="button">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add Subject
          </Button>
        </header>

        {error ? (
          <div className="celestial-card tone-surface tone-coral px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="celestial-card celestial-table tone-surface tone-sapphire overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Subject Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                : sortedSubjects.map((subject) => (
                    <TableRow key={subject._id}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: subject.color ?? '#38bdf8' }}
                          />
                          <span className="truncate font-medium">{subject.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{subject.code || 'None'}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {subject.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <span
                            className="size-5 rounded border border-border"
                            style={{ backgroundColor: subject.color ?? '#38bdf8' }}
                          />
                          {subject.color || 'Default'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(subject.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            aria-label={`Edit ${subject.name}`}
                            onClick={() => openEdit(subject)}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Delete ${subject.name}`}
                            onClick={() => setDeletingSubject(subject)}
                            size="icon-sm"
                            type="button"
                            variant="destructive"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!isLoading && sortedSubjects.length === 0 ? (
            <EmptyState
              action={<Button onClick={openCreate}><Plus data-icon="inline-start" />Add Subject</Button>}
              description="Create subjects before uploading documents so every file can be classified."
              icon={<BookMarked className="size-8" aria-hidden="true" />}
              title="No subjects yet"
            />
          ) : null}
        </section>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>{editingSubject ? 'Edit subject' : 'Add subject'}</SheetTitle>
              <SheetDescription>
                Organize documents by course, module, or study area.
              </SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto p-4">
              <SubjectFormFields disabled={isSaving} form={form} onChange={setForm} />
            </div>
            <SheetFooter>
              <Button disabled={isSaving} type="submit">
                <Palette data-icon="inline-start" aria-hidden="true" />
                {isSaving ? 'Saving...' : 'Save Subject'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {deletingSubject ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-xl">
            <h2 className="text-lg font-semibold">Delete subject?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete {deletingSubject.name}. Documents linked to this subject may lose their category.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                disabled={isDeleting}
                onClick={() => setDeletingSubject(null)}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                type="button"
                variant="destructive"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
