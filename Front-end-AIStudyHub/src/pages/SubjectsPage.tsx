import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CSSProperties, FormEvent } from "react";
import {
  BookMarked,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
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
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from "@/services/subjectApi";
import type {
  SubjectItem,
  SubjectPayload,
  SubjectWorkspaceRole,
} from "@/services/subjectApi";
import {
  DEFAULT_SUBJECT_COLOR,
  normalizeSubjectColor,
} from "@/utils/subjectColor";

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

const emptyForm: SubjectForm = {
  name: "",
  code: "",
  semester: "",
  description: "",
  color: DEFAULT_SUBJECT_COLOR,
};

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function canManageWorkspace(role?: SubjectWorkspaceRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

function roleTone(role?: SubjectWorkspaceRole | null): string {
  if (role === "OWNER") return "border-primary/30 bg-primary/10 text-primary";
  if (role === "ADMIN") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-slate-300 bg-slate-50 text-slate-700";
}

function subjectMeta(subject: SubjectItem): string {
  return (
    [subject.code, subject.semester].filter(Boolean).join(" / ") ||
    "No code / semester"
  );
}

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(
    null,
  );
  const [deletingSubject, setDeletingSubject] = useState<SubjectItem | null>(
    null,
  );
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
        [a.code, a.name]
          .filter(Boolean)
          .join(" ")
          .localeCompare([b.code, b.name].filter(Boolean).join(" ")),
      ),
    [filteredSubjects],
  );

  async function loadSubjects() {
    setIsLoading(true);
    setFeedback(null);
    try {
      const nextSubjects = await listSubjects();
      setSubjects(nextSubjects);

      const subjectIdFromUrl = new URLSearchParams(window.location.search).get(
        "subjectId",
      );
      if (subjectIdFromUrl) {
        navigate(`/subjects/${subjectIdFromUrl}`, { replace: true });
      }
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setFeedback({
        tone: "error",
        message: "Subject workspace name is required",
      });
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
        setSubjects((current) =>
          current.map((subject) =>
            subject._id === updated._id ? updated : subject,
          ),
        );
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
      setSubjects((current) =>
        current.filter((subject) => subject._id !== deletingSubject._id),
      );
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

  return (
    <PageShell>
      <PageHeader
        title="Subjects"
        description="Drive-style folders for subject documents, members, teams, and access control."
        actions={
          <Button onClick={openCreate} type="button">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Create subject workspace
          </Button>
        }
      />

      {feedback ? (
        <div
          className={`rounded-lg border bg-white px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-200 text-red-700"
              : "border-emerald-200 text-emerald-700"
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      ) : null}

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
        <Select
          onValueChange={(val) =>
            setRoleFilter(
              (val === "all" ? "" : val) as SubjectWorkspaceRole | "",
            )
          }
          value={roleFilter || "all"}
        >
          <SelectTrigger
            aria-label="Filter by workspace role"
            className="h-10 w-[180px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>
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
                    <TableCell>
                      <Skeleton className="h-5 w-52" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              : sortedSubjects.map((subject) => {
                  const subjectColor = normalizeSubjectColor(subject.color);
                  const canEdit = canManageWorkspace(subject.currentUserRole);
                  return (
                    <TableRow
                      className="cursor-pointer"
                      key={subject._id}
                      onClick={() => navigate(`/subjects/${subject._id}`)}
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border"
                            style={{
                              backgroundColor: `${subjectColor}18`,
                              color: subjectColor,
                            }}
                          >
                            <FolderOpen className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-bold">
                              {subject.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {subjectMeta(subject)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border ${roleTone(subject.currentUserRole)}`}
                          variant="outline"
                        >
                          {subject.currentUserRole ?? "No access"}
                        </Badge>
                      </TableCell>
                      <TableCell>{subject.memberCount ?? 1}</TableCell>
                      <TableCell>{subject.teamCount ?? 0}</TableCell>
                      <TableCell>{subject.documentCount ?? 0}</TableCell>
                      <TableCell>
                        {formatDate(subject.updatedAt ?? subject.createdAt)}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => navigate(`/subjects/${subject._id}`)}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
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
              Create a subject folder to manage documents, teams, and access
              control.
            </p>
            <Button onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Create subject workspace
            </Button>
          </div>
        ) : null}
      </section>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSubject
                  ? "Edit subject workspace"
                  : "Create subject workspace"}
              </DialogTitle>
              <DialogDescription>
                Subject workspaces behave like Drive folders with members,
                teams, documents, and access rules.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <label className="grid gap-2 text-sm font-bold">
                Name
                <Input
                  disabled={isSaving}
                  maxLength={120}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  value={form.name}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Code
                <Input
                  disabled={isSaving}
                  maxLength={40}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })
                  }
                  value={form.code}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Semester
                <Input
                  disabled={isSaving}
                  maxLength={80}
                  onChange={(event) =>
                    setForm({ ...form, semester: event.target.value })
                  }
                  placeholder="Fall 2026"
                  value={form.semester}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Description
                <Textarea
                  disabled={isSaving}
                  maxLength={1000}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  value={form.description}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Color
                <div className="flex gap-3">
                  <Input
                    className="w-16 p-1"
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm({ ...form, color: event.target.value })
                    }
                    type="color"
                    value={previewColor}
                  />
                  <Input
                    disabled={isSaving}
                    onChange={(event) =>
                      setForm({ ...form, color: event.target.value })
                    }
                    value={form.color}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/55 px-3 py-2">
                  <span
                    className="inline-flex max-w-48 items-center justify-center rounded-full border-[1.5px] px-3 py-1.5 font-mono text-xs font-extrabold leading-none shadow-[inset_0_-8px_14px_rgb(73_107_85/0.05)]"
                    style={
                      {
                        "--subject-color": previewColor,
                        borderColor: "var(--subject-color, var(--primary))",
                        background:
                          "color-mix(in srgb, var(--subject-color, var(--primary)) 13%, var(--background))",
                      } as CSSProperties
                    }
                  >
                    {previewCode}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {previewColor}
                  </span>
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

      <Dialog
        open={Boolean(deletingSubject)}
        onOpenChange={(open) =>
          !open && !isDeleting && setDeletingSubject(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subject workspace?</DialogTitle>
            <DialogDescription>
              This moves documents in this subject to trash and removes teams,
              members, and document access grants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
              {isDeleting ? "Deleting..." : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
