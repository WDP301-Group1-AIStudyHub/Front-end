import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronLeft,
  FileText,
  Loader2,
  Play,
  Save,
} from "lucide-react";
import {
  createBenchmarkQuestion,
  getBenchmarkQuestions,
} from "../../services/chatApi";
import { listDocuments } from "../../services/documentApi";
import type {
  BenchmarkDifficulty,
  BenchmarkQuestion,
  CreateBenchmarkQuestionPayload,
} from "../../types/chat";
import type { DocumentItem } from "../../types/document";

type ScopeMode = "document" | "subject";

type DraftState = {
  difficulty: BenchmarkDifficulty;
  documentId: string;
  expectedAnswer: string;
  question: string;
  runImmediately: boolean;
  scope: ScopeMode;
  subject: string;
};

const DRAFT_KEY = "ai-study-hub:benchmark-question-draft";

const initialDraft: DraftState = {
  difficulty: "medium",
  documentId: "",
  expectedAnswer: "",
  question: "",
  runImmediately: true,
  scope: "document",
  subject: "",
};

const difficultyOptions: Array<{
  label: string;
  value: BenchmarkDifficulty;
}> = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
];

function readDraft(): DraftState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return initialDraft;
    const parsed = JSON.parse(raw) as Partial<DraftState>;
    return {
      ...initialDraft,
      ...parsed,
      difficulty:
        parsed.difficulty === "easy" ||
        parsed.difficulty === "medium" ||
        parsed.difficulty === "hard"
          ? parsed.difficulty
          : initialDraft.difficulty,
      scope: parsed.scope === "subject" ? "subject" : "document",
      runImmediately:
        typeof parsed.runImmediately === "boolean"
          ? parsed.runImmediately
          : initialDraft.runImmediately,
    };
  } catch {
    return initialDraft;
  }
}

function trimPayload(form: DraftState): CreateBenchmarkQuestionPayload {
  return {
    difficulty: form.difficulty,
    expectedAnswer: form.expectedAnswer.trim(),
    question: form.question.trim(),
    ...(form.scope === "document"
      ? { documentId: form.documentId.trim() }
      : { subject: form.subject.trim() }),
  };
}

function findCreatedQuestion(
  questions: BenchmarkQuestion[],
  payload: CreateBenchmarkQuestionPayload,
): BenchmarkQuestion | undefined {
  return [...questions].reverse().find((question) => {
    const sameText =
      question.question.trim() === payload.question.trim() &&
      question.expectedAnswer.trim() === payload.expectedAnswer.trim();
    const sameScope = payload.documentId
      ? question.documentId === payload.documentId
      : question.subject === payload.subject;

    return sameText && sameScope;
  });
}

function FieldShell({
  children,
  description,
  label,
}: {
  children: ReactNode;
  description: string;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      {children}
    </label>
  );
}

export default function NewQuestion() {
  const navigate = useNavigate();
  const [form, setForm] = useState<DraftState>(() => readDraft());
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === form.documentId),
    [documents, form.documentId],
  );

  useEffect(() => {
    let mounted = true;

    setDocumentsLoading(true);
    listDocuments()
      .then((items) => {
        if (!mounted) return;
        setDocuments(items);
        setDocumentsError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setDocumentsError(
          err instanceof Error ? err.message : "Failed to load documents",
        );
      })
      .finally(() => {
        if (mounted) setDocumentsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 1800);
  }

  function validate(): string | null {
    if (!form.question.trim()) return "Question is required.";
    if (!form.expectedAnswer.trim()) return "Expected answer is required.";
    if (form.scope === "document" && !form.documentId.trim()) {
      return "Select a source document.";
    }
    if (form.scope === "subject" && !form.subject.trim()) {
      return "Subject is required.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = trimPayload(form);
    setSaving(true);
    setError(null);

    try {
      const created = await createBenchmarkQuestion(payload);
      let createdId = created?.id;

      if (!createdId && form.runImmediately) {
        const questions = await getBenchmarkQuestions();
        createdId = findCreatedQuestion(questions, payload)?.id;
      }

      if (form.runImmediately) {
        if (!createdId) {
          throw new Error(
            "Question was saved, but the new question id was not returned.",
          );
        }
      }

      localStorage.removeItem(DRAFT_KEY);
      navigate(
        form.runImmediately && createdId
          ? `/evaluation/run/${createdId}`
          : "/evaluation",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save benchmark question",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="botanical-page min-h-svh overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <form
        className="mx-auto flex w-full max-w-[1180px] flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <header className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Link className="hover:text-foreground" to="/evaluation">
                <span>Benchmark</span>
              </Link>
              <span>/</span>
              <Link className="hover:text-foreground" to="/evaluation">
                Questions
              </Link>
              <span>/</span>
              <span className="text-foreground">New</span>
              <span className="ml-2 rounded-full border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">
                v0.4 - dev
              </span>
            </div>
            <h1 className="moonlit-title text-3xl font-semibold tracking-tight md:text-4xl">
              New Benchmark Question
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Define a ground-truth question the system can be tested against.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              to="/evaluation"
            >
              <ChevronLeft className="size-4" />
              Cancel
            </Link>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 text-sm font-semibold transition hover:border-primary"
              onClick={saveDraft}
              type="button"
            >
              {draftSaved ? (
                <Check className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {draftSaved ? "Draft saved" : "Save draft"}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Save & run
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="moonlit-panel grid gap-5 p-4 md:p-5">
          <FieldShell
            description="The question you'd ask the chatbot. Phrase it like a real student would."
            label="Question"
          >
            <textarea
              className="min-h-36 resize-y rounded-lg border border-input bg-background/70 px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  question: event.target.value,
                }))
              }
              placeholder="Giải thích định luật Newton thứ ba và cho ví dụ"
              value={form.question}
            />
            <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Tip: longer or ambiguous questions tend to reveal Corrective RAG's
              advantage.
            </p>
          </FieldShell>

          <FieldShell
            description="The factually correct answer that an ideal RAG response should match. Used by the LLM judge for scoring correctness, faithfulness, relevance and completeness."
            label="Expected answer (ground truth)"
          >
            <textarea
              className="min-h-40 resize-y rounded-lg border border-input bg-background/70 px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expectedAnswer: event.target.value,
                }))
              }
              placeholder="Provide the ideal answer with enough detail for objective scoring."
              value={form.expectedAnswer}
            />
          </FieldShell>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="moonlit-panel grid gap-5 p-4 md:p-5">
            <div>
              <h2 className="text-lg font-semibold">Scope</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose whether this benchmark question targets a specific
                document or a broader subject.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/70 bg-muted/20 p-1">
              {(["document", "subject"] as ScopeMode[]).map((scope) => (
                <button
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                    form.scope === scope
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={scope}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      scope,
                    }))
                  }
                  type="button"
                >
                  {scope === "document" ? (
                    <FileText className="size-4" />
                  ) : (
                    <BookOpen className="size-4" />
                  )}
                  {scope === "document" ? "Document" : "Subject"}
                </button>
              ))}
            </div>

            {form.scope === "document" ? (
              <FieldShell
                description="Picks the doc the question should be answered from."
                label="Source document"
              >
                <select
                  className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-primary"
                  disabled={documentsLoading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      documentId: event.target.value,
                    }))
                  }
                  value={form.documentId}
                >
                  <option value="">
                    {documentsLoading
                      ? "Loading documents..."
                      : "Select source document"}
                  </option>
                  {documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
                {documentsError && (
                  <p className="text-xs text-destructive">{documentsError}</p>
                )}
                {selectedDocument && (
                  <p className="text-xs text-muted-foreground">
                    {(typeof selectedDocument.subject === 'object' ? selectedDocument.subject?.name : selectedDocument.subject) || selectedDocument.fileName}
                  </p>
                )}
              </FieldShell>
            ) : (
              <FieldShell
                description="Use a subject when the benchmark should not be tied to one document."
                label="Subject"
              >
                <input
                  className="h-11 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-primary"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  placeholder="CS / Algorithms"
                  value={form.subject}
                />
              </FieldShell>
            )}
          </div>

          <aside className="moonlit-panel grid content-start gap-5 p-4 md:p-5">
            <div>
              <h2 className="text-lg font-semibold">Difficulty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick the expected challenge level for reporting.
              </p>
            </div>

            <div className="grid gap-2">
              {difficultyOptions.map((option) => (
                <button
                  className={`flex h-11 items-center justify-between rounded-lg border px-3 text-sm font-semibold transition ${
                    form.difficulty === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  key={option.value}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      difficulty: option.value,
                    }))
                  }
                  type="button"
                >
                  {option.label}
                  {form.difficulty === option.value && (
                    <Check className="size-4" />
                  )}
                </button>
              ))}
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
              <input
                checked={form.runImmediately}
                className="mt-1 size-4 accent-primary"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    runImmediately: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>
                <span className="block font-semibold">
                  Run benchmark immediately after saving
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Runs Basic RAG and Corrective RAG once the question is
                  created.
                </span>
              </span>
            </label>
          </aside>
        </section>
      </form>
    </main>
  );
}
