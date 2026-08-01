import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  BookMarked,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Grid2X2,
  Info,
  LayoutList,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { downloadDocumentFile, getDocumentDownloadUrl } from "../services/documentApi";
import { useToast } from "../hooks/useToast";
import {
  addSubjectMember,
  addSubjectTeamMember,
  createSubject,
  createSubjectDocumentAccess,
  createSubjectTeam,
  deleteSubject,
  deleteSubjectTeam,
  getSubject,
  listSubjectDocumentAccess,
  listSubjectDocuments,
  listSubjectMembers,
  listSubjects,
  listSubjectTeams,
  removeSubjectMember,
  removeSubjectTeamMember,
  revokeSubjectDocumentAccess,
  updateSubject,
  updateSubjectDocumentAccess,
  updateSubjectMemberRole,
} from "../services/subjectApi";
import type {
  SubjectAccessGrant,
  SubjectDocumentPermission,
  SubjectGrantType,
  SubjectItem,
  SubjectMember,
  SubjectPayload,
  SubjectTeam,
  SubjectWorkspaceRole,
} from "../services/subjectApi";
import type { DocumentItem, DocumentSubject } from "../types/document";
import {
  DEFAULT_SUBJECT_COLOR,
  normalizeSubjectColor,
} from "../utils/subjectColor";

type SubjectForm = {
  name: string;
  code: string;
  semester: string;
  description: string;
  color: string;
};

type Feedback = {
  tone: "success" | "error";
  message: string;
};

type NotificationStatus = "ACCEPTED" | "FAILED" | "SKIPPED";

type WorkspaceView = "documents" | "shared" | "teams" | "members" | "trash";
type DocumentViewMode = "grid" | "list";
type DocumentSortKey = "updatedAt" | "name" | "size" | "type";
type DocumentAccessFilter = "" | "OWNER" | "EDITOR" | "VIEWER";

const emptyForm: SubjectForm = {
  name: "",
  code: "",
  semester: "",
  description: "",
  color: DEFAULT_SUBJECT_COLOR,
};

function documentKey(document: DocumentItem): string {
  return document.id || document._id || "";
}

function documentTitle(document: DocumentItem): string {
  return document.title || document.originalFileName || document.fileName || "Untitled document";
}

function getFileExtension(name?: string): string {
  const extension = name?.split(".").pop();
  if (!extension || extension === name) return "";
  return extension.slice(0, 8).toUpperCase();
}

function readableFileType(document: DocumentItem): string {
  const extension = getFileExtension(document.originalFileName || document.fileName || document.storedFileName);
  if (extension) return extension;

  const type = document.fileType || document.mimeType || "";
  if (!type) return "File";
  if (type.includes("pdf")) return "PDF";
  if (type.includes("presentation") || type.includes("powerpoint")) return "PPTX";
  if (type.includes("spreadsheet") || type.includes("excel")) return "XLSX";
  if (type.includes("wordprocessing") || type.includes("word")) return "DOCX";
  if (type.startsWith("image/")) return "Image";
  if (type.startsWith("text/")) return "Text";
  return type.split("/").pop()?.slice(0, 18).toUpperCase() || "File";
}

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
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function notificationSuffix(status?: NotificationStatus): string {
  if (status === "ACCEPTED") return " Notification email sent.";
  if (status === "FAILED") return " Added, but notification email failed.";
  if (status === "SKIPPED") return " Added. Email notification was skipped.";
  return "";
}

function inviteNotificationSuffix(status?: NotificationStatus): string {
  if (status === "ACCEPTED") return " Invitation email sent.";
  if (status === "FAILED") return " Pending invite created, but email failed.";
  if (status === "SKIPPED") return " Pending invite created. Email notification was skipped.";
  return "";
}

function canManageWorkspace(role?: SubjectWorkspaceRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

function roleTone(role?: SubjectWorkspaceRole | null): string {
  if (role === "OWNER") return "border-primary/30 bg-primary/10 text-primary";
  if (role === "ADMIN") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-slate-300 bg-slate-50 text-slate-700";
}

function accessTone(role?: DocumentItem["accessRole"]): string {
  if (role === "OWNER") return "border-primary/30 bg-primary/10 text-primary";
  if (role === "EDITOR") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (role === "VIEWER") return "border-slate-300 bg-slate-50 text-slate-700";
  return "border-slate-200 bg-white text-slate-500";
}

function accessLabel(document: DocumentItem): string {
  if (document.accessRole === "OWNER") return "Manager";
  if (document.accessRole === "EDITOR") return "Editor";
  if (document.accessRole === "VIEWER") return "Viewer";
  return "No access";
}

function permissionLabel(permission: SubjectDocumentPermission): string {
  return permission === "EDIT" ? "Editor" : "Viewer";
}

function isArchivedDocument(document: DocumentItem): boolean {
  return document.status === "ARCHIVED" || document.status === "DELETED" || Boolean(document.deletedAt);
}

function subjectMeta(subject: SubjectItem): string {
  return [subject.code, subject.semester].filter(Boolean).join(" / ") || "No code / semester";
}

function getDocumentSubject(document: DocumentItem): DocumentSubject | null {
  return document.subject && typeof document.subject === "object"
    ? (document.subject as DocumentSubject)
    : null;
}

function documentSubjectLabel(document: DocumentItem, fallbackSubject: SubjectItem): string {
  const subject = getDocumentSubject(document) ?? fallbackSubject;
  return [subject.name, subject.code, subject.semester].filter(Boolean).join(" / ") || "Workspace";
}

function isBrowserPreviewable(document: DocumentItem): boolean {
  const extension = getFileExtension(document.originalFileName || document.fileName || document.storedFileName).toLowerCase();
  const type = (document.mimeType || document.fileType || "").toLowerCase();
  return (
    type.includes("pdf") ||
    type.startsWith("image/") ||
    type.startsWith("text/") ||
    ["pdf", "txt", "csv", "json", "md", "html"].includes(extension)
  );
}

function isImageDocument(document: DocumentItem): boolean {
  const extension = getFileExtension(document.originalFileName || document.fileName || document.storedFileName).toLowerCase();
  const type = (document.mimeType || document.fileType || "").toLowerCase();
  return type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension);
}

function DriveToolbar({
  accessFilter,
  canManage,
  detailsOpen,
  onClear,
  onToggleDetails,
  onUpload,
  query,
  setAccessFilter,
  setQuery,
  setSortKey,
  setViewMode,
  sortKey,
  viewMode,
}: {
  accessFilter: DocumentAccessFilter;
  canManage: boolean;
  detailsOpen: boolean;
  onClear: () => void;
  onToggleDetails: () => void;
  onUpload: () => void;
  query: string;
  setAccessFilter: (filter: DocumentAccessFilter) => void;
  setQuery: (query: string) => void;
  setSortKey: (key: DocumentSortKey) => void;
  setViewMode: (mode: DocumentViewMode) => void;
  sortKey: DocumentSortKey;
  viewMode: DocumentViewMode;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px_150px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search documents in subject"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files in this subject"
              value={query}
            />
          </label>
          <label className="relative block">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label="Filter document access"
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
              onChange={(event) => setAccessFilter(event.target.value as DocumentAccessFilter)}
              value={accessFilter}
            >
              <option value="">All access</option>
              <option value="OWNER">Manager</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </label>
          <select
            aria-label="Sort documents"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
            onChange={(event) => setSortKey(event.target.value as DocumentSortKey)}
            value={sortKey}
          >
            <option value="updatedAt">Recently updated</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage ? (
            <Button onClick={onUpload} type="button">
              <UploadCloud data-icon="inline-start" aria-hidden="true" />
              New / Upload
            </Button>
          ) : null}
          <div className="flex rounded-md border border-border bg-background p-1">
            <Button
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              size="icon-sm"
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
            >
              <Grid2X2 aria-hidden="true" />
            </Button>
            <Button
              aria-label="List view"
              onClick={() => setViewMode("list")}
              size="icon-sm"
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
            >
              <LayoutList aria-hidden="true" />
            </Button>
          </div>
          <Button onClick={onToggleDetails} type="button" variant={detailsOpen ? "default" : "secondary"}>
            <Info data-icon="inline-start" aria-hidden="true" />
            Details
          </Button>
          <Button
            disabled={!query.trim() && !accessFilter}
            onClick={onClear}
            type="button"
            variant="secondary"
          >
            <X data-icon="inline-start" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>
    </section>
  );
}

function SubjectDocumentGrid({
  activeId,
  canManage,
  documents,
  fallbackSubject,
  onManageAccess,
  onOpen,
  onSelect,
  selectedIds,
}: {
  activeId: string | null;
  canManage: boolean;
  documents: DocumentItem[];
  fallbackSubject: SubjectItem;
  onManageAccess: (document: DocumentItem) => void;
  onOpen: (document: DocumentItem) => void;
  onSelect: (document: DocumentItem, selected: boolean) => void;
  selectedIds: string[];
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {documents.map((document) => {
        const id = documentKey(document);
        const isActive = activeId === id;
        const isSelected = selectedIds.includes(id);
        return (
          <article
            className={`group cursor-pointer rounded-lg border bg-white p-4 transition-colors hover:border-primary/50 ${
              isActive ? "border-primary/60 ring-2 ring-primary/10" : "border-border"
            }`}
            key={id}
            onClick={() => onOpen(document)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold">{documentTitle(document)}</h3>
                  <p className="truncate text-xs text-muted-foreground">{documentSubjectLabel(document, fallbackSubject)}</p>
                  <p className="truncate text-xs text-muted-foreground">{readableFileType(document)}</p>
                </div>
              </div>
              <input
                aria-label={`Select ${documentTitle(document)}`}
                checked={isSelected}
                className="mt-1 size-4"
                onChange={(event) => onSelect(document, event.target.checked)}
                onClick={(event) => event.stopPropagation()}
                type="checkbox"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className={`rounded-full border ${accessTone(document.accessRole)}`} variant="outline">
                {accessLabel(document)}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <span>{formatFileSize(document.fileSize)}</span>
              <span className="text-right">{formatDate(document.updatedAt)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(document);
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                <Eye data-icon="inline-start" aria-hidden="true" />
                Preview
              </Button>
              {canManage ? (
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    onManageAccess(document);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                  Access
                </Button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SubjectDocumentList({
  activeId,
  canManage,
  documents,
  fallbackSubject,
  onManageAccess,
  onOpen,
  onSelect,
  selectedIds,
}: {
  activeId: string | null;
  canManage: boolean;
  documents: DocumentItem[];
  fallbackSubject: SubjectItem;
  onManageAccess: (document: DocumentItem) => void;
  onOpen: (document: DocumentItem) => void;
  onSelect: (document: DocumentItem, selected: boolean) => void;
  selectedIds: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Name</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Owner / Shared by</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => {
            const id = documentKey(document);
            const isSelected = selectedIds.includes(id);
            return (
              <TableRow
                className={`cursor-pointer ${activeId === id ? "bg-primary/5" : ""}`}
                key={id}
                onClick={() => onOpen(document)}
              >
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <input
                    aria-label={`Select ${documentTitle(document)}`}
                    checked={isSelected}
                    className="size-4"
                    onChange={(event) => onSelect(document, event.target.checked)}
                    type="checkbox"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{documentTitle(document)}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {documentSubjectLabel(document, fallbackSubject)} / {document.description || document.fileName}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-full border ${accessTone(document.accessRole)}`} variant="outline">
                    {accessLabel(document)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {document.sharedBy?.fullName || document.uploadedBy || document.ownerId || "Workspace"}
                </TableCell>
                <TableCell>{readableFileType(document)}</TableCell>
                <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                <TableCell>{formatDate(document.updatedAt)}</TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => onOpen(document)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Preview
                    </Button>
                    {canManage ? (
                      <Button onClick={() => onManageAccess(document)} size="sm" type="button" variant="ghost">
                        Access
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SubjectDetailsPanel({
  document,
  grants,
  subject,
  teams,
  members,
  documents,
}: {
  document: DocumentItem | null;
  grants: SubjectAccessGrant[];
  subject: SubjectItem;
  teams: SubjectTeam[];
  members: SubjectMember[];
  documents: DocumentItem[];
}) {
  if (!document) {
    return (
      <aside className="rounded-lg border border-border bg-white p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg border border-border"
            style={{ backgroundColor: `${normalizeSubjectColor(subject.color)}18` }}
          >
            <FolderOpen className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-bold">{subject.name}</h2>
            <p className="text-xs text-muted-foreground">{subjectMeta(subject)}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Documents</dt>
            <dd className="font-semibold">{subject.documentCount ?? documents.length}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Members</dt>
            <dd className="font-semibold">{subject.memberCount ?? members.length}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Teams</dt>
            <dd className="font-semibold">{subject.teamCount ?? teams.length}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Your role</dt>
            <dd>
              <Badge className={`border ${roleTone(subject.currentUserRole)}`} variant="outline">
                {subject.currentUserRole ?? "No access"}
              </Badge>
            </dd>
          </div>
        </dl>
        <p className="mt-5 rounded-md border border-border bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
          Select a document to inspect metadata, access grants, and processing status.
        </p>
      </aside>
    );
  }

  const teamGrants = grants.filter((grant) => grant.granteeType === "TEAM");
  const memberGrants = grants.filter((grant) => grant.granteeType === "USER");

  return (
    <aside className="min-w-0 overflow-hidden rounded-lg border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-primary">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="break-words font-bold">{documentTitle(document)}</h2>
          <p className="break-all text-xs text-muted-foreground">{document.fileName}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
          <dt className="text-muted-foreground">Effective access</dt>
          <dd className="min-w-0 justify-self-end">
            <Badge className={`border ${accessTone(document.accessRole)}`} variant="outline">
              {accessLabel(document)}
            </Badge>
          </dd>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
          <dt className="text-muted-foreground">Subject</dt>
          <dd className="min-w-0 break-words text-right font-semibold">{documentSubjectLabel(document, subject)}</dd>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="min-w-0 break-words text-right font-semibold">{readableFileType(document)}</dd>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
          <dt className="text-muted-foreground">Size</dt>
          <dd className="min-w-0 text-right font-semibold">{formatFileSize(document.fileSize)}</dd>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="min-w-0 break-words text-right font-semibold">{formatDate(document.updatedAt)}</dd>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
        </div>
      </dl>
      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-bold">Access summary</h3>
        <div className="mt-3 grid gap-3 text-sm">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              Teams
            </div>
            {teamGrants.length ? (
              <div className="grid gap-2">
                {teamGrants.map((grant) => (
                  <div className="flex justify-between gap-3 rounded-md border border-border px-3 py-2" key={grant.id}>
                    <span className="truncate">{grant.granteeName}</span>
                    <span className="font-semibold">{permissionLabel(grant.permission)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No team grants yet.</p>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Members
            </div>
            {memberGrants.length ? (
              <div className="grid gap-2">
                {memberGrants.map((grant) => (
                  <div className="flex justify-between gap-3 rounded-md border border-border px-3 py-2" key={grant.id}>
                    <span className="truncate">{grant.granteeName}</span>
                    <span className="font-semibold">{permissionLabel(grant.permission)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No direct member grants yet.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SubjectDocumentPreviewDialog({
  canManage,
  document,
  onManageAccess,
  onOpenChange,
  subject,
}: {
  canManage: boolean;
  document: DocumentItem | null;
  onManageAccess: (document: DocumentItem) => void;
  onOpenChange: (open: boolean) => void;
  subject: SubjectItem;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!document) {
      setPreviewUrl(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return undefined;
    }

    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    getDocumentDownloadUrl(documentKey(document))
      .then(({ downloadUrl }) => {
        if (cancelled) return;
        setPreviewUrl(downloadUrl || document.fileUrl || null);
      })
      .catch((error) => {
        if (cancelled) return;
        setPreviewUrl(document.fileUrl || null);
        setPreviewError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [document]);

  if (!document) {
    return null;
  }

  const canEdit = document.accessRole === "OWNER" || document.accessRole === "EDITOR";
  const canPreview = Boolean(previewUrl) && isBrowserPreviewable(document);
  const isImage = isImageDocument(document);
  const subjectContext = documentSubjectLabel(document, subject);

  function openFile() {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (document?.fileUrl) {
      window.open(document.fileUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[1100px] overflow-hidden p-0 sm:max-w-[1100px]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <DialogTitle className="truncate">{documentTitle(document)}</DialogTitle>
              <DialogDescription className="mt-1">
                {subjectContext} / {readableFileType(document)} / {formatFileSize(document.fileSize)}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`rounded-full border ${accessTone(document.accessRole)}`} variant="outline">
                {accessLabel(document)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid max-h-[72vh] min-h-[420px] bg-slate-50">
          {isPreviewLoading ? (
            <div className="grid place-items-center p-8 text-sm text-muted-foreground">Loading preview...</div>
          ) : canPreview && previewUrl ? (
            isImage ? (
              <div className="grid place-items-center overflow-auto p-4">
                <img
                  alt={documentTitle(document)}
                  className="max-h-[66vh] max-w-full rounded-lg border border-border bg-white object-contain"
                  src={previewUrl}
                />
              </div>
            ) : (
              <iframe
                className="h-[68vh] w-full bg-white"
                src={previewUrl}
                title={`Preview ${documentTitle(document)}`}
              />
            )
          ) : (
            <div className="grid place-items-center p-8 text-center">
              <div className="max-w-md rounded-lg border border-border bg-white p-6">
                <FileText className="mx-auto size-10 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black">Inline preview is not available for this file type</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {previewError
                    ? `Unable to load inline preview: ${previewError}`
                    : `${readableFileType(document)} files need a compatible app. Open or download the file to view it.`}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button disabled={!previewUrl && !document.fileUrl} onClick={openFile} type="button" variant="secondary">
                    <ExternalLink data-icon="inline-start" aria-hidden="true" />
                    Open file
                  </Button>
                  <Button onClick={() => void downloadDocumentFile(document)} type="button">
                    <Download data-icon="inline-start" aria-hidden="true" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap border-t border-border px-5 py-4">
          <Button onClick={() => void downloadDocumentFile(document)} type="button" variant="secondary">
            <Download data-icon="inline-start" aria-hidden="true" />
            Download
          </Button>
          <Button
            onClick={() => window.location.assign(`/aichatbox?documentId=${documentKey(document)}`)}
            type="button"
            variant="secondary"
          >
            <MessageSquare data-icon="inline-start" aria-hidden="true" />
            Ask AI
          </Button>
          {canEdit ? (
            <Button onClick={() => window.location.assign(`/documents/${documentKey(document)}`)} type="button" variant="secondary">
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Edit details
            </Button>
          ) : null}
          {canManage ? (
            <Button onClick={() => onManageAccess(document)} type="button">
              <ShieldCheck data-icon="inline-start" aria-hidden="true" />
              Manage access
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceDetail({
  onBack,
  onChanged,
  subject,
}: {
  onBack: () => void;
  onChanged: (subject: SubjectItem) => void;
  subject: SubjectItem;
}) {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<WorkspaceView>("documents");
  const [viewMode, setViewMode] = useState<DocumentViewMode>("grid");
  const [currentSubject, setCurrentSubject] = useState(subject);
  const [members, setMembers] = useState<SubjectMember[]>([]);
  const [teams, setTeams] = useState<SubjectTeam[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<DocumentAccessFilter>("");
  const [sortKey, setSortKey] = useState<DocumentSortKey>("updatedAt");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Exclude<SubjectWorkspaceRole, "OWNER">>("MEMBER");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMemberEmails, setTeamMemberEmails] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [accessDocument, setAccessDocument] = useState<DocumentItem | null>(null);
  const [bulkAccessDocuments, setBulkAccessDocuments] = useState<DocumentItem[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null);
  const [grants, setGrants] = useState<SubjectAccessGrant[]>([]);
  const [detailsGrants, setDetailsGrants] = useState<SubjectAccessGrant[]>([]);
  const [grantType, setGrantType] = useState<SubjectGrantType>("TEAM");
  const [grantGranteeId, setGrantGranteeId] = useState("");
  const [grantPermission, setGrantPermission] = useState<SubjectDocumentPermission>("VIEW");
  const [isGrantLoading, setIsGrantLoading] = useState(false);
  const canManage = canManageWorkspace(currentSubject.currentUserRole);

  const activeDocument = useMemo(
    () => documents.find((document) => documentKey(document) === activeDocumentId) ?? null,
    [activeDocumentId, documents],
  );

  function showFeedback(nextFeedback: Feedback) {
    setFeedback(nextFeedback);
    showToast({
      tone: nextFeedback.tone,
      message: nextFeedback.message,
    });
  }

  async function loadWorkspace() {
    setIsLoading(true);
    setFeedback(null);
    try {
      const [nextSubject, nextDocuments] = await Promise.all([
        getSubject(subject._id),
        listSubjectDocuments(subject._id),
      ]);
      setCurrentSubject(nextSubject);
      onChanged(nextSubject);
      setDocuments(nextDocuments);

      if (canManageWorkspace(nextSubject.currentUserRole)) {
        const [nextMembers, nextTeams] = await Promise.all([
          listSubjectMembers(subject._id),
          listSubjectTeams(subject._id),
        ]);
        setMembers(nextMembers);
        setTeams(nextTeams);
      } else {
        setMembers([]);
        setTeams([]);
        setActiveView((view) => (view === "members" || view === "teams" ? "documents" : view));
      }
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setActiveView("documents");
    setActiveDocumentId(null);
    setPreviewDocument(null);
    setSelectedIds([]);
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject._id]);

  useEffect(() => {
    async function loadDetailsGrants() {
      if (!activeDocument || !canManage) {
        setDetailsGrants([]);
        return;
      }
      try {
        setDetailsGrants(await listSubjectDocumentAccess(subject._id, documentKey(activeDocument)));
      } catch {
        setDetailsGrants([]);
      }
    }

    void loadDetailsGrants();
  }, [activeDocument, canManage, subject._id]);

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseDocuments = documents.filter((document) => {
      if (activeView === "trash") return isArchivedDocument(document);
      if (isArchivedDocument(document)) return false;
      if (activeView === "shared" && !document.isShared && document.accessRole === "OWNER") return canManage;
      return true;
    });

    const filtered = baseDocuments.filter((document) => {
      if (accessFilter && document.accessRole !== accessFilter) return false;
      if (!normalizedQuery) return true;
      return [
        documentTitle(document),
        document.description,
        document.fileName,
        document.fileType,
        document.mimeType,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return documentTitle(a).localeCompare(documentTitle(b));
      if (sortKey === "size") return (b.fileSize || 0) - (a.fileSize || 0);
      if (sortKey === "type") return (a.fileType || a.mimeType || "").localeCompare(b.fileType || b.mimeType || "");
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [accessFilter, activeView, canManage, documents, query, sortKey]);

  const recentDocuments = useMemo(
    () =>
      [...documents]
        .filter((document) => !isArchivedDocument(document))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [documents],
  );

  const selectedDocuments = useMemo(
    () => documents.filter((document) => selectedIds.includes(documentKey(document))),
    [documents, selectedIds],
  );
  const visibleDocumentIds = useMemo(() => visibleDocuments.map(documentKey).filter(Boolean), [visibleDocuments]);
  const allVisibleDocumentsSelected =
    visibleDocumentIds.length > 0 && visibleDocumentIds.every((id) => selectedIds.includes(id));

  function toggleSelectAllVisibleDocuments() {
    setSelectedIds((current) => {
      if (allVisibleDocumentsSelected) {
        return current.filter((id) => !visibleDocumentIds.includes(id));
      }
      return [...new Set([...current, ...visibleDocumentIds])];
    });
  }

  function openPreview(document: DocumentItem) {
    setActiveDocumentId(documentKey(document));
    setPreviewDocument(document);
  }

  async function addMember() {
    if (!memberEmail.trim()) return;
    setBusyId("member");
    setFeedback(null);
    try {
      const created = await addSubjectMember(subject._id, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMembers((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setMemberEmail("");
      setMemberRole("MEMBER");
      const isPending = created.status === "PENDING";
      showFeedback({
        tone: created.notificationStatus === "FAILED" ? "error" : "success",
        message: isPending
          ? `User is not registered yet. Pending invitation created.${inviteNotificationSuffix(created.notificationStatus)}`
          : `Member added to workspace.${notificationSuffix(created.notificationStatus)}`,
      });
      await loadWorkspace();
    } catch (error) {
      showFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function changeMemberRole(member: SubjectMember, role: Exclude<SubjectWorkspaceRole, "OWNER">) {
    setBusyId(member.id);
    setFeedback(null);
    try {
      const updated = await updateSubjectMemberRole(subject._id, member.id, role);
      setMembers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(member: SubjectMember) {
    setBusyId(member.id);
    setFeedback(null);
    try {
      await removeSubjectMember(subject._id, member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      await loadWorkspace();
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function createTeam() {
    if (!teamName.trim()) return;
    setBusyId("team");
    setFeedback(null);
    try {
      const created = await createSubjectTeam(subject._id, {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setTeams((current) => [created, ...current]);
      setTeamName("");
      setTeamDescription("");
      showFeedback({ tone: "success", message: "Team created successfully" });
      await loadWorkspace();
    } catch (error) {
      showFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function removeTeam(team: SubjectTeam) {
    setBusyId(team.id);
    setFeedback(null);
    try {
      await deleteSubjectTeam(subject._id, team.id);
      setTeams((current) => current.filter((item) => item.id !== team.id));
      await loadWorkspace();
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function addMemberToTeam(team: SubjectTeam, userId: string) {
    if (!userId) return;
    setBusyId(`${team.id}:member`);
    setFeedback(null);
    try {
      const updated = await addSubjectTeamMember(subject._id, team.id, userId);
      setTeams((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showFeedback({
        tone: updated.notificationStatus === "FAILED" ? "error" : "success",
        message: `Member added to ${team.name}.${notificationSuffix(updated.notificationStatus)}`,
      });
    } catch (error) {
      showFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function addMemberEmailToTeam(team: SubjectTeam) {
    const email = (teamMemberEmails[team.id] || "").trim();
    if (!email) return;
    const busyKey = `${team.id}:email`;
    setBusyId(busyKey);
    setFeedback(null);
    try {
      let workspaceMember = members.find((member) => member.user.email.toLowerCase() === email.toLowerCase());
      if (!workspaceMember) {
        workspaceMember = await addSubjectMember(subject._id, {
          email,
          role: "MEMBER",
          teamId: team.id,
        });
        setMembers((current) => [
          workspaceMember!,
          ...current.filter((item) => item.id !== workspaceMember!.id),
        ]);
      }

      if (workspaceMember.status === "PENDING" || !workspaceMember.user.id) {
        setTeamMemberEmails((current) => ({ ...current, [team.id]: "" }));
        showFeedback({
          tone: workspaceMember.notificationStatus === "FAILED" ? "error" : "success",
          message: `User is not registered yet. Pending team invitation created for ${team.name}.${inviteNotificationSuffix(workspaceMember.notificationStatus)}`,
        });
        await loadWorkspace();
        return;
      }

      if (team.members.some((member) => member.id === workspaceMember.user.id)) {
        showFeedback({ tone: "success", message: `${workspaceMember.user.fullName} is already in ${team.name}.` });
        return;
      }

      const updated = await addSubjectTeamMember(subject._id, team.id, workspaceMember.user.id);
      setTeams((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setTeamMemberEmails((current) => ({ ...current, [team.id]: "" }));
      const emailStatuses = [updated.notificationStatus].filter(Boolean);
      const failed = emailStatuses.includes("FAILED");
      const skipped = !failed && emailStatuses.includes("SKIPPED");
      showFeedback({
        tone: failed ? "error" : "success",
        message: `Member added to ${team.name}.${
          failed
            ? " One or more notification emails failed."
            : skipped
              ? " One or more notification emails were skipped."
              : emailStatuses.length
                ? " Notification email sent."
                : ""
        }`,
      });
      await loadWorkspace();
    } catch (error) {
      showFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function removeMemberFromTeam(team: SubjectTeam, userId: string) {
    setBusyId(`${team.id}:${userId}`);
    setFeedback(null);
    try {
      const updated = await removeSubjectTeamMember(subject._id, team.id, userId);
      setTeams((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function openAccess(document: DocumentItem) {
    setAccessDocument(document);
    setActiveDocumentId(documentKey(document));
    setIsGrantLoading(true);
    setFeedback(null);
    try {
      const nextGrants = await listSubjectDocumentAccess(subject._id, documentKey(document));
      setGrants(nextGrants);
      setDetailsGrants(nextGrants);
      setGrantType("TEAM");
      setGrantGranteeId("");
      setGrantPermission("VIEW");
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsGrantLoading(false);
    }
  }

  async function saveGrant() {
    if (!accessDocument || !grantGranteeId) return;
    setIsGrantLoading(true);
    setFeedback(null);
    try {
      const saved = await createSubjectDocumentAccess(subject._id, documentKey(accessDocument), {
        granteeType: grantType,
        granteeId: grantGranteeId,
        permission: grantPermission,
      });
      const nextGrants = [saved, ...grants.filter((item) => item.id !== saved.id)];
      setGrants(nextGrants);
      setDetailsGrants(nextGrants);
      setGrantGranteeId("");
      showFeedback({ tone: "success", message: "Document access grant added successfully" });
      await loadWorkspace();
    } catch (error) {
      showFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsGrantLoading(false);
    }
  }

  async function saveBulkGrant() {
    if (!bulkAccessDocuments.length || !grantGranteeId) return;
    setIsGrantLoading(true);
    setFeedback(null);
    try {
      let successCount = 0;
      const failures: string[] = [];
      for (const document of bulkAccessDocuments) {
        try {
          await createSubjectDocumentAccess(subject._id, documentKey(document), {
            granteeType: grantType,
            granteeId: grantGranteeId,
            permission: grantPermission,
          });
          successCount += 1;
        } catch (error) {
          failures.push(`${documentTitle(document)}: ${getErrorMessage(error)}`);
        }
      }

      if (failures.length) {
        showFeedback({
          tone: "error",
          message: `Applied access to ${successCount}/${bulkAccessDocuments.length} document(s). ${failures[0]}`,
        });
      } else {
        showFeedback({
          tone: "success",
          message: `Access applied to ${successCount} document(s) successfully`,
        });
      }
      setBulkAccessDocuments([]);
      setSelectedIds([]);
      setGrantGranteeId("");
      await loadWorkspace();
    } catch (error) {
      showFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsGrantLoading(false);
    }
  }

  async function changeGrantPermission(grant: SubjectAccessGrant, permission: SubjectDocumentPermission) {
    if (!accessDocument) return;
    setIsGrantLoading(true);
    try {
      const updated = await updateSubjectDocumentAccess(subject._id, documentKey(accessDocument), grant.id, permission);
      const nextGrants = grants.map((item) => (item.id === updated.id ? updated : item));
      setGrants(nextGrants);
      setDetailsGrants(nextGrants);
      await loadWorkspace();
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsGrantLoading(false);
    }
  }

  async function revokeGrant(grant: SubjectAccessGrant) {
    if (!accessDocument) return;
    setIsGrantLoading(true);
    try {
      await revokeSubjectDocumentAccess(subject._id, documentKey(accessDocument), grant.id);
      const nextGrants = grants.filter((item) => item.id !== grant.id);
      setGrants(nextGrants);
      setDetailsGrants(nextGrants);
      await loadWorkspace();
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsGrantLoading(false);
    }
  }

  function toggleDocumentSelection(document: DocumentItem, selected: boolean) {
    const id = documentKey(document);
    setSelectedIds((current) =>
      selected ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  }

  async function downloadSelectedDocuments() {
    for (const document of selectedDocuments) {
      await downloadDocumentFile(document);
    }
  }

  const grantOptions =
    grantType === "TEAM"
      ? teams.map((team) => ({ id: team.id, label: team.name }))
      : members
          .filter((member) => member.role !== "OWNER")
          .map((member) => ({
            id: member.user.id,
            label: `${member.user.fullName} (${member.user.email})`,
          }));

  const viewItems: Array<{ id: WorkspaceView; label: string; icon: typeof FileText; count?: number; managerOnly?: boolean }> = [
    { id: "documents", label: "Documents", icon: FileText, count: documents.filter((item) => !isArchivedDocument(item)).length },
    { id: "shared", label: "Shared access", icon: ShieldCheck },
    { id: "teams", label: "Teams", icon: FolderOpen, count: currentSubject.teamCount ?? teams.length, managerOnly: true },
    { id: "members", label: "Members", icon: Users, count: currentSubject.memberCount ?? members.length, managerOnly: true },
  ];
  const archivedCount = documents.filter(isArchivedDocument).length;
  if (archivedCount) viewItems.push({ id: "trash", label: "Trash / Archived", icon: Trash2, count: archivedCount });

  const teamGrants = grants.filter((grant) => grant.granteeType === "TEAM");
  const memberGrants = grants.filter((grant) => grant.granteeType === "USER");

  return (
    <main className="moonlit-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-border bg-white px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Button onClick={onBack} size="sm" type="button" variant="ghost">
                  Subjects
                </Button>
                <ChevronRight className="size-4" aria-hidden="true" />
                <span className="truncate font-semibold text-foreground">{currentSubject.name}</span>
                <Badge className={`rounded-full border ${roleTone(currentSubject.currentUserRole)}`} variant="outline">
                  {currentSubject.currentUserRole ?? "No access"}
                </Badge>
                {currentSubject.currentUserTeams?.map((team) => (
                  <Badge
                    className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800"
                    key={team.id}
                    variant="outline"
                  >
                    Team: {team.name}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex min-w-0 items-center gap-3">
                <span
                  className="size-8 shrink-0 rounded-lg border border-border"
                  style={{ backgroundColor: normalizeSubjectColor(currentSubject.color) }}
                />
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black tracking-tight">{currentSubject.name}</h1>
                  <p className="truncate text-sm text-muted-foreground">
                    {currentSubject.description || subjectMeta(currentSubject)}
                  </p>
                </div>
              </div>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setActiveView("members")} type="button" variant="secondary">
                  <Users data-icon="inline-start" aria-hidden="true" />
                  Manage members
                </Button>
                <Button onClick={() => window.location.assign(`/library?subjectId=${subject._id}`)} type="button">
                  <UploadCloud data-icon="inline-start" aria-hidden="true" />
                  Upload document
                </Button>
              </div>
            ) : null}
          </div>
        </header>

        {feedback ? (
          <div
            className={`rounded-lg border bg-white px-4 py-3 text-sm ${
              feedback.tone === "error" ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"
            }`}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-border bg-white p-2 lg:sticky lg:top-4 lg:self-start">
            <nav className="grid gap-1">
              {viewItems
                .filter((item) => canManage || !item.managerOnly)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      className="justify-start"
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setSelectedIds([]);
                      }}
                      type="button"
                      variant={activeView === item.id ? "default" : "ghost"}
                    >
                      <Icon data-icon="inline-start" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                      {typeof item.count === "number" ? <span className="text-xs opacity-75">{item.count}</span> : null}
                    </Button>
                  );
                })}
            </nav>
          </aside>

          <section className="min-w-0">
            {(activeView === "documents" || activeView === "shared" || activeView === "trash") && (
              <div className="grid gap-4">
                <DriveToolbar
                  accessFilter={accessFilter}
                  canManage={canManage}
                  detailsOpen={detailsOpen}
                  onClear={() => {
                    setQuery("");
                    setAccessFilter("");
                  }}
                  onToggleDetails={() => {
                    if (window.matchMedia("(max-width: 1279px)").matches) {
                      setIsDetailsDialogOpen(true);
                      return;
                    }
                    setDetailsOpen((open) => !open);
                  }}
                  onUpload={() => window.location.assign(`/library?subjectId=${subject._id}`)}
                  query={query}
                  setAccessFilter={setAccessFilter}
                  setQuery={setQuery}
                  setSortKey={setSortKey}
                  setViewMode={setViewMode}
                  sortKey={sortKey}
                  viewMode={viewMode}
                />

                {isLoading ? (
                  <section className="grid gap-3 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton className="h-40 rounded-lg" key={index} />
                    ))}
                  </section>
                ) : (
                  <div className={`grid gap-4 ${detailsOpen ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
                    <div className="min-w-0">
                      {activeView !== "trash" && recentDocuments.length ? (
                        <section className="mb-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                            <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
                            Quick access / Recent documents
                          </div>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
                            {recentDocuments.map((document) => (
                              <button
                                className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-white p-3 text-left transition-colors hover:border-primary/50"
                                key={documentKey(document)}
                                onClick={() => openPreview(document)}
                                type="button"
                              >
                                <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold">{documentTitle(document)}</span>
                                  <span className="block truncate text-xs text-muted-foreground">{formatDate(document.updatedAt)}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-bold">
                          {activeView === "shared" ? "Shared access review" : activeView === "trash" ? "Trash / Archived" : "Files"}
                        </h2>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            disabled={visibleDocuments.length === 0}
                            onClick={toggleSelectAllVisibleDocuments}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            {allVisibleDocumentsSelected ? "Clear visible" : "Select all"}
                          </Button>
                          <span className="text-xs text-muted-foreground">{visibleDocuments.length} item(s)</span>
                        </div>
                      </div>

                      {visibleDocuments.length ? (
                        viewMode === "grid" ? (
                          <SubjectDocumentGrid
                            activeId={activeDocumentId}
                            canManage={canManage}
                            documents={visibleDocuments}
                            fallbackSubject={currentSubject}
                            onManageAccess={(document) => void openAccess(document)}
                            onOpen={openPreview}
                            onSelect={toggleDocumentSelection}
                            selectedIds={selectedIds}
                          />
                        ) : (
                          <SubjectDocumentList
                            activeId={activeDocumentId}
                            canManage={canManage}
                            documents={visibleDocuments}
                            fallbackSubject={currentSubject}
                            onManageAccess={(document) => void openAccess(document)}
                            onOpen={openPreview}
                            onSelect={toggleDocumentSelection}
                            selectedIds={selectedIds}
                          />
                        )
                      ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-white p-8 text-center">
                          <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
                          <h2 className="text-xl font-black">No documents here</h2>
                          <p className="max-w-md text-sm text-muted-foreground">
                            {canManage
                              ? "Upload documents to this subject workspace, then grant access to members or teams."
                              : "You will see documents here when a manager grants you access."}
                          </p>
                          {canManage ? (
                            <Button onClick={() => window.location.assign(`/library?subjectId=${subject._id}`)} type="button">
                              <UploadCloud data-icon="inline-start" aria-hidden="true" />
                              Upload document
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                    {detailsOpen ? (
                      <div className="hidden xl:block">
                      <SubjectDetailsPanel
                        document={activeDocument}
                        documents={documents}
                        grants={detailsGrants}
                        members={members}
                        subject={currentSubject}
                        teams={teams}
                      />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {activeView === "members" && canManage ? (
              <section className="grid gap-4">
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="size-5 text-primary" aria-hidden="true" />
                    <div>
                      <h2 className="font-black">Members</h2>
                      <p className="text-sm text-muted-foreground">Add registered users and assign workspace roles.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
                    <Input
                      onChange={(event) => setMemberEmail(event.target.value)}
                      placeholder="member@example.com"
                      type="email"
                      value={memberEmail}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      onChange={(event) => setMemberRole(event.target.value === "ADMIN" ? "ADMIN" : "MEMBER")}
                      value={memberRole}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Button disabled={!memberEmail.trim() || busyId === "member"} onClick={() => void addMember()} type="button">
                      <Plus data-icon="inline-start" aria-hidden="true" />
                      Add member
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2 font-semibold">
                              {member.user.fullName}
                              {member.status === "PENDING" ? (
                                <Badge className="border border-amber-300 bg-amber-50 text-amber-800" variant="outline">
                                  Pending
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">{member.user.email}</div>
                            {member.status === "PENDING" && member.expiresAt ? (
                              <div className="text-xs text-muted-foreground">Expires {formatDate(member.expiresAt)}</div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {member.teamNames?.length ? (
                              <div className="flex max-w-xs flex-wrap gap-1.5">
                                {member.teamNames.map((teamName) => (
                                  <Badge
                                    className="rounded-full border border-slate-300 bg-slate-50 text-slate-700"
                                    key={`${member.id}:${teamName}`}
                                    variant="outline"
                                  >
                                    {teamName}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No team</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {member.status === "PENDING" ? (
                              <Badge className="border border-slate-300 bg-slate-50 text-slate-700" variant="outline">
                                {member.role === "ADMIN" ? "Pending admin" : "Pending member"}
                              </Badge>
                            ) : member.role === "OWNER" ? (
                              <Badge className={`border ${roleTone(member.role)}`} variant="outline">Owner</Badge>
                            ) : (
                              <select
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                disabled={busyId === member.id}
                                onChange={(event) =>
                                  void changeMemberRole(member, event.target.value === "ADMIN" ? "ADMIN" : "MEMBER")
                                }
                                value={member.role}
                              >
                                <option value="MEMBER">Member</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              disabled={member.role === "OWNER" || busyId === member.id}
                              onClick={() => void removeMember(member)}
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ) : null}

            {activeView === "teams" && canManage ? (
              <section className="grid gap-4">
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <FolderOpen className="size-5 text-primary" aria-hidden="true" />
                    <div>
                      <h2 className="font-black">Teams</h2>
                      <p className="text-sm text-muted-foreground">Group members, then grant document access to the whole team.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[16rem_1fr_auto]">
                    <Input onChange={(event) => setTeamName(event.target.value)} placeholder="FE Team" value={teamName} />
                    <Input
                      onChange={(event) => setTeamDescription(event.target.value)}
                      placeholder="Optional description"
                      value={teamDescription}
                    />
                    <Button disabled={!teamName.trim() || busyId === "team"} onClick={() => void createTeam()} type="button">
                      <Plus data-icon="inline-start" aria-hidden="true" />
                      Create team
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3">
                  {teams.map((team) => {
                    const availableMembers = members.filter(
                      (member) => !team.members.some((teamMember) => teamMember.id === member.user.id),
                    );
                    return (
                      <article className="rounded-lg border border-border bg-white p-4" key={team.id}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-bold">{team.name}</h3>
                            <p className="text-sm text-muted-foreground">{team.description || "No description"}</p>
                          </div>
                          <Button
                            disabled={busyId === team.id}
                            onClick={() => void removeTeam(team)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 data-icon="inline-start" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {team.members.length || team.pendingMembers?.length ? (
                            <>
                            {team.members.map((member) => (
                              <Badge className="gap-2 rounded-full border border-border bg-white" key={member.id} variant="outline">
                                {member.fullName}
                                <button
                                  aria-label={`Remove ${member.fullName} from ${team.name}`}
                                  onClick={() => void removeMemberFromTeam(team, member.id)}
                                  type="button"
                                >
                                  <X className="size-3" aria-hidden="true" />
                                </button>
                              </Badge>
                            ))}
                            {team.pendingMembers?.map((member) => (
                              <Badge
                                className="gap-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800"
                                key={`${team.id}:${member.email}`}
                                variant="outline"
                              >
                                {member.email} · Pending
                              </Badge>
                            ))}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No members yet</span>
                          )}
                        </div>
                        <div className="mt-4 grid gap-3 border-t border-border pt-4 lg:grid-cols-[minmax(180px,280px)_minmax(240px,1fr)_auto]">
                          <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            defaultValue=""
                            onChange={(event) => {
                              void addMemberToTeam(team, event.target.value);
                              event.currentTarget.value = "";
                            }}
                          >
                            <option value="">Add member to team</option>
                            {availableMembers.map((member) => (
                              <option key={member.user.id} value={member.user.id}>
                                {member.user.fullName} ({member.user.email})
                              </option>
                            ))}
                          </select>
                          <Input
                            onChange={(event) =>
                              setTeamMemberEmails((current) => ({
                                ...current,
                                [team.id]: event.target.value,
                              }))
                            }
                            placeholder="Or add registered email to this team"
                            type="email"
                            value={teamMemberEmails[team.id] ?? ""}
                          />
                          <Button
                            disabled={!teamMemberEmails[team.id]?.trim() || busyId === `${team.id}:email`}
                            onClick={() => void addMemberEmailToTeam(team)}
                            type="button"
                          >
                            <Plus data-icon="inline-start" aria-hidden="true" />
                            Add to team
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                  {!teams.length ? (
                    <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
                      No teams yet. Create a team to grant access faster.
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>

      {selectedIds.length ? (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <strong>{selectedIds.length}</strong> document(s) selected
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void downloadSelectedDocuments()} size="sm" type="button" variant="secondary">
              <Download data-icon="inline-start" aria-hidden="true" />
              Download
            </Button>
            {canManage ? (
              <Button
                onClick={() => {
                  if (selectedDocuments.length === 1) {
                    void openAccess(selectedDocuments[0]);
                    return;
                  }
                  setBulkAccessDocuments(selectedDocuments);
                  setGrantType("TEAM");
                  setGrantGranteeId("");
                  setGrantPermission("VIEW");
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                {selectedDocuments.length > 1 ? "Bulk access" : "Manage access"}
              </Button>
            ) : null}
            {selectedDocuments.length === 1 ? (
              <Button
                onClick={() => window.location.assign(`/aichatbox?documentId=${documentKey(selectedDocuments[0])}`)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <MessageSquare data-icon="inline-start" aria-hidden="true" />
                Ask AI
              </Button>
            ) : null}
            <Button onClick={() => setSelectedIds([])} size="sm" type="button" variant="ghost">
              Clear selection
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg p-0">
          <SubjectDetailsPanel
            document={activeDocument}
            documents={documents}
            grants={detailsGrants}
            members={members}
            subject={currentSubject}
            teams={teams}
          />
        </DialogContent>
      </Dialog>

      <SubjectDocumentPreviewDialog
        canManage={canManage}
        document={previewDocument}
        onManageAccess={(document) => {
          setPreviewDocument(null);
          void openAccess(document);
        }}
        onOpenChange={(open) => {
          if (!open) setPreviewDocument(null);
        }}
        subject={currentSubject}
      />

      <Dialog open={Boolean(accessDocument)} onOpenChange={(open) => !open && setAccessDocument(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[920px] overflow-hidden sm:max-w-[920px]">
          <DialogHeader>
            <DialogTitle>Share / Manage access</DialogTitle>
            <DialogDescription>
              {accessDocument ? `${documentTitle(accessDocument)} / Effective: ${accessLabel(accessDocument)}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[72vh] gap-4 overflow-y-auto pr-1">
            <div className="grid gap-3 rounded-lg border border-border bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-[140px_minmax(0,1fr)_140px_auto]">
              <select
                className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => {
                  setGrantType(event.target.value === "USER" ? "USER" : "TEAM");
                  setGrantGranteeId("");
                }}
                value={grantType}
              >
                <option value="TEAM">Team</option>
                <option value="USER">Member</option>
              </select>
              <select
                className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => setGrantGranteeId(event.target.value)}
                value={grantGranteeId}
              >
                <option value="">Select {grantType === "TEAM" ? "team" : "member"}</option>
                {grantOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => setGrantPermission(event.target.value === "EDIT" ? "EDIT" : "VIEW")}
                value={grantPermission}
              >
                <option value="VIEW">Viewer</option>
                <option value="EDIT">Editor</option>
              </select>
              <Button className="sm:col-span-2 lg:col-span-1" disabled={!grantGranteeId || isGrantLoading} onClick={() => void saveGrant()} type="button">
                Add
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {[
                { label: "Teams", items: teamGrants, icon: FolderOpen },
                { label: "Members", items: memberGrants, icon: Users },
              ].map((group) => {
                const Icon = group.icon;
                return (
                  <section className="rounded-lg border border-border bg-white p-3" key={group.label}>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      {group.label}
                    </h3>
                    {isGrantLoading ? (
                      <p className="text-sm text-muted-foreground">Loading access...</p>
                    ) : group.items.length ? (
                      <div className="grid gap-2">
                        {group.items.map((grant) => (
                          <div className="grid gap-2 rounded-md border border-border p-3" key={grant.id}>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{grant.granteeName}</div>
                              {grant.granteeEmail ? (
                                <div className="truncate text-xs text-muted-foreground">{grant.granteeEmail}</div>
                              ) : null}
                            </div>
                            <div className="flex gap-2">
                              <select
                                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                                disabled={isGrantLoading}
                                onChange={(event) =>
                                  void changeGrantPermission(grant, event.target.value === "EDIT" ? "EDIT" : "VIEW")
                                }
                                value={grant.permission}
                              >
                                <option value="VIEW">{permissionLabel("VIEW")}</option>
                                <option value="EDIT">{permissionLabel("EDIT")}</option>
                              </select>
                              <Button
                                disabled={isGrantLoading}
                                onClick={() => void revokeGrant(grant)}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                        No {group.label.toLowerCase()} granted yet.
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setAccessDocument(null)} type="button" variant="secondary">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAccessDocuments.length > 0} onOpenChange={(open) => !open && setBulkAccessDocuments([])}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[760px] overflow-hidden sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Bulk manage access</DialogTitle>
            <DialogDescription>
              Apply one access grant to {bulkAccessDocuments.length} selected document(s).
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
            <div className="rounded-lg border border-border bg-slate-50 p-3">
              <div className="mb-3 text-sm font-semibold">Selected documents</div>
              <div className="grid max-h-40 gap-2 overflow-y-auto">
                {bulkAccessDocuments.map((document) => (
                  <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm" key={documentKey(document)}>
                    <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate">{documentTitle(document)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-[140px_minmax(0,1fr)_140px]">
              <select
                className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => {
                  setGrantType(event.target.value === "USER" ? "USER" : "TEAM");
                  setGrantGranteeId("");
                }}
                value={grantType}
              >
                <option value="TEAM">Team</option>
                <option value="USER">Member</option>
              </select>
              <select
                className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => setGrantGranteeId(event.target.value)}
                value={grantGranteeId}
              >
                <option value="">Select {grantType === "TEAM" ? "team" : "member"}</option>
                {grantOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                onChange={(event) => setGrantPermission(event.target.value === "EDIT" ? "EDIT" : "VIEW")}
                value={grantPermission}
              >
                <option value="VIEW">Viewer</option>
                <option value="EDIT">Editor</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button disabled={isGrantLoading} onClick={() => setBulkAccessDocuments([])} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={!grantGranteeId || isGrantLoading} onClick={() => void saveBulkGrant()} type="button">
              {isGrantLoading ? "Applying..." : `Apply to ${bulkAccessDocuments.length} document(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<SubjectWorkspaceRole | "">("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const filteredSubjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return subjects.filter((subject) => {
      if (roleFilter && subject.currentUserRole !== roleFilter) return false;
      if (!normalizedQuery) return true;

      return [subject.name, subject.code, subject.semester, subject.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    });
  }, [roleFilter, searchQuery, subjects]);

  const sortedSubjects = useMemo(
    () =>
      [...filteredSubjects].sort((a, b) =>
        [a.code, a.name].filter(Boolean).join(" ").localeCompare([b.code, b.name].filter(Boolean).join(" ")),
      ),
    [filteredSubjects],
  );

  async function loadSubjects() {
    setIsLoading(true);
    setFeedback(null);
    try {
      const nextSubjects = await listSubjects();
      setSubjects(nextSubjects);
      const subjectIdFromUrl = new URLSearchParams(window.location.search).get("subjectId");
      const subjectFromUrl = nextSubjects.find((subject) => subject._id === subjectIdFromUrl);
      if (subjectFromUrl) {
        setSelectedSubject(subjectFromUrl);
      }
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSubjects();
  }, []);

  function openCreate() {
    setEditingSubject(null);
    setForm(emptyForm);
    setIsEditorOpen(true);
  }

  function openEdit(subject: SubjectItem) {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code ?? "",
      semester: subject.semester ?? "",
      description: subject.description ?? "",
      color: normalizeSubjectColor(subject.color),
    });
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ tone: "error", message: "Subject workspace name is required" });
      return;
    }

    const payload: SubjectPayload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      semester: form.semester.trim() || undefined,
      description: form.description.trim() || undefined,
      color: normalizeSubjectColor(form.color),
    };

    setIsSaving(true);
    setFeedback(null);
    try {
      if (editingSubject) {
        const updated = await updateSubject(editingSubject._id, payload);
        setSubjects((current) => current.map((subject) => (subject._id === updated._id ? updated : subject)));
        setSelectedSubject((current) => (current?._id === updated._id ? updated : current));
        setFeedback({ tone: "success", message: "Subject workspace updated" });
      } else {
        const created = await createSubject(payload);
        setSubjects((current) => [created, ...current]);
        setFeedback({ tone: "success", message: "Subject workspace created" });
      }
      setIsEditorOpen(false);
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingSubject) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteSubject(deletingSubject._id);
      setSubjects((current) => current.filter((subject) => subject._id !== deletingSubject._id));
      if (selectedSubject?._id === deletingSubject._id) setSelectedSubject(null);
      setDeletingSubject(null);
      setFeedback({ tone: "success", message: "Subject workspace deleted" });
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsDeleting(false);
    }
  }

  const previewColor = normalizeSubjectColor(form.color);
  const previewCode = form.code.trim() || "CODE";

  if (selectedSubject) {
    return (
      <WorkspaceDetail
        onBack={() => setSelectedSubject(null)}
        onChanged={(subject) => {
          setSubjects((current) => current.map((item) => (item._id === subject._id ? subject : item)));
          setSelectedSubject(subject);
        }}
        subject={selectedSubject}
      />
    );
  }

  return (
    <main className="moonlit-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Team workspace</p>
            <h1 className="moonlit-title page-title mt-2">Subject Workspaces</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Drive-style folders for subject documents, members, teams, and access control.
            </p>
          </div>
          <Button onClick={openCreate} type="button">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Create subject workspace
          </Button>
        </header>

        {feedback ? (
          <div
            className={`rounded-lg border bg-white px-4 py-3 text-sm ${
              feedback.tone === "error" ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"
            }`}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="rounded-lg border border-border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search subject workspaces"
                className="pl-9"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search folder name, code, semester, description"
                value={searchQuery}
              />
            </label>
            <select
              aria-label="Filter by workspace role"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
              onChange={(event) => setRoleFilter(event.target.value as SubjectWorkspaceRole | "")}
              value={roleFilter}
            >
              <option value="">All roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
            <Button
              disabled={!searchQuery.trim() && !roleFilter}
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("");
              }}
              type="button"
              variant="secondary"
            >
              <X data-icon="inline-start" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </section>

        <section className="overflow-x-auto rounded-lg border border-border bg-white">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead>Folder</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-52" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-28" /></TableCell>
                    </TableRow>
                  ))
                : sortedSubjects.map((subject) => {
                    const subjectColor = normalizeSubjectColor(subject.color);
                    const canEdit = canManageWorkspace(subject.currentUserRole);
                    return (
                      <TableRow className="cursor-pointer" key={subject._id} onClick={() => setSelectedSubject(subject)}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border"
                              style={{ backgroundColor: `${subjectColor}18`, color: subjectColor }}
                            >
                              <FolderOpen className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-bold">{subject.name}</div>
                              <div className="text-xs text-muted-foreground">{subjectMeta(subject)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border ${roleTone(subject.currentUserRole)}`} variant="outline">
                            {subject.currentUserRole ?? "No access"}
                          </Badge>
                        </TableCell>
                        <TableCell>{subject.memberCount ?? 1}</TableCell>
                        <TableCell>{subject.teamCount ?? 0}</TableCell>
                        <TableCell>{subject.documentCount ?? 0}</TableCell>
                        <TableCell>{formatDate(subject.updatedAt ?? subject.createdAt)}</TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => setSelectedSubject(subject)} size="sm" type="button" variant="secondary">
                              Open files
                            </Button>
                            {canEdit ? (
                              <Button
                                aria-label={`Edit ${subject.name}`}
                                onClick={() => openEdit(subject)}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <Pencil aria-hidden="true" />
                              </Button>
                            ) : null}
                            {subject.currentUserRole === "OWNER" ? (
                              <Button
                                aria-label={`Delete ${subject.name}`}
                                onClick={() => setDeletingSubject(subject)}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {!isLoading && sortedSubjects.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
              <BookMarked className="size-9" aria-hidden="true" />
              <h2 className="text-xl font-black">No subject workspaces found</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Create a subject folder to manage documents, teams, and access control.
              </p>
              <Button onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden="true" />
                Create subject workspace
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit subject workspace" : "Create subject workspace"}</DialogTitle>
              <DialogDescription>
                Subject workspaces behave like Drive folders with members, teams, documents, and access rules.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <label className="grid gap-2 text-sm font-bold">
                Name
                <Input disabled={isSaving} maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Code
                <Input disabled={isSaving} maxLength={40} onChange={(event) => setForm({ ...form, code: event.target.value })} value={form.code} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Semester
                <Input disabled={isSaving} maxLength={80} onChange={(event) => setForm({ ...form, semester: event.target.value })} placeholder="Fall 2026" value={form.semester} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Description
                <Textarea disabled={isSaving} maxLength={1000} onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Color
                <div className="flex gap-3">
                  <Input className="w-16 p-1" disabled={isSaving} onChange={(event) => setForm({ ...form, color: event.target.value })} type="color" value={previewColor} />
                  <Input disabled={isSaving} onChange={(event) => setForm({ ...form, color: event.target.value })} value={form.color} />
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/55 px-3 py-2">
                  <span className="subject-code-pill" style={{ "--subject-color": previewColor } as CSSProperties}>
                    {previewCode}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{previewColor}</span>
                </div>
              </label>
            </div>
            <DialogFooter>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingSubject)} onOpenChange={(open) => !open && !isDeleting && setDeletingSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subject workspace?</DialogTitle>
            <DialogDescription>
              This moves documents in this subject to trash and removes teams, members, and document access grants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isDeleting} onClick={() => setDeletingSubject(null)} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isDeleting} onClick={() => void confirmDelete()} type="button" variant="destructive">
              {isDeleting ? "Deleting..." : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
