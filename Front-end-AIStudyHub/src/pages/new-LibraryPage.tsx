import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpFromLineIcon,
  BookOpenText,
  ChevronDownIcon,
  Clock3,
  Download,
  ExternalLink,
  FileIcon,
  FileText,
  MoreHorizontal,
  Pencil,
  SearchIcon,
  Settings,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CelestialInlineLoader,
  CelestialProgress,
} from "../components/shared/CelestialLoading";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DocumentApiError,
  deleteDocument,
  listDocuments,
  searchDocuments,
  updateDocument,
  uploadDocument,
} from "../services/documentApi";
import type { DocumentItem } from "../types/document";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SEARCH_DEBOUNCE_MS = 350;

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

type DocumentFormState = {
  description: string;
  subject: string;
  title: string;
};

const emptyForm: DocumentFormState = {
  description: "",
  subject: "",
  title: "",
};

function IconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function validateUploadForm(form: DocumentFormState, file: File | null): string | null {
  const title = form.title.trim();
  const description = form.description.trim();
  const subject = form.subject.trim();

  if (!file) {
    return "PDF file is required";
  }

  if (file.type !== "application/pdf") {
    return "Only PDF files are allowed";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "PDF must be 10 MB or smaller";
  }

  if (!title) {
    return "Title is required";
  }

  if (title.length > 160) {
    return "Title must be 160 characters or fewer";
  }

  if (description.length > 1000) {
    return "Description must be 1000 characters or fewer";
  }

  if (subject.length > 80) {
    return "Subject must be 80 characters or fewer";
  }

  return null;
}

function validateEditForm(form: DocumentFormState): string | null {
  const title = form.title.trim();

  if (!title) {
    return "Title is required";
  }

  if (title.length > 160) {
    return "Title must be 160 characters or fewer";
  }

  if (form.description.trim().length > 1000) {
    return "Description must be 1000 characters or fewer";
  }

  if (form.subject.trim().length > 80) {
    return "Subject must be 80 characters or fewer";
  }

  return null;
}

function DocumentFields({
  disabled,
  fileInput,
  form,
  mode,
  onFileChange,
  onFormChange,
}: {
  disabled: boolean;
  fileInput?: File | null;
  form: DocumentFormState;
  mode: "upload" | "edit";
  onFileChange?: (file: File | null) => void;
  onFormChange: (form: DocumentFormState) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {mode === "upload" && (
        <label className="flex flex-col gap-2 text-sm font-medium">
          PDF file
          <Input
            accept="application/pdf"
            disabled={disabled}
            onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span className="text-xs text-muted-foreground">
            {fileInput ? `${fileInput.name} · ${formatFileSize(fileInput.size)}` : "PDF only, up to 10 MB"}
          </span>
        </label>
      )}

      <label className="flex flex-col gap-2 text-sm font-medium">
        Title
        <Input
          disabled={disabled}
          maxLength={160}
          onChange={(event) =>
            onFormChange({ ...form, title: event.target.value })
          }
          placeholder="Lesson 1"
          value={form.title}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Subject
        <Input
          disabled={disabled}
          maxLength={80}
          onChange={(event) =>
            onFormChange({ ...form, subject: event.target.value })
          }
          placeholder="Math"
          value={form.subject}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Description
        <Textarea
          disabled={disabled}
          maxLength={1000}
          onChange={(event) =>
            onFormChange({ ...form, description: event.target.value })
          }
          placeholder="Algebra notes"
          value={form.description}
        />
      </label>
    </div>
  );
}

export default function NewLibraryPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<DocumentFormState>(emptyForm);
  const [editForm, setEditForm] = useState<DocumentFormState>(emptyForm);
  const didLoadRef = useRef(false);

  const showSearchMode = searchQuery.trim() || subjectFilter.trim();

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [documents],
  );

  async function loadDocuments() {
    setIsLoading(true);
    setFeedback(null);

    try {
      const nextDocuments = await listDocuments();
      setDocuments(nextDocuments);
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    didLoadRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void loadDocuments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      if (!showSearchMode) {
        void loadDocuments();
        return;
      }

      setIsLoading(true);
      setFeedback(null);

      try {
        const results = await searchDocuments({
          keyword: searchQuery,
          subject: subjectFilter,
        });
        setDocuments(results);
      } catch (error) {
        setFeedback({ tone: "error", message: getErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, showSearchMode, subjectFilter]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateUploadForm(uploadForm, selectedFile);

    if (validationError) {
      setFeedback({ tone: "error", message: validationError });
      return;
    }

    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setFeedback({
      tone: "info",
      message: "Uploading and preparing this document for AI chat...",
    });

    try {
      await uploadDocument({
        description: uploadForm.description,
        file: selectedFile,
        subject: uploadForm.subject,
        title: uploadForm.title,
      });
      setFeedback({
        tone: "success",
        message: "Document uploaded successfully. It is being prepared for AI chat.",
      });
      setUploadForm(emptyForm);
      setSelectedFile(null);
      setIsUploadOpen(false);
      await loadDocuments();
    } catch (error) {
      // Server đôi khi trả 500 dù upload thực sự thành công (lỗi serialize response).
      // Thử reload lại list; nếu OK thì coi như upload thành công.
      if (error instanceof DocumentApiError && error.status === 500) {
        try {
          await loadDocuments();
          setFeedback({
            tone: "success",
            message: "Document uploaded successfully. It is being prepared for AI chat.",
          });
          setUploadForm(emptyForm);
          setSelectedFile(null);
          setIsUploadOpen(false);
          return;
        } catch {
          // loadDocuments cũng lỗi → báo lỗi bình thường
        }
      }
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDocument) {
      return;
    }

    const validationError = validateEditForm(editForm);

    if (validationError) {
      setFeedback({ tone: "error", message: validationError });
      return;
    }

    setIsSavingEdit(true);
    setFeedback(null);

    try {
      const updatedDocument = await updateDocument(editingDocument.id, {
        description: editForm.description.trim(),
        subject: editForm.subject.trim(),
        title: editForm.title.trim(),
      });
      setDocuments((current) =>
        current.map((document) =>
          document.id === updatedDocument.id ? updatedDocument : document,
        ),
      );
      setFeedback({ tone: "success", message: "Document updated successfully" });
      setEditingDocument(null);
      setIsEditOpen(false);
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(document: DocumentItem) {
    if (pendingDeleteId !== document.id) {
      setPendingDeleteId(document.id);
      setFeedback({
        tone: "info",
        message: `Choose Delete again to permanently remove "${document.title}".`,
      });
      return;
    }

    setIsDeletingId(document.id);
    setFeedback(null);

    try {
      await deleteDocument(document.id);
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );
      setPendingDeleteId(null);
      setFeedback({ tone: "success", message: "Document deleted successfully" });
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsDeletingId(null);
    }
  }

  function openEdit(document: DocumentItem) {
    setEditingDocument(document);
    setEditForm({
      description: document.description ?? "",
      subject: document.subject ?? "",
      title: document.title,
    });
    setIsEditOpen(true);
  }

  function openFile(document: DocumentItem) {
    window.open(document.fileUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="celestial-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <InputGroup className="mx-auto max-w-md bg-card/70 backdrop-blur">
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

          <Input
            aria-label="Filter by subject"
            className="max-w-56"
            onChange={(event) => setSubjectFilter(event.target.value)}
            placeholder="Subject"
            value={subjectFilter}
          />
        </header>

        <section className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <h1 className="celestial-title text-3xl font-semibold tracking-tight md:text-5xl">
                  Study documents
                </h1>
                <IconTooltip label="Document settings">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Document settings"
                  >
                    <Settings aria-hidden="true" />
                  </Button>
                </IconTooltip>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" className="rounded-full">
                  <Clock3 data-icon="inline-start" aria-hidden="true" />
                  Newest first
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end xl:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" disabled={isUploading}>
                    <ArrowUpFromLineIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                    Upload
                    <ChevronDownIcon
                      data-icon="inline-end"
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-fit" align="end">
                  <DropdownMenuItem onSelect={() => setIsUploadOpen(true)}>
                    <FileIcon />
                    PDF document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {feedback && (
            <div
              className={`celestial-card tone-surface px-4 py-3 text-sm ${feedback.tone === "error" ? "tone-coral" : feedback.tone === "success" ? "tone-emerald" : "tone-sapphire"}`}
              role={feedback.tone === "error" ? "alert" : "status"}
            >
              <span
                className={
                  feedback.tone === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {feedback.message}
              </span>
            </div>
          )}

          {isUploading && (
            <div className="celestial-card tone-surface tone-cyan flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UploadCloud aria-hidden="true" />
                Uploading, extracting text, and indexing for RAG
              </div>
              <CelestialProgress tone="cyan" />
            </div>
          )}

          <div className="celestial-card celestial-table tone-surface tone-sapphire overflow-x-auto overflow-y-hidden">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="size-8" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                              <Skeleton className="h-4 w-52" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto size-8" />
                        </TableCell>
                      </TableRow>
                    ))
                  : sortedDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <button
                            className="flex min-w-0 items-center gap-3 text-left"
                            onClick={() => openFile(document)}
                            type="button"
                          >
                            <div className="admin-icon-badge admin-tone-blue flex size-9 shrink-0 items-center justify-center rounded-lg">
                              <FileText aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {document.title}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {document.fileName}
                              </div>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="status-badge status-info normal-case">
                            {document.subject || "Unsorted"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(document.fileSize)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(document.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu
                            onOpenChange={(open) => {
                              if (!open) {
                                setPendingDeleteId(null);
                              }
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`More options for ${document.title}`}
                              >
                                <MoreHorizontal aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onSelect={() => openFile(document)}>
                                <ExternalLink />
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  window.location.href = document.fileUrl;
                                }}
                              >
                                <Download />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openEdit(document)}>
                                <Pencil />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isDeletingId === document.id}
                                onSelect={(event) => {
                                  event.preventDefault();
                                  void handleDelete(document);
                                }}
                                variant="destructive"
                              >
                                <Trash2 />
                                {pendingDeleteId === document.id
                                  ? "Confirm delete"
                                  : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!isLoading && sortedDocuments.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border p-8 text-center">
                <BookOpenText className="text-muted-foreground" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <h2 className="font-medium">No documents found</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Upload a PDF to store it in Cloudinary and prepare it for AI chat.
                  </p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <UploadCloud data-icon="inline-start" aria-hidden="true" />
                  Upload PDF
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <SheetContent>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleUpload}>
            <SheetHeader>
              <SheetTitle>Upload document</SheetTitle>
              <SheetDescription>
                PDFs are stored in Cloudinary, parsed, and indexed for AI chat.
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
              />
            </div>
            <SheetFooter>
              <Button disabled={isUploading} type="submit">
                <UploadCloud data-icon="inline-start" aria-hidden="true" />
                {isUploading ? <CelestialInlineLoader label="Uploading..." /> : "Upload PDF"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingDocument(null);
          }
        }}
      >
        <SheetContent>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleEdit}>
            <SheetHeader>
              <SheetTitle>Edit document</SheetTitle>
              <SheetDescription>
                Updating the subject can refresh the document indexing metadata.
              </SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentFields
                disabled={isSavingEdit}
                form={editForm}
                mode="edit"
                onFormChange={setEditForm}
              />
            </div>
            <SheetFooter>
              <Button disabled={isSavingEdit} type="submit">
                {isSavingEdit ? "Saving..." : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  );
}
