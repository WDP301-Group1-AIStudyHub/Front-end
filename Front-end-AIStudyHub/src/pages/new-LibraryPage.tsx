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
  LinkIcon,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  SearchIcon,
  Settings,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  deleteDocument,
  listDocuments,
  searchDocuments,
  updateDocument,
} from "../services/documentApi";
import {
  findOrCreateSubjectByName,
  listSubjects,
} from "../services/subjectApi";
import type { SubjectItem } from "../services/subjectApi";
import { useUploadStore } from "../store/useUploadStore";
import type { DocumentItem } from "../types/document";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFileBadgeClass } from "../utils/formatters";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_SUBJECT_COLOR = "#64748b";
const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
]);
const SUPPORTED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".txt",
  ".md",
]);
const SUPPORTED_UPLOAD_ACCEPT = [
  ...SUPPORTED_UPLOAD_MIME_TYPES,
  ...SUPPORTED_UPLOAD_EXTENSIONS,
].join(",");
const SUPPORTED_UPLOAD_LABEL = "PDF, DOCX, PPTX, XLSX, TXT, or MD";

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
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getPreviewTitle(previewParam: string): string {
  const decoded = safeDecode(previewParam).split(/[\\/]/).pop() ?? previewParam;
  const withoutQuery = decoded.split("?")[0] || decoded;

  return withoutQuery.replace(/\.[^/.]+$/, "") || "Preview";
}

function getPreviewFileType(previewParam: string): string {
  const decoded = safeDecode(previewParam).split("?")[0];
  const extension = decoded.match(/\.([a-z0-9]+)$/i)?.[1];

  return (extension || "txt").toUpperCase();
}

function normalizePreviewKey(value: string | null | undefined): string {
  return safeDecode(value ?? "")
    .replace(/^id:/i, "")
    .trim()
    .toLowerCase();
}

function findPreviewDocument(
  documents: DocumentItem[],
  urlParams: URLSearchParams,
): DocumentItem | null {
  const previewKey = normalizePreviewKey(urlParams.get("preview"));
  const quickviewKey = normalizePreviewKey(urlParams.get("quickview"));
  const idKey = normalizePreviewKey(urlParams.get("id"));
  const keys = new Set([previewKey, quickviewKey, idKey].filter(Boolean));

  if (!keys.size) {
    return null;
  }

  return (
    documents.find((document) => {
      const documentKeys = [
        document.id,
        document.filePublicId,
        document.fileName,
        document.title,
      ].map(normalizePreviewKey);

      return documentKeys.some(
        (documentKey) =>
          keys.has(documentKey) ||
          [...keys].some((key) => documentKey.includes(key)),
      );
    }) ?? null
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function getFileExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function isSupportedUploadFile(file: File): boolean {
  return (
    SUPPORTED_UPLOAD_MIME_TYPES.has(file.type) ||
    SUPPORTED_UPLOAD_EXTENSIONS.has(getFileExtension(file.name))
  );
}

function getUploadErrors(
  form: DocumentFormState,
  file: File | null,
): Record<string, string | null> {
  const errors: Record<string, string | null> = {};
  const title = form.title.trim();
  const description = form.description.trim();
  const subject = form.subject.trim();

  // File validation
  if (!file) {
    errors.file = "Document file is required";
  } else if (!isSupportedUploadFile(file)) {
    errors.file = `Only ${SUPPORTED_UPLOAD_LABEL} files are allowed`;
  } else if (file.size > MAX_FILE_SIZE) {
    errors.file = "Document must be 10 MB or smaller";
  } else {
    errors.file = null;
  }

  // Title validation
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > 160) {
    errors.title = "Title must be 160 characters or fewer";
  } else {
    errors.title = null;
  }

  // Subject validation
  if (!subject) {
    errors.subject = "Subject is required";
  } else if (subject.length > 80) {
    errors.subject = "Subject must be 80 characters or fewer";
  } else {
    errors.subject = null;
  }

  // Description validation
  if (description.length > 1000) {
    errors.description = "Description must be 1000 characters or fewer";
  } else {
    errors.description = null;
  }

  return errors;
}

function getEditErrors(form: DocumentFormState): Record<string, string | null> {
  const errors: Record<string, string | null> = {};
  const title = form.title.trim();
  const description = form.description.trim();
  const subject = form.subject.trim();

  // Title validation
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > 160) {
    errors.title = "Title must be 160 characters or fewer";
  } else {
    errors.title = null;
  }

  // Subject validation
  if (!subject) {
    errors.subject = "Subject is required";
  } else if (subject.length > 80) {
    errors.subject = "Subject must be 80 characters or fewer";
  } else {
    errors.subject = null;
  }

  // Description validation
  if (description.length > 1000) {
    errors.description = "Description must be 1000 characters or fewer";
  } else {
    errors.description = null;
  }

  return errors;
}


function DocumentFields({
  disabled,
  fileInput,
  form,
  mode,
  onFileChange,
  onFormChange,
  errors = {},
  touched = {},
  onBlur,
  subjects,
}: {
  disabled: boolean;
  fileInput?: File | null;
  form: DocumentFormState;
  mode: "upload" | "edit";
  onFileChange?: (file: File | null) => void;
  onFormChange: (form: DocumentFormState) => void;
  errors?: Record<string, string | null>;
  touched?: Record<string, boolean>;
  onBlur?: (field: string) => void;
  subjects: SubjectItem[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {mode === "upload" && (
        <label className="flex flex-col gap-2 text-sm font-medium">
          Document file
          <Input
            accept={SUPPORTED_UPLOAD_ACCEPT}
            disabled={disabled}
            onChange={(event) => {
              onFileChange?.(event.target.files?.[0] ?? null);
              onBlur?.("file");
            }}
            onBlur={() => onBlur?.("file")}
            type="file"
          />
          {touched.file && errors.file ? (
            <span className="text-xs text-rose-500 font-semibold">{errors.file}</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {fileInput
                ? `${fileInput.name} · ${formatFileSize(fileInput.size)}`
                : `${SUPPORTED_UPLOAD_LABEL}, up to 10 MB`}
            </span>
          )}
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
          onBlur={() => onBlur?.("title")}
          placeholder="Lesson 1"
          value={form.title}
        />
        {touched.title && errors.title && (
          <span className="text-xs text-rose-500 font-semibold">{errors.title}</span>
        )}
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Subject
        <select
          className="h-9 w-full min-w-0 rounded-md border-2 border-foreground bg-background px-3 text-sm font-semibold  outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus: disabled:opacity-50"
          disabled={disabled}
          onChange={(event) =>
            onFormChange({ ...form, subject: event.target.value })
          }
          onBlur={() => onBlur?.("subject")}
          value={form.subject}
        >
          <option value="">Select subject</option>
          {subjects.map((subject) => (
            <option key={subject._id} value={subject.name}>
              {[subject.code, subject.name].filter(Boolean).join(" ")}
            </option>
          ))}
        </select>
        {touched.subject && errors.subject && (
          <span className="text-xs text-rose-500 font-semibold">{errors.subject}</span>
        )}
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Description
        <Textarea
          disabled={disabled}
          maxLength={1000}
          onChange={(event) =>
            onFormChange({ ...form, description: event.target.value })
          }
          onBlur={() => onBlur?.("description")}
          placeholder="Algebra notes"
          value={form.description}
        />
        {touched.description && errors.description && (
          <span className="text-xs text-rose-500 font-semibold">{errors.description}</span>
        )}
      </label>
    </div>
  );
}

function DocumentPreviewPage({
  document,
  previewParam,
}: {
  document: DocumentItem | null;
  previewParam: string;
}) {
  const navigate = useNavigate();
  const previewTitle = document
    ? getPreviewTitle(document.fileName || document.title)
    : getPreviewTitle(previewParam);
  const fileType = getPreviewFileType(document?.fileName || previewParam);
  const viewerSrc = (() => {
    if (!document?.fileUrl) return "";
    const ext = fileType.toLowerCase();
    if (["pptx", "ppt", "docx", "doc", "xlsx", "xls"].includes(ext)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}&embedded=true`;
    }
    return document.fileUrl;
  })();

  function closePreview() {
    navigate("/library", { replace: true });
  }

  function downloadPreview() {
    if (document?.fileUrl) {
      window.location.href = document.fileUrl;
    }
  }

  async function copyPreviewLink() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(window.location.href).catch(() => {});
  }

  return (
    <main className="fixed inset-0 z-50 flex min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-col border-b border-border bg-background">
        <div className="flex min-h-20 min-w-0 items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-start gap-4">
            <IconTooltip label="Close preview">
              <Button
                variant="ghost"
                size="icon-lg"
                className="mt-1 rounded-full"
                aria-label="Close preview"
                onClick={closePreview}
              >
                <X aria-hidden="true" />
              </Button>
            </IconTooltip>

            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex min-w-0 items-center gap-2 text-lg text-muted-foreground">
                <strong className="truncate text-sm font-medium text-foreground">
                  {previewTitle}
                </strong>
                <Badge variant="outline" className="rounded-full px-2 text-xs">
                  <span className="shrink-0 uppercase">{fileType}</span>
                </Badge>
              </div>

              <nav
                className="flex flex-wrap items-center text-muted-foreground -ml-2"
                aria-label="Preview menu"
              >
                {["File", "Edit", "View", "Help"].map((item) => (
                  <Button
                    className="text-muted-foreground hover:text-foreground h-6"
                    variant="ghost"
                    size="sm"
                    key={item}
                  >
                    {item}
                  </Button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar size="lg">
                <AvatarFallback>DA</AvatarFallback>
                <AvatarImage></AvatarImage>
              </Avatar>
              <IconTooltip label="Collaborators">
                <Button
                  variant="secondary"
                  size="icon-lg"
                  className="rounded-full"
                  aria-label="Collaborators"
                >
                  <Users aria-hidden="true" />
                </Button>
              </IconTooltip>
            </div>

            <IconTooltip label="Comments">
              <Button variant="ghost" size="icon-lg" aria-label="Comments">
                <MessageSquare aria-hidden="true" />
              </Button>
            </IconTooltip>

            <IconTooltip label="Download">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Download"
                onClick={downloadPreview}
              >
                <Download aria-hidden="true" />
              </Button>
            </IconTooltip>

            <IconTooltip label="Copy link">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Copy link"
                onClick={() => void copyPreviewLink()}
              >
                <LinkIcon aria-hidden="true" />
              </Button>
            </IconTooltip>

            <Button variant="outline" size="lg">
              Share
            </Button>
          </div>
        </div>

        {/* <div className="flex min-h-14 items-center justify-between gap-4 px-12 pb-4">
          <Button variant="ghost" className="gap-2 px-0 text-xl font-normal">
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Edit content
          </Button>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-lg px-4 text-xl font-normal"
                >
                  UTF-8
                  <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>UTF-8</DropdownMenuItem>
                <DropdownMenuItem>UTF-16</DropdownMenuItem>
                <DropdownMenuItem>ASCII</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <IconTooltip label="Fullscreen">
              <Button variant="ghost" size="icon-lg" aria-label="Fullscreen">
                <Maximize2 aria-hidden="true" />
              </Button>
            </IconTooltip>
          </div>
        </div> */}
      </header>

      <section className="min-h-0 flex-1 overflow-hidden">
        {viewerSrc ? (
          <iframe
            className="h-full w-full border-0"
            src={viewerSrc}
            title={previewTitle}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-sm text-white">
            Preview unavailable.
          </div>
        )}
      </section>
    </main>
  );
}

export default function NewLibraryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<DocumentFormState>(emptyForm);
  const editForm = useState<DocumentFormState>(emptyForm)[0];
  const setEditForm = useState<DocumentFormState>(emptyForm)[1];
  const didLoadRef = useRef(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedDocuments.map((d) => d.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    setFeedback({ tone: "info", message: `Deleting ${selectedIds.length} selected document(s)...` });
    try {
      await Promise.all(selectedIds.map((id) => deleteDocument(id)));
      setDocuments((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setFeedback({ tone: "success", message: "Selected documents deleted successfully." });
    } catch {
      setFeedback({ tone: "error", message: "Error deleting some documents. Please refresh." });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc && doc.fileUrl) {
        const a = document.createElement("a");
        a.href = doc.fileUrl;
        a.download = doc.fileName;
        a.target = "_blank";
        a.click();
      }
    });
    setFeedback({ tone: "success", message: `Downloads triggered for ${selectedIds.length} file(s).` });
  };

  const [uploadTouched, setUploadTouched] = useState<Record<string, boolean>>({});
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  const uploadErrors = useMemo(() => getUploadErrors(uploadForm, selectedFile), [uploadForm, selectedFile]);
  const editErrors = useMemo(() => getEditErrors(editForm), [editForm]);

  useEffect(() => {
    if (!isUploadOpen) {
      setUploadTouched({});
    }
  }, [isUploadOpen]);

  useEffect(() => {
    if (!isEditOpen) {
      setEditTouched({});
    }
  }, [isEditOpen]);

  // Auto-refresh library when a background upload succeeds
  const uploads = useUploadStore((state) => state.uploads);
  const isUploading = uploads.some((u) => u.status === "uploading" || u.status === "processing");
  const prevSuccessCountRef = useRef(0);

  useEffect(() => {
    const successCount = uploads.filter((u) => u.status === "success").length;
    if (successCount > prevSuccessCountRef.current) {
      void loadDocuments();
    }
    prevSuccessCountRef.current = successCount;
  }, [uploads]);

  const showSearchMode = searchQuery.trim() || subjectFilter.trim();

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject._id, subject])),
    [subjects],
  );

  const urlParams = new URLSearchParams(window.location.search);

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
      void listSubjects()
        .then(setSubjects)
        .catch((error) =>
          setFeedback({ tone: "error", message: getErrorMessage(error) }),
        );
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
          subjectId: subjectFilter,
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

    setUploadTouched({
      file: true,
      title: true,
      subject: true,
      description: true,
    });

    const isUploadValid = !Object.values(uploadErrors).some(Boolean);
    if (!isUploadValid) {
      return;
    }

    if (!selectedFile) {
      return;
    }

    // Delegate to Zustand background store with conflict check interception
    useUploadStore.getState().processIncomingUpload(
      {
        description: uploadForm.description,
        file: selectedFile,
        subject: uploadForm.subject,
        title: uploadForm.title,
      },
      documents
    );

    // Close the dialog and clear form inputs immediately
    setUploadForm(emptyForm);
    setSelectedFile(null);
    setIsUploadOpen(false);

    // Provide user feedback that it's running in the background
    setFeedback({
      tone: "success",
      message:
        "Document added to background upload queue. Track progress at the bottom right.",
    });
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDocument) {
      return;
    }

    setEditTouched({
      title: true,
      subject: true,
      description: true,
    });

    const isEditValid = !Object.values(editErrors).some(Boolean);
    if (!isEditValid) {
      return;
    }

    setIsSavingEdit(true);
    setFeedback(null);

    try {
      let subjectId = undefined;
      if (editForm.subject.trim()) {
        subjectId = await findOrCreateSubjectByName(editForm.subject.trim());
      }

      const updatedDocument = await updateDocument(editingDocument.id, {
        description: editForm.description.trim(),
        subjectId,
        title: editForm.title.trim(),
      });
      setDocuments((current) =>
        current.map((document) =>
          document.id === updatedDocument.id ? updatedDocument : document,
        ),
      );
      setFeedback({
        tone: "success",
        message: "Document updated successfully",
      });
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
      setFeedback({
        tone: "success",
        message: "Document deleted successfully",
      });
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsDeletingId(null);
    }
  }

  function getDocumentSubjectMeta(document: DocumentItem) {
    const populatedSubject =
      document.subject && typeof document.subject === "object"
        ? document.subject
        : null;
    const matchedSubject = document.subjectId
      ? subjectById.get(document.subjectId)
      : undefined;
    const subjectName =
      populatedSubject?.name ??
      matchedSubject?.name ??
      (typeof document.subject === "string" ? document.subject : "Unsorted");
    const subjectCode = populatedSubject?.code ?? matchedSubject?.code;
    const subjectColor =
      populatedSubject?.color ?? matchedSubject?.color ?? DEFAULT_SUBJECT_COLOR;

    return {
      color: subjectColor,
      label: [subjectCode, subjectName].filter(Boolean).join(" ") || "Unsorted",
    };
  }

  function openEdit(document: DocumentItem) {
    setEditingDocument(document);
    setEditForm({
      description: document.description ?? "",
      subject: (typeof document.subject === "object" ? document.subject?.name : document.subject) ?? "",
      title: document.title,
    });
    setIsEditOpen(true);
  }

  function openFile(document: DocumentItem) {
    navigate(`/library?preview=${encodeURIComponent(document.id)}`);
  }

  function openDetails(document: DocumentItem) {
    navigate(`/documents/${document.id}`);
  }

  const previewParam = urlParams.get("preview");

  if (previewParam) {
    return (
      <DocumentPreviewPage
        document={findPreviewDocument(documents, urlParams)}
        previewParam={previewParam}
      />
    );
  }

  return (
    <main className="moonlit-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
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

          <select
            aria-label="Filter by subject"
            className="h-9 w-full max-w-56 rounded-md border-2 border-foreground bg-background px-3 text-sm font-semibold "
            onChange={(event) => setSubjectFilter(event.target.value)}
            value={subjectFilter}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {[subject.code, subject.name].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </header>

        <section className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <h1 className="moonlit-title text-3xl font-semibold tracking-tight md:text-5xl">
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
                    Document file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {feedback && (
            <div
              className={`moonlit-card tone-surface px-4 py-3 text-sm ${feedback.tone === "error" ? "tone-coral" : feedback.tone === "success" ? "tone-emerald" : "tone-sapphire"}`}
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
            <div className="moonlit-card tone-surface tone-cyan flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UploadCloud aria-hidden="true" />
                Uploading, extracting text, and indexing for RAG
              </div>
              <CelestialProgress tone="cyan" />
            </div>
          )}

          <div className="moonlit-card moonlit-table tone-surface tone-sapphire overflow-x-auto overflow-y-hidden relative">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary size-4 accent-primary cursor-pointer"
                      checked={sortedDocuments.length > 0 && selectedIds.length === sortedDocuments.length}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
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
                        <TableCell className="w-12 px-4 text-center">
                          <Skeleton className="size-4 rounded mx-auto" />
                        </TableCell>
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
                      <TableRow key={document.id} className={selectedIds.includes(document.id) ? "bg-[#ECEFE7]/35" : ""}>
                        <TableCell className="w-12 px-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary size-4 accent-primary cursor-pointer"
                            checked={selectedIds.includes(document.id)}
                            onChange={() => toggleSelectOne(document.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            className="flex min-w-0 items-center gap-3 text-left group"
                            onClick={() => openFile(document)}
                            type="button"
                          >
                            <div className={`admin-icon-badge ${getFileBadgeClass(document.fileName)} flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-[1.02]`}>
                              <FileText aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {document.fileName}
                              </div>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const subjectMeta = getDocumentSubjectMeta(document);
                            return (
                              <span
                                className="inline-flex max-w-[14rem] items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold normal-case text-foreground"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${subjectMeta.color} 14%, transparent)`,
                                  borderColor: `color-mix(in srgb, ${subjectMeta.color} 55%, transparent)`,
                                }}
                              >
                                <span
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: subjectMeta.color }}
                                />
                                <span className="truncate">{subjectMeta.label}</span>
                              </span>
                            );
                          })()}
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
                                className="rounded-lg"
                              >
                                <MoreHorizontal aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                              <DropdownMenuItem
                                onSelect={() => openDetails(document)}
                              >
                                <FileText />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => openFile(document)}
                              >
                                <ExternalLink />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  window.location.href = document.fileUrl;
                                }}
                              >
                                <Download />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => openEdit(document)}
                              >
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
                <BookOpenText
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1">
                  <h2 className="font-medium">No documents found</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Upload a PDF to store it in Cloudinary and prepare it for AI
                    chat.
                  </p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <UploadCloud data-icon="inline-start" aria-hidden="true" />
                  Upload document
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleUpload}
          >
            <DialogHeader>
              <DialogTitle>Upload document</DialogTitle>
              <DialogDescription>
                Study documents are stored in Cloudinary, parsed, and indexed for AI chat.
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="flex-grow py-2">
              <DocumentFields
                disabled={isUploading}
                fileInput={selectedFile}
                form={uploadForm}
                mode="upload"
                onFileChange={setSelectedFile}
                onFormChange={setUploadForm}
                errors={uploadErrors}
                touched={uploadTouched}
                onBlur={(field) => setUploadTouched((prev) => ({ ...prev, [field]: true }))}
                subjects={subjects}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button disabled={isUploading} type="submit" className="w-full sm:w-auto">
                <UploadCloud data-icon="inline-start" aria-hidden="true" />
                {isUploading ? <CelestialInlineLoader label="Uploading..." /> : "Upload document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                errors={editErrors}
                touched={editTouched}
                onBlur={(field) => setEditTouched((prev) => ({ ...prev, [field]: true }))}
                subjects={subjects}
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
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border/80 rounded-2xl shadow-xl px-5 py-3 flex items-center gap-4 text-xs font-semibold">
          <span className="text-muted-foreground">
            Selected <span className="text-primary font-bold">{selectedIds.length}</span> item(s)
          </span>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="outline" className="rounded-xl flex items-center gap-1.5" onClick={handleBulkDownload}>
            <Download className="size-3.5" />
            Download
          </Button>
          <Button size="sm" variant="destructive" className="rounded-xl flex items-center gap-1.5" disabled={isBulkDeleting} onClick={handleBulkDelete}>
            <Trash2 className="size-3.5" />
            {isBulkDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setSelectedIds([])}>
            Cancel
          </Button>
        </div>
      )}
    </main>
  );
}
