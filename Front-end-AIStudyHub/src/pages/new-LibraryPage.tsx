import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenText,
  Download,
  FileText,
  Pencil,
  Plus,
  SearchIcon,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
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
import { ProgressPanel } from '../components/management/ProgressPanel'
import { StatusBadge } from '../components/management/StatusBadge'
import { SubjectSelect } from '../components/management/SubjectSelect'
import { useDocuments } from '../hooks/useDocuments'
import { useSubjects } from '../hooks/useSubjects'
import { useToast } from '../hooks/useToast'
import { useUploadSession } from '../hooks/useUploadSession'
import type { DocumentItem, UploadSession } from '../types/document'
import { formatDate, formatFileSize } from '../utils/formatters'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const SEARCH_DEBOUNCE_MS = 350

type DocumentFormState = {
  description: string
  subjectId: string
  title: string
}

const emptyForm: DocumentFormState = {
  description: '',
  subjectId: '',
  title: '',
}

function validateUploadForm(form: DocumentFormState, file: File | null): string | null {
  if (!file) {
    return 'PDF file is required'
  }

  if (file.type && file.type !== 'application/pdf') {
    return 'Only PDF files are allowed'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'PDF must be 10 MB or smaller'
  }

  if (!form.title.trim()) {
    return 'Title is required'
  }

  if (!form.subjectId) {
    return 'Subject must be selected'
  }

  return null
}

function validateEditForm(form: DocumentFormState): string | null {
  if (!form.title.trim()) {
    return 'Title is required'
  }

  if (!form.subjectId) {
    return 'Subject must be selected'
  }

  return null
}

function DocumentFields({
  disabled,
  fileInput,
  form,
  mode,
  onFileChange,
  onFormChange,
  subjects,
}: {
  disabled: boolean
  fileInput?: File | null
  form: DocumentFormState
  mode: 'upload' | 'edit'
  onFileChange?: (file: File | null) => void
  onFormChange: (form: DocumentFormState) => void
  subjects: ReturnType<typeof useSubjects>['subjects']
}) {
  return (
    <div className="flex flex-col gap-4">
      {mode === 'upload' ? (
        <label className="flex flex-col gap-2 text-sm font-medium">
          PDF file
          <Input
            accept="application/pdf"
            disabled={disabled}
            onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span className="text-xs text-muted-foreground">
            {fileInput ? `${fileInput.name} - ${formatFileSize(fileInput.size)}` : 'PDF only, up to 10 MB'}
          </span>
        </label>
      ) : null}

      <label className="flex flex-col gap-2 text-sm font-medium">
        Title
        <Input
          disabled={disabled}
          maxLength={160}
          onChange={(event) => onFormChange({ ...form, title: event.target.value })}
          placeholder="Lesson 1"
          value={form.title}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Subject
        <SubjectSelect
          disabled={disabled}
          onChange={(subjectId) => onFormChange({ ...form, subjectId })}
          subjects={subjects}
          value={form.subjectId}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Description
        <Textarea
          disabled={disabled}
          maxLength={1000}
          onChange={(event) => onFormChange({ ...form, description: event.target.value })}
          placeholder="Algebra notes"
          value={form.description}
        />
      </label>
    </div>
  )
}

export default function NewLibraryPage() {
  const navigate = useNavigate()
  const {
    documents,
    error: documentError,
    isLoading,
    loadDocuments,
    remove,
    save,
    search,
    upload,
  } = useDocuments()
  const { error: subjectError, isLoading: subjectsLoading, subjects } = useSubjects()
  const { showToast } = useToast()
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DocumentItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [uploadForm, setUploadForm] = useState<DocumentFormState>(emptyForm)
  const [editForm, setEditForm] = useState<DocumentFormState>(emptyForm)
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [localSession, setLocalSession] = useState<UploadSession | null>(null)
  const { error: sessionError, session, setSession } = useUploadSession(uploadSessionId)

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject._id, subject])),
    [subjects],
  )

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [documents],
  )

  const activeSession = session || localSession

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void search(searchQuery, subjectFilter)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [search, searchQuery, subjectFilter])

  useEffect(() => {
    if (!activeSession) {
      return
    }

    if (activeSession.status === 'COMPLETED') {
      showToast({ tone: 'success', message: 'Document processing completed' })
      setUploadSessionId(null)
      setLocalSession(null)
      setSession(null)
      void loadDocuments()
    }

    if (activeSession.status === 'FAILED') {
      showToast({
        tone: 'error',
        message: activeSession.message || 'Document processing failed',
      })
      setUploadSessionId(null)
    }
  }, [activeSession, loadDocuments, setSession, showToast])

  useEffect(() => {
    if (documentError) {
      showToast({ tone: 'error', message: documentError })
    }
  }, [documentError, showToast])

  useEffect(() => {
    if (subjectError) {
      showToast({ tone: 'error', message: subjectError })
    }
  }, [subjectError, showToast])

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateUploadForm(uploadForm, selectedFile)

    if (validationError) {
      showToast({ tone: 'warning', message: validationError })
      return
    }

    if (!selectedFile) {
      return
    }

    setIsUploading(true)
    setLocalSession({
      _id: 'local-upload',
      progress: 0,
      stage: 'UPLOADED',
      status: 'PENDING',
    })

    try {
      const result = await upload({
        description: uploadForm.description,
        file: selectedFile,
        subjectId: uploadForm.subjectId,
        title: uploadForm.title,
      })

      if (result.uploadSession) {
        setLocalSession(result.uploadSession)
        setUploadSessionId(result.uploadSession._id)
      } else {
        setLocalSession({
          _id: 'local-completed',
          progress: 100,
          stage: 'COMPLETED',
          status: 'COMPLETED',
        })
      }

      setUploadForm(emptyForm)
      setSelectedFile(null)
      setIsUploadOpen(false)
      showToast({ tone: 'success', message: 'Document uploaded successfully' })
      await loadDocuments()
    } catch (caughtError) {
      setLocalSession({
        _id: 'local-failed',
        message: caughtError instanceof Error ? caughtError.message : 'Unable to upload document',
        progress: 100,
        stage: 'UPLOADED',
        status: 'FAILED',
      })
      showToast({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Unable to upload document',
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingDocument) {
      return
    }

    const validationError = validateEditForm(editForm)

    if (validationError) {
      showToast({ tone: 'warning', message: validationError })
      return
    }

    setIsSavingEdit(true)

    try {
      await save(editingDocument._id, {
        description: editForm.description.trim() || undefined,
        subjectId: editForm.subjectId,
        title: editForm.title.trim(),
      })
      showToast({ tone: 'success', message: 'Document updated successfully' })
      setEditingDocument(null)
      setIsEditOpen(false)
    } catch (caughtError) {
      showToast({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Unable to update document',
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await remove(pendingDelete._id)
      showToast({ tone: 'success', message: 'Document deleted successfully' })
      setPendingDelete(null)
    } catch (caughtError) {
      showToast({
        tone: 'error',
        message: caughtError instanceof Error ? caughtError.message : 'Unable to delete document',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function openEdit(document: DocumentItem) {
    setEditingDocument(document)
    setEditForm({
      description: document.description ?? '',
      subjectId: document.subjectId,
      title: document.title,
    })
    setIsEditOpen(true)
  }

  function subjectLabel(document: DocumentItem): string {
    const subject = subjectById.get(document.subjectId)
    return subject ? [subject.code, subject.name].filter(Boolean).join(' ') : document.subject || 'Unsorted'
  }

  function downloadDocument(document: DocumentItem) {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer')
    } else {
      showToast({ tone: 'warning', message: 'Download URL is not available' })
    }
  }

  return (
    <main className="celestial-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Document management
            </p>
            <h1 className="celestial-title mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
              Study documents
            </h1>
          </div>
          <Button disabled={isUploading || subjectsLoading} onClick={() => setIsUploadOpen(true)}>
            <UploadCloud data-icon="inline-start" aria-hidden="true" />
            Upload Document
          </Button>
        </header>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <InputGroup className="bg-card/70 backdrop-blur">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search documents"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search documents"
              type="search"
              value={searchQuery}
            />
          </InputGroup>
          <SubjectSelect
            disabled={subjectsLoading}
            onChange={setSubjectFilter}
            subjects={subjects}
            value={subjectFilter}
          />
        </div>

        {activeSession ? <ProgressPanel error={sessionError} session={activeSession} /> : null}

        <section className="celestial-card celestial-table tone-surface tone-sapphire overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>File Type</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                : sortedDocuments.map((document) => (
                    <TableRow
                      className="cursor-pointer"
                      key={document._id}
                      onClick={() => navigate(`/documents/${document._id}`)}
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="admin-icon-badge admin-tone-blue flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <FileText aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{document.title}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {document.description || document.fileName || 'No description'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{subjectLabel(document)}</TableCell>
                      <TableCell>{document.fileType || 'Unknown'}</TableCell>
                      <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                      <TableCell>{document.totalViews}</TableCell>
                      <TableCell>{document.totalDownloads}</TableCell>
                      <TableCell><StatusBadge status={document.status} /></TableCell>
                      <TableCell>{formatDate(document.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            aria-label={`Download ${document.title}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              downloadDocument(document)
                            }}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <Download aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Edit ${document.title}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              openEdit(document)
                            }}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Delete ${document.title}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setPendingDelete(document)
                            }}
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

          {!isLoading && sortedDocuments.length === 0 ? (
            <EmptyState
              action={<Button onClick={() => setIsUploadOpen(true)}><Plus data-icon="inline-start" />Upload Document</Button>}
              description="Upload a PDF and link it to a subject to prepare it for AI chat."
              icon={<BookOpenText className="size-8" aria-hidden="true" />}
              title="No documents found"
            />
          ) : null}
        </section>
      </div>

      <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <SheetContent>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleUpload}>
            <SheetHeader>
              <SheetTitle>Upload document</SheetTitle>
              <SheetDescription>
                Select a subject before uploading so the document can be indexed correctly.
              </SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentFields
                disabled={isUploading}
                fileInput={selectedFile}
                form={uploadForm}
                mode="upload"
                onFileChange={setSelectedFile}
                onFormChange={setUploadForm}
                subjects={subjects}
              />
            </div>
            <SheetFooter>
              <Button disabled={isUploading} type="submit">
                <UploadCloud data-icon="inline-start" aria-hidden="true" />
                {isUploading ? 'Uploading...' : 'Upload PDF'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setEditingDocument(null)
          }
        }}
      >
        <SheetContent>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleEdit}>
            <SheetHeader>
              <SheetTitle>Edit document</SheetTitle>
              <SheetDescription>Update metadata and subject assignment.</SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentFields
                disabled={isSavingEdit}
                form={editForm}
                mode="edit"
                onFormChange={setEditForm}
                subjects={subjects}
              />
            </div>
            <SheetFooter>
              <Button disabled={isSavingEdit} type="submit">
                {isSavingEdit ? 'Saving...' : 'Save changes'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-xl">
            <h2 className="text-lg font-semibold">Delete document?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete {pendingDelete.title}.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                disabled={isDeleting}
                onClick={() => setPendingDelete(null)}
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
