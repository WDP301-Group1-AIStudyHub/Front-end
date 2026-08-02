import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Pencil,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/pages/admin/adminPageUtils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteDocument,
  downloadDocumentFile,
  getDocument,
  setDocumentStar,
  updateDocument,
} from "../services/documentApi";
import { listSubjects, type SubjectItem } from "../services/subjectApi";
import DocumentShareDialog from "../components/documents/DocumentShareDialog";
import SharedDocumentSubjectDialog from "../components/documents/SharedDocumentSubjectDialog";
import { getStoredUser } from "../services/authStorage";
import type { DocumentDetail, DocumentSubject } from "../types/document";

function formatDate(value?: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section className="p-5">
      <h2 className="text-lg font-black">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div className="min-w-0" key={item.label}>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm">{item.value || "None"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubjectProfileOpen, setIsSubjectProfileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "PRIVATE">(
    "PRIVATE",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Document id is missing");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getDocument(id), listSubjects().catch(() => [])])
      .then(([nextDocument, nextSubjects]) => {
        if (cancelled) return;
        setDocument(nextDocument);
        setSubjects(nextSubjects);
      })
      .catch((caughtError) => {
        if (cancelled) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load document",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const subject =
    document?.subject && typeof document.subject === "object"
      ? (document.subject as DocumentSubject)
      : null;
  const subjectLabel = subject
    ? [subject.code, subject.name].filter(Boolean).join(" ")
    : typeof document?.subject === "string"
      ? document.subject
      : "Unsorted";

  const accessRole =
    document?.accessRole ||
    (currentUser &&
    (document?.ownerId === currentUser.id ||
      document?.uploadedBy === currentUser.id)
      ? "OWNER"
      : "VIEWER");
  const canEdit = accessRole === "OWNER" || accessRole === "EDITOR";
  const canManage = accessRole === "OWNER";
  const canClassifyShared = Boolean(
    document?.isShared && accessRole !== "OWNER",
  );

  function downloadDocument() {
    if (document) {
      void downloadDocumentFile(document);
    }
  }

  function openEdit() {
    if (!document) return;
    setEditTitle(document.title);
    setEditDescription(document.description ?? "");
    setEditSubjectId(document.subjectId ?? subject?._id ?? "");
    setEditVisibility(document.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE");
    setIsEditOpen(true);
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document || !id) return;
    const title = editTitle.trim();
    if (!title) {
      setError("Title is required");
      return;
    }

    setIsSavingEdit(true);
    setError(null);
    try {
      const updated = await updateDocument(id, {
        description: editDescription.trim(),
        title,
        ...(canManage
          ? {
              subjectId: editSubjectId || undefined,
              visibility: editVisibility,
            }
          : {}),
      });
      setDocument(updated as DocumentDetail);
      setIsEditOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update document",
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleDelete() {
    if (!document || !id) return;
    setIsDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!document || !id) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteDocument(id);
      navigate("/library");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete document",
      );
      setIsDeleting(false);
    }
  }

  async function toggleStar() {
    if (!document || !id) return;
    const nextStarred = !document.isStarred;
    setIsStarring(true);
    setDocument((current) =>
      current ? { ...current, isStarred: nextStarred } : current,
    );
    try {
      const updated = await setDocumentStar(id, nextStarred);
      setDocument(updated as DocumentDetail);
    } catch (caughtError) {
      setDocument((current) =>
        current ? { ...current, isStarred: document.isStarred } : current,
      );
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update starred state",
      );
    } finally {
      setIsStarring(false);
    }
  }

  return (
    <PageShell>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="secondary">
            <Link to={document?.isShared ? "/library?view=shared" : "/library"}>
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back to My Document
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl break-words">
            {document?.title || "Document detail"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!document || isStarring}
            onClick={toggleStar}
            type="button"
            variant="secondary"
          >
            <Star
              data-icon="inline-start"
              aria-hidden="true"
              className={
                document?.isStarred
                  ? "fill-amber-400 text-amber-500"
                  : undefined
              }
            />
            {document?.isStarred ? "Unstar" : "Star"}
          </Button>
          {canManage && (
            <Button
              disabled={!document}
              onClick={() => setIsShareOpen(true)}
              type="button"
              variant="secondary"
            >
              <Users data-icon="inline-start" aria-hidden="true" />
              Share
            </Button>
          )}
          {canClassifyShared && (
            <Button
              disabled={!document}
              onClick={() => setIsSubjectProfileOpen(true)}
              type="button"
              variant="secondary"
            >
              <BookOpen data-icon="inline-start" aria-hidden="true" />
              Assign subject
            </Button>
          )}
          {canEdit && (
            <Button
              disabled={!document}
              onClick={openEdit}
              type="button"
              variant="secondary"
            >
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Edit details
            </Button>
          )}
          <Button
            disabled={!document?.fileUrl}
            onClick={downloadDocument}
            type="button"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            Download
          </Button>
          {canManage && (
            <Button
              disabled={!document || isDeleting}
              onClick={handleDelete}
              type="button"
              variant="destructive"
            >
              <Trash2 data-icon="inline-start" aria-hidden="true" />
              {isDeleting ? "Moving..." : "Move to trash"}
            </Button>
          )}
        </div>
      </header>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <section className="p-5" key={index}>
              <Skeleton className="h-6 w-48" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((__, itemIndex) => (
                  <Skeleton className="h-10" key={itemIndex} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {!isLoading && document ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard
              title="Document information"
              items={[
                { label: "Title", value: document.title },
                {
                  label: "Description",
                  value: document.description || "No description",
                },
                { label: "Subject", value: subjectLabel },
                {
                  label: "Visibility",
                  value: document.visibility || "PRIVATE",
                },
                { label: "Status", value: document.status || "ACTIVE" },
                { label: "Created", value: formatDate(document.createdAt) },
                { label: "Updated", value: formatDate(document.updatedAt) },
                { label: "Views", value: document.totalViews ?? 0 },
                { label: "Downloads", value: document.totalDownloads ?? 0 },
              ]}
            />
            <InfoCard
              title="File information"
              items={[
                {
                  label: "Original name",
                  value: document.originalFileName || document.fileName,
                },
                {
                  label: "Stored name",
                  value: document.storedFileName || document.fileName,
                },
                {
                  label: "File type",
                  value: document.mimeType || document.fileType || "Unknown",
                },
                {
                  label: "File size",
                  value: formatFileSize(document.fileSize),
                },
                {
                  label: "Extraction",
                  value: document.extractionStatus || "Unknown",
                },
                { label: "Chunks", value: document.totalChunks ?? 0 },
                {
                  label: "Last indexed",
                  value: formatDate(document.lastIndexedAt),
                },
              ]}
            />
          </div>
        </>
      ) : null}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form className="flex flex-col gap-4" onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>Edit document</DialogTitle>
            </DialogHeader>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Title
              <Input
                disabled={isSavingEdit}
                maxLength={160}
                onChange={(event) => setEditTitle(event.target.value)}
                value={editTitle}
              />
            </label>

            {canManage ? (
              <div className="flex flex-col gap-2 text-sm font-semibold">
                <span>Subject</span>
                <Select
                  disabled={isSavingEdit}
                  onValueChange={(val) =>
                    setEditSubjectId(val === "keep" ? "" : val)
                  }
                  value={editSubjectId || "keep"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep current subject</SelectItem>
                    {subjects.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {[item.code, item.name].filter(Boolean).join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Description
              <Textarea
                disabled={isSavingEdit}
                maxLength={1000}
                onChange={(event) => setEditDescription(event.target.value)}
                value={editDescription}
              />
            </label>

            {canManage ? (
              <div className="flex flex-col gap-2 text-sm font-semibold">
                <span>Visibility</span>
                <Select
                  disabled={isSavingEdit}
                  onValueChange={(val) =>
                    setEditVisibility(val === "PUBLIC" ? "PUBLIC" : "PRIVATE")
                  }
                  value={editVisibility}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                disabled={isSavingEdit}
                type="button"
                variant="secondary"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={isSavingEdit} type="submit">
                {isSavingEdit ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DocumentShareDialog
        document={document}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
      />
      <SharedDocumentSubjectDialog
        document={document}
        open={isSubjectProfileOpen}
        subjects={subjects}
        onOpenChange={setIsSubjectProfileOpen}
        onUpdated={(updatedDocument) =>
          setDocument(updatedDocument as DocumentDetail)
        }
      />
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move "{document?.title}" to trash? You
              can restore it within 30 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
