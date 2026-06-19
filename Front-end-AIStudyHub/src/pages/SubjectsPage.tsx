import { useEffect, useMemo, useState } from "react";
import { BookMarked, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from "../services/subjectApi";
import type { SubjectItem, SubjectPayload } from "../services/subjectApi";
import {
  DEFAULT_SUBJECT_COLOR,
  normalizeSubjectColor,
} from "../utils/subjectColor";

type SubjectForm = {
  name: string;
  code: string;
  description: string;
  color: string;
};

const emptyForm: SubjectForm = {
  name: "",
  code: "",
  description: "",
  color: DEFAULT_SUBJECT_COLOR,
};

function formatDate(value?: string): string {
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

export default function SubjectsPage() {
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
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const sortedSubjects = useMemo(
    () =>
      [...subjects].sort((a, b) =>
        [a.code, a.name]
          .filter(Boolean)
          .join(" ")
          .localeCompare([b.code, b.name].filter(Boolean).join(" ")),
      ),
    [subjects],
  );

  async function loadSubjects() {
    setIsLoading(true);
    setFeedback(null);
    try {
      setSubjects(await listSubjects());
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
      description: subject.description ?? "",
      color: normalizeSubjectColor(subject.color),
    });
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ tone: "error", message: "Subject name is required" });
      return;
    }

    const payload: SubjectPayload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
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
            subject._id === editingSubject._id ? updated : subject,
          ),
        );
        setFeedback({
          tone: "success",
          message: "Subject updated successfully",
        });
      } else {
        const created = await createSubject(payload);
        setSubjects((current) => [created, ...current]);
        setFeedback({
          tone: "success",
          message: "Subject created successfully",
        });
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
      setFeedback({ tone: "success", message: "Subject deleted successfully" });
    } catch (error) {
      setFeedback({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsDeleting(false);
    }
  }

  const previewColor = normalizeSubjectColor(form.color);
  const previewCode = form.code.trim() || "CODE";

  return (
    <main className="botanical-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="botanical-kicker">Study workspace</p>
            <h1 className="moonlit-title mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Subjects
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Give every course a clear color so documents and chat context stay easy to scan.
            </p>
          </div>
          <Button onClick={openCreate} type="button">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add subject
          </Button>
        </header>

        {feedback ? (
          feedback.tone === "error" ? (
            <div
              className="moonlit-card tone-surface tone-coral px-4 py-3 text-sm"
              role="alert"
            >
              {feedback.message}
            </div>
          ) : (
            <div
              className="moonlit-card tone-surface tone-emerald px-4 py-3 text-sm"
              role="status"
            >
              {feedback.message}
            </div>
          )
        ) : null}

        <section className="moonlit-card moonlit-table tone-surface tone-sapphire overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-56" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                : sortedSubjects.map((subject) => {
                    const subjectColor = normalizeSubjectColor(subject.color);

                    return (
                      <TableRow key={subject._id}>
                        <TableCell className="font-bold">
                          {subject.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className="subject-code-pill"
                            style={
                              {
                                "--subject-color": subjectColor,
                              } as React.CSSProperties
                            }
                            title={subjectColor}
                          >
                            {subject.code || "No code"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-sm truncate">
                          {subject.description || "No description"}
                        </TableCell>
                        <TableCell>{formatDate(subject.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              aria-label={`Edit ${subject.name}`}
                              onClick={() => openEdit(subject)}
                              size="icon-sm"
                              type="button"
                              variant="secondary"
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
                    );
                  })}
            </TableBody>
          </Table>

          {!isLoading && sortedSubjects.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
              <BookMarked className="size-9" aria-hidden="true" />
              <h2 className="text-xl font-black">No subjects yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Create a subject to organize documents and improve search.
              </p>
              <Button onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add subject
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Edit subject" : "Add subject"}
              </DialogTitle>
              <DialogDescription>
                Organize documents by course, module, or study area.
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
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/55 px-3 py-2">
                  <span
                    className="subject-code-pill"
                    style={
                      {
                        "--subject-color": previewColor,
                      } as React.CSSProperties
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
                {isSaving ? "Saving..." : "Save subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingSubject)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingSubject(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subject?</DialogTitle>
            <DialogDescription>
              Subjects linked to documents cannot be deleted. The backend will
              preserve them and return an error.
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
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
