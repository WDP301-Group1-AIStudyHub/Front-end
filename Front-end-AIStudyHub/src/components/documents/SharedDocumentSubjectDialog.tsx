import { useEffect, useState, type FormEvent } from 'react'
import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateSharedDocumentProfile } from '@/services/documentApi'
import type { SubjectItem } from '@/services/subjectApi'
import type { DocumentItem } from '@/types/document'

type SharedDocumentSubjectDialogProps = {
  document: DocumentItem | null
  open: boolean
  subjects: SubjectItem[]
  onOpenChange: (open: boolean) => void
  onUpdated: (document: DocumentItem) => void
}

function getInitialSubjectId(document: DocumentItem | null): string {
  return document?.personalSubjectId || document?.subjectId || ''
}

function subjectLabel(subject: SubjectItem): string {
  return [subject.code, subject.name, subject.semester]
    .filter(Boolean)
    .join(' | ')
}

export default function SharedDocumentSubjectDialog({
  document,
  open,
  subjects,
  onOpenChange,
  onUpdated,
}: SharedDocumentSubjectDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedSubjectId(getInitialSubjectId(document))
      setError(null)
    }
  }, [document, open])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!document) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const updatedDocument = await updateSharedDocumentProfile(document.id, {
        subjectId: selectedSubjectId || null,
      })
      onUpdated(updatedDocument)
      onOpenChange(false)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update shared document subject',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form className="flex flex-col gap-4" onSubmit={saveProfile}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-5" aria-hidden="true" />
              Assign subject
            </DialogTitle>
            <DialogDescription>
              Choose your own subject for "{document?.title || 'this shared document'}".
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 text-sm font-semibold">
            <span>Subject</span>
            <Select
              disabled={isSaving}
              onValueChange={(val) => setSelectedSubjectId(val === 'unassigned' ? '' : val)}
              value={selectedSubjectId || 'unassigned'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject._id} value={subject._id}>
                    {subjectLabel(subject)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={isSaving || !document} type="submit">
              {isSaving ? 'Saving...' : 'Save subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
