import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpFromLineIcon,
  BookOpen,
  BookOpenText,
  ChevronDownIcon,
  Download,
  ExternalLink,
  FileIcon,
  FileText,
  MoreHorizontal,
  Pencil,
  SearchIcon,
  Star,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  InputGroupButton,
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
} from "@/components/shared/CelestialLoading";

import {
  deleteDocument,
  downloadDocumentFile,
  listDocuments,
  listSharedWithMe,
  restoreDocument,
  searchDocuments,
  setDocumentStar,
  updateDocument,
} from "@/services/documentApi";
import { findOrCreateSubjectByName, listSubjects } from "@/services/subjectApi";
import type { SubjectItem } from "@/services/subjectApi";
import { useUploadStore } from "@/store/useUploadStore";
import { getStoredUser } from "@/services/authStorage";
import type { DocumentItem } from "@/types/document";
import DocumentShareDialog from "@/components/documents/DocumentShareDialog";
import SharedDocumentSubjectDialog from "@/components/documents/SharedDocumentSubjectDialog";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/shared/IconTile";
import DocumentPreviewPage from "@/pages/DocumentPreviewPage";

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
const DOCUMENT_FILE_TYPES = ["PDF", "DOCX", "PPTX", "XLSX", "TXT", "MD"];

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
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

function getDocumentFileType(document: DocumentItem): string {
  const extension = getFileExtension(document.fileName || document.title);

  if (extension) {
    return extension.slice(1).toUpperCase();
  }

  return document.fileType.split("/").pop()?.toUpperCase() || "OTHER";
}

function getDocumentProcessingStatus(
  document: DocumentItem,
): "ready" | "processing" | "failed" {
  const status = [document.extractionStatus, document.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (status.includes("fail") || status.includes("error")) {
    return "failed";
  }

  if (
    status.includes("pending") ||
    status.includes("processing") ||
    status.includes("uploading") ||
    status.includes("extracting") ||
    status.includes("indexing")
  ) {
    return "processing";
  }

  return "ready";
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

function getEditErrors(
  form: DocumentFormState,
  requireSubject = true,
): Record<string, string | null> {
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
  if (!requireSubject) {
    errors.subject = null;
  } else if (!subject) {
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
  showSubject = true,
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
  showSubject?: boolean;
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
            <span className="text-xs text-rose-500 font-semibold">
              {errors.file}
            </span>
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
          <span className="text-xs text-rose-500 font-semibold">
            {errors.title}
          </span>
        )}
      </label>

      {showSubject ? (
        <div className="flex flex-col gap-2 text-sm font-medium">
          <span>Subject</span>
          <Select
            disabled={disabled}
            onValueChange={(val) =>
              onFormChange({
                ...form,
                subject: val === "unassigned" ? "" : val,
              })
            }
            value={form.subject || "unassigned"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="unassigned">Select subject</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {[s.code, s.name].filter(Boolean).join(" ")}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {touched.subject && errors.subject && (
            <span className="text-xs text-rose-500 font-semibold">
              {errors.subject}
            </span>
          )}
        </div>
      ) : null}

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
          <span className="text-xs text-rose-500 font-semibold">
            {errors.description}
          </span>
        )}
      </label>
    </div>
  );
}

export default function NewLibraryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const libraryView = searchParams.get("view") === "shared" ? "shared" : "mine";
  const searchQueryParam = searchParams.get("q") ?? "";
  const currentUser = getStoredUser();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isStarringId, setIsStarringId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sharingDocument, setSharingDocument] = useState<DocumentItem | null>(
    null,
  );
  const [classifyingDocument, setClassifyingDocument] =
    useState<DocumentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<DocumentFormState>(emptyForm);
  const [editForm, setEditForm] = useState<DocumentFormState>(emptyForm);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    setSearchQuery(searchQueryParam);
    setSelectedIds([]);
  }, [searchQueryParam]);

  const getAccessRole = (document: DocumentItem) => {
    if (currentUser?.role === "admin") return "OWNER";
    if (document.accessRole) return document.accessRole;
    if (
      currentUser &&
      (document.ownerId === currentUser.id ||
        document.uploadedBy === currentUser.id)
    ) {
      return "OWNER";
    }
    return "VIEWER";
  };

  const canEditDocument = (document: DocumentItem) => {
    const accessRole = getAccessRole(document);
    return accessRole === "OWNER" || accessRole === "EDITOR";
  };

  const canManageDocument = (document: DocumentItem) =>
    getAccessRole(document) === "OWNER";

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = visibleDocuments.map((document) => document.id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedIds.includes(id),
    );

    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const selectedDocuments = documents.filter((document) =>
      selectedIds.includes(document.id),
    );
    const deletableDocuments = selectedDocuments.filter(canManageDocument);

    if (deletableDocuments.length !== selectedDocuments.length) {
      setFeedback({
        tone: "error",
        message: "Only document owners can delete selected documents.",
      });
      return;
    }

    setIsBulkDeleting(true);
    setFeedback({
      tone: "info",
      message: `Moving ${selectedIds.length} selected document(s) to trash...`,
    });
    try {
      const results = await Promise.all(
        deletableDocuments.map((document) => deleteDocument(document.id)),
      );
      setDocuments((current) =>
        current.filter(
          (item) =>
            !deletableDocuments.some((document) => document.id === item.id),
        ),
      );
      setSelectedIds([]);
      const pendingCleanup = results.filter(
        (result) => result.ragStatus === "DELETE_PENDING",
      ).length;
      setFeedback({
        tone: pendingCleanup > 0 ? "info" : "success",
        message:
          pendingCleanup > 0
            ? `Selected documents moved to trash; AI cleanup is retrying for ${pendingCleanup}.`
            : "Selected documents moved to trash.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Error moving some documents to trash. Please refresh.",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc) {
        void downloadDocumentFile(doc);
      }
    });
    setFeedback({
      tone: "success",
      message: `Downloads triggered for ${selectedIds.length} file(s).`,
    });
  };

  const handleToggleStar = async (document: DocumentItem) => {
    const nextStarred = !document.isStarred;
    setIsStarringId(document.id);
    setDocuments((current) =>
      current.map((item) =>
        item.id === document.id ? { ...item, isStarred: nextStarred } : item,
      ),
    );

    try {
      const updatedDocument = await setDocumentStar(document.id, nextStarred);
      setDocuments((current) =>
        current.map((item) =>
          item.id === updatedDocument.id ? updatedDocument : item,
        ),
      );
    } catch (error) {
      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id
            ? { ...item, isStarred: Boolean(document.isStarred) }
            : item,
        ),
      );
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsStarringId(null);
    }
  };

  const [uploadTouched, setUploadTouched] = useState<Record<string, boolean>>(
    {},
  );
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  const uploadErrors = useMemo(
    () => getUploadErrors(uploadForm, selectedFile),
    [uploadForm, selectedFile],
  );
  const canEditSubject = editingDocument
    ? canManageDocument(editingDocument)
    : true;
  const editErrors = useMemo(
    () => getEditErrors(editForm, canEditSubject),
    [canEditSubject, editForm],
  );

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
  const isUploading = uploads.some(
    (u) => u.status === "uploading" || u.status === "processing",
  );
  const prevSuccessCountRef = useRef(0);

  useEffect(() => {
    const successCount = uploads.filter((u) => u.status === "success").length;
    if (successCount > prevSuccessCountRef.current) {
      void loadDocuments();
    }
    prevSuccessCountRef.current = successCount;
  }, [uploads]);

  const showSearchMode = Boolean(searchQuery.trim() || subjectFilter.trim());
  const hasActiveFilters = Boolean(
    showSearchMode || semesterFilter || fileTypeFilter || statusFilter,
  );

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject._id, subject])),
    [subjects],
  );

  const uniqueSemesters = useMemo(
    () =>
      Array.from(
        new Set(subjects.map((s) => s.semester).filter(Boolean)),
      ).sort(),
    [subjects],
  );

  const urlParams = searchParams;

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime(),
      ),
    [documents],
  );

  const visibleDocuments = useMemo(
    () =>
      sortedDocuments.filter((document) => {
        if (
          fileTypeFilter &&
          getDocumentFileType(document) !== fileTypeFilter
        ) {
          return false;
        }

        if (
          statusFilter &&
          getDocumentProcessingStatus(document) !== statusFilter
        ) {
          return false;
        }

        if (semesterFilter) {
          const documentSubjectId =
            typeof document.subject === "object"
              ? document.subject?._id
              : document.subjectId;
          const subject = documentSubjectId
            ? subjectById.get(documentSubjectId)
            : null;
          if (subject?.semester !== semesterFilter) {
            return false;
          }
        }

        return true;
      }),
    [
      fileTypeFilter,
      sortedDocuments,
      statusFilter,
      semesterFilter,
      subjectById,
    ],
  );

  const allVisibleSelected =
    visibleDocuments.length > 0 &&
    visibleDocuments.every((document) => selectedIds.includes(document.id));

  function clearFilters() {
    setSearchQuery("");
    setSubjectFilter("");
    setSemesterFilter("");
    setFileTypeFilter("");
    setStatusFilter("");
    setSelectedIds([]);
  }

  async function loadDocuments() {
    setIsLoading(true);
    setFeedback(null);

    try {
      const nextDocuments =
        libraryView === "shared"
          ? await listSharedWithMe()
          : (await listDocuments()).filter((document) => !document.isShared);
      setDocuments(nextDocuments);
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void listSubjects()
        .then(setSubjects)
        .catch((error) =>
          setFeedback({ tone: "error", message: getErrorMessage(error) }),
        );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      if (!showSearchMode) {
        void loadDocuments();
        return;
      }

      setIsLoading(true);
      setFeedback(null);

      try {
        const results =
          libraryView === "shared"
            ? (await listSharedWithMe()).filter((document) => {
                const keyword = searchQuery.trim().toLowerCase();
                const matchesKeyword =
                  !keyword ||
                  document.title.toLowerCase().includes(keyword) ||
                  document.fileName.toLowerCase().includes(keyword) ||
                  document.description?.toLowerCase().includes(keyword);
                const documentSubjectId =
                  typeof document.subject === "object"
                    ? document.subject?._id
                    : document.subjectId;
                return (
                  matchesKeyword &&
                  (!subjectFilter || documentSubjectId === subjectFilter)
                );
              })
            : (
                await searchDocuments({
                  keyword: searchQuery,
                  subjectId: subjectFilter,
                })
              ).filter((document) => !document.isShared);
        setDocuments(results);
      } catch (error) {
        setFeedback({ tone: "error", message: getErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [libraryView, searchQuery, showSearchMode, subjectFilter]);

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
      documents,
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
      subject: canEditSubject,
      description: true,
    });

    const isEditValid = !Object.values(editErrors).some(Boolean);
    if (!isEditValid) {
      return;
    }

    setIsSavingEdit(true);
    setFeedback(null);

    try {
      let subjectId = canEditSubject ? editingDocument.subjectId : undefined;
      const currentSubjectName =
        typeof editingDocument.subject === "object"
          ? editingDocument.subject?.name
          : editingDocument.subject;
      if (
        canEditSubject &&
        editForm.subject.trim() &&
        editForm.subject.trim().toLowerCase() !==
          (currentSubjectName ?? "").trim().toLowerCase()
      ) {
        subjectId = await findOrCreateSubjectByName(editForm.subject.trim());
      }

      const updatedDocument = await updateDocument(editingDocument.id, {
        description: editForm.description.trim(),
        ...(canEditSubject ? { subjectId } : {}),
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
        message: `Choose Delete again to move "${document.title}" to trash.`,
      });
      return;
    }

    setIsDeletingId(document.id);
    setFeedback(null);

    try {
      const deleteResult = await deleteDocument(document.id);
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );
      setPendingDeleteId(null);
      setFeedback({
        tone: "success",
        message: deleteResult.warning || "Document moved to trash.",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const restored = await restoreDocument(document.id);
              setDocuments((current) =>
                current.some((item) => item.id === restored.id)
                  ? current
                  : [restored, ...current],
              );
              setFeedback({
                tone: "success",
                message: "Document restored successfully.",
              });
            } catch (error) {
              setFeedback({ tone: "error", message: getErrorMessage(error) });
            }
          },
        },
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
    // const subjectName =
    //   populatedSubject?.name ??
    //   matchedSubject?.name ??
    //   (typeof document.subject === "string" ? document.subject : "Unsorted");
    const subjectCode = populatedSubject?.code ?? matchedSubject?.code;
    const subjectColor =
      populatedSubject?.color ?? matchedSubject?.color ?? DEFAULT_SUBJECT_COLOR;

    return {
      color: subjectColor,
      label: subjectCode ? `${subjectCode}` : null,
    };
  }

  function getAccessPresentation(document: DocumentItem) {
    const accessRole = getAccessRole(document);

    if (accessRole === "OWNER") {
      return {
        className: "border-primary/25 bg-primary/10 text-primary",
        label: "Owner",
      };
    }

    if (accessRole === "EDITOR") {
      return {
        className: "border-amber-300 bg-amber-50 text-amber-700",
        label: "Editor",
      };
    }

    return {
      className: "border-slate-300 bg-slate-50 text-slate-700",
      label: "Viewer",
    };
  }

  function getAccessSubLabel(document: DocumentItem) {
    if (document.isShared && document.sharedBy?.fullName) {
      return `Shared by ${document.sharedBy.fullName}`;
    }

    if (getAccessRole(document) === "OWNER") {
      return "Owned by you";
    }

    return document.sharedBy?.email ?? "Shared access";
  }

  function openEdit(document: DocumentItem) {
    setEditingDocument(document);
    setEditForm({
      description: document.description ?? "",
      subject:
        (typeof document.subject === "object"
          ? document.subject?.name
          : document.subject) ?? "",
      title: document.title,
    });
    setIsEditOpen(true);
  }

  function handleSharedProfileUpdated(updatedDocument: DocumentItem) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document,
      ),
    );
    setFeedback({
      tone: "success",
      message: "Shared document subject updated",
    });
  }

  function openFile(document: DocumentItem) {
    navigate(`/library?preview=${encodeURIComponent(document.id)}`);
  }

  function openDetails(document: DocumentItem) {
    navigate(`/documents/${document.id}`);
  }

  function openShare(document: DocumentItem) {
    setSharingDocument(document);
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
    <PageShell variant={"default"}>
      <section className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-medium">My Documents</h1>
              {/* <Badge className="rounded-full px-2.5 py-1" variant="secondary">
                {documents.length} total
              </Badge>
              <Badge className="rounded-full px-2.5 py-1" variant="outline">
                {visibleDocuments.length} visible
              </Badge> */}
            </div>

            {/* <Tabs
              aria-label="My Document view"
              onValueChange={(value) =>
                setLibraryView(value as "mine" | "shared")
              }
              value={libraryView}
            >
              <TabsList>
                <TabsTrigger value="mine">
                  <FileText data-icon="inline-start" aria-hidden="true" />
                  My documents
                </TabsTrigger>
                <TabsTrigger value="shared">
                  <Users data-icon="inline-start" aria-hidden="true" />
                  Shared with me
                </TabsTrigger>
              </TabsList>
            </Tabs> */}
          </div>

          {libraryView === "mine" ? (
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
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-y border-border/70 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 -mb-1 w-full">
            <InputGroup className="min-w-65 max-w-sm flex-1 bg-background">
              <InputGroupAddon align="inline-start">
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search documents"
                className="h-full min-w-0 px-1 text-sm"
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedIds([]);
                }}
                placeholder="Search by title, file name, or description"
                type="search"
                value={searchQuery}
              />
              {searchQuery && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedIds([]);
                    }}
                    size="icon-xs"
                  >
                    <X aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>

            <div className="flex items-center gap-2 flex-nowrap shrink-0">
              <Select
                onValueChange={(val) => {
                  setSubjectFilter(val === "all" ? "" : val);
                  setSelectedIds([]);
                }}
                value={subjectFilter || "all"}
              >
                <SelectTrigger
                  aria-label="Filter by subject"
                  className="h-9 min-w-40 flex-1 sm:flex-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {[subject.code, subject.name].filter(Boolean).join(" ")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => {
                  setSemesterFilter(val === "all" ? "" : val);
                  setSelectedIds([]);
                }}
                value={semesterFilter || "all"}
              >
                <SelectTrigger
                  aria-label="Filter by semester"
                  className="h-9 min-w-32 flex-1 sm:flex-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All semesters</SelectItem>
                    {uniqueSemesters.map((sem) => (
                      <SelectItem key={sem as string} value={sem as string}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => {
                  setFileTypeFilter(val === "all" ? "" : val);
                  setSelectedIds([]);
                }}
                value={fileTypeFilter || "all"}
              >
                <SelectTrigger
                  aria-label="Filter by file type"
                  className="h-9 min-w-32 flex-1 sm:flex-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All file types</SelectItem>
                    {DOCUMENT_FILE_TYPES.map((fileType) => (
                      <SelectItem key={fileType} value={fileType}>
                        {fileType}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => {
                  setStatusFilter(val === "all" ? "" : val);
                  setSelectedIds([]);
                }}
                value={statusFilter || "all"}
              >
                <SelectTrigger
                  aria-label="Filter by processing status"
                  className="h-9 min-w-32 flex-1 sm:flex-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                variant="outline"
                className={`${!hasActiveFilters ? "hidden" : ""}`}
              >
                <X data-icon="inline-start" aria-hidden="true" />
                Clear filters
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span aria-live="polite">
              {visibleDocuments.length} of {documents.length} documents
            </span>
          </div>
        </div>

        {feedback && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
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
            {feedback.action ? (
              <Button
                onClick={() => void feedback.action?.onClick()}
                size="sm"
                type="button"
                variant="outline"
              >
                {feedback.action.label}
              </Button>
            ) : null}
          </div>
        )}

        {isUploading && (
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UploadCloud aria-hidden="true" />
              Uploading, extracting text, and indexing for RAG
            </div>
            <CelestialProgress tone="cyan" />
          </div>
        )}

        <div className="overflow-x-auto overflow-y-hidden relative">
          <Table className="min-w-130 md:min-w-190 lg:min-w-245">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-4 text-center">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all visible documents"
                  />
                </TableHead>
                <TableHead className="text-[13px]">Name</TableHead>
                <TableHead className="hidden md:table-cell text-[13px]">
                  Subject
                </TableHead>
                <TableHead className="hidden md:table-cell text-[13px]">
                  Access
                </TableHead>
                <TableHead className="hidden lg:table-cell text-[13px]">
                  Size
                </TableHead>
                <TableHead className="hidden lg:table-cell text-[13px]">
                  Updated
                </TableHead>
                <TableHead className="text-right"></TableHead>
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
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto size-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : visibleDocuments.map((document) => (
                    <TableRow
                      key={document.id}
                      className={
                        selectedIds.includes(document.id) ? "bg-accent/40" : ""
                      }
                    >
                      <TableCell className="w-12 px-4 text-center">
                        <Checkbox
                          checked={selectedIds.includes(document.id)}
                          onCheckedChange={() => toggleSelectOne(document.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <Button
                            aria-label={
                              document.isStarred
                                ? "Unstar document"
                                : "Star document"
                            }
                            className="shrink-0 rounded-lg"
                            disabled={isStarringId === document.id}
                            onClick={() => void handleToggleStar(document)}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <Star
                              aria-hidden="true"
                              className={
                                document.isStarred
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-muted-foreground"
                              }
                            />
                          </Button>
                          <button
                            className="flex min-w-0 items-center gap-3 text-left group outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            onClick={() => openFile(document)}
                            type="button"
                          >
                            <IconTile fileName={document.fileName} size="sm" />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {document.title || document.fileName}
                              </div>
                              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                <span className="truncate text-xs text-muted-foreground">
                                  {document.fileName}
                                </span>
                                {document.isShared && (
                                  <Badge
                                    className="h-5 rounded-full px-1.5 text-[0.65rem]"
                                    variant="secondary"
                                  >
                                    Shared
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(() => {
                          const subjectMeta = getDocumentSubjectMeta(document);
                          return (
                            <span
                              className="inline-flex max-w-56 items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold normal-case text-foreground"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${subjectMeta.color} 14%, transparent)`,
                                borderColor: `color-mix(in srgb, ${subjectMeta.color} 55%, transparent)`,
                              }}
                            >
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: subjectMeta.color }}
                              />
                              <span className="truncate">
                                {subjectMeta.label}
                              </span>
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(() => {
                          const access = getAccessPresentation(document);
                          return (
                            <div className="flex min-w-0 flex-col gap-1">
                              <Badge
                                className={`w-fit rounded-full border px-2 py-0.5 ${access.className}`}
                                variant="outline"
                              >
                                {access.label}
                              </Badge>
                              <span className="max-w-40 truncate text-xs text-muted-foreground">
                                {getAccessSubLabel(document)}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(document.fileSize)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(document.updatedAt ?? document.createdAt)}
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
                                void downloadDocumentFile(document);
                              }}
                            >
                              <Download />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={isStarringId === document.id}
                              onSelect={() => {
                                void handleToggleStar(document);
                              }}
                            >
                              <Star
                                className={
                                  document.isStarred
                                    ? "fill-amber-400 text-amber-500"
                                    : ""
                                }
                              />
                              {document.isStarred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            {document.isShared &&
                              !canManageDocument(document) && (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setClassifyingDocument(document)
                                  }
                                >
                                  <BookOpen />
                                  Assign subject
                                </DropdownMenuItem>
                              )}
                            {canManageDocument(document) && (
                              <DropdownMenuItem
                                onSelect={() => openShare(document)}
                              >
                                <Users />
                                Share
                              </DropdownMenuItem>
                            )}
                            {canEditDocument(document) && (
                              <>
                                <DropdownMenuItem
                                  onSelect={() => openEdit(document)}
                                >
                                  <Pencil />
                                  Edit details
                                </DropdownMenuItem>
                                {canManageDocument(document) && (
                                  <DropdownMenuSeparator />
                                )}
                                {canManageDocument(document) && (
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
                                      ? "Confirm move"
                                      : "Move to trash"}
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!isLoading && visibleDocuments.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border p-8 text-center">
              <BookOpenText
                className="text-muted-foreground"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1">
                <h2 className="font-medium">No documents found</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "No documents match the current search and filters."
                    : "Upload a document to store it in Cloudinary and prepare it for AI chat."}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  <X data-icon="inline-start" aria-hidden="true" />
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setIsUploadOpen(true)}>
                  <UploadCloud data-icon="inline-start" aria-hidden="true" />
                  Upload document
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-125">
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleUpload}
          >
            <DialogHeader>
              <DialogTitle>Upload document</DialogTitle>
              <DialogDescription>
                Documents are stored in Cloudinary, parsed, and indexed for AI
                chat.
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="grow py-2">
              <DocumentFields
                disabled={isUploading}
                fileInput={selectedFile}
                form={uploadForm}
                mode="upload"
                onFileChange={setSelectedFile}
                onFormChange={setUploadForm}
                errors={uploadErrors}
                touched={uploadTouched}
                onBlur={(field) =>
                  setUploadTouched((prev) => ({ ...prev, [field]: true }))
                }
                subjects={subjects}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button
                disabled={isUploading}
                type="submit"
                className="w-full sm:w-auto"
              >
                <UploadCloud data-icon="inline-start" aria-hidden="true" />
                {isUploading ? (
                  <CelestialInlineLoader label="Uploading..." />
                ) : (
                  "Upload document"
                )}
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
                onBlur={(field) =>
                  setEditTouched((prev) => ({ ...prev, [field]: true }))
                }
                showSubject={canEditSubject}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border/80 rounded-2xl shadow-sm px-5 py-3 flex items-center gap-4 text-xs font-semibold">
          <span className="text-muted-foreground">
            Selected{" "}
            <span className="text-primary font-bold">{selectedIds.length}</span>{" "}
            item(s)
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl flex items-center gap-1.5"
            onClick={handleBulkDownload}
          >
            <Download className="size-3.5" />
            Download
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-xl flex items-center gap-1.5"
            disabled={
              isBulkDeleting ||
              selectedIds.some((id) => {
                const document = documents.find((item) => item.id === id);
                return document ? !canManageDocument(document) : false;
              })
            }
            onClick={handleBulkDelete}
          >
            <Trash2 className="size-3.5" />
            {isBulkDeleting ? "Moving..." : "Move to trash"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => setSelectedIds([])}
          >
            Cancel
          </Button>
        </div>
      )}
      <DocumentShareDialog
        document={sharingDocument}
        open={Boolean(sharingDocument)}
        onOpenChange={(open) => {
          if (!open) setSharingDocument(null);
        }}
      />
      <SharedDocumentSubjectDialog
        document={classifyingDocument}
        open={Boolean(classifyingDocument)}
        subjects={subjects}
        onOpenChange={(open) => {
          if (!open) setClassifyingDocument(null);
        }}
        onUpdated={handleSharedProfileUpdated}
      />
    </PageShell>
  );
}
