import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  deleteBenchmarkQuestion,
  getBenchmarkQuestions,
  getBenchmarkSummary,
} from "../../services/chatApi";
import type {
  BenchmarkDifficulty,
  BenchmarkQuestion,
  BenchmarkSummary,
} from "../../types/chat";

type TabKey = "all" | "mine" | "recent" | "review";

const emptySummary: BenchmarkSummary = {
  averageBasicScore: 0,
  averageCorrectiveScore: 0,
  basicWinRate: 0,
  correctnessImprovement: 0,
  correctiveWinRate: 0,
  faithfulnessImprovement: 0,
  totalRuns: 0,
};

const difficultyStyles: Record<BenchmarkDifficulty, string> = {
  easy: "border border-border bg-card text-foreground",
  hard: "border border-border bg-destructive/10 text-foreground",
  medium: "border border-border bg-muted text-foreground",
};


function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function stringFrom(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeScore(value: unknown): number {
  const numeric = numberFrom(value);
  return numeric > 1 ? numeric / 100 : numeric;
}

function percent(value: unknown): string {
  return `${Math.round(normalizeScore(value) * 100)}%`;
}

function signedPercent(value: unknown): string {
  const normalized = normalizeScore(value);
  const sign = normalized > 0 ? "+" : "";
  return `${sign}${Math.round(normalized * 100)}%`;
}


function shortenText(value: string, maxLength = 120): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}



function getLastRunAt(question: BenchmarkQuestion): string | undefined {
  const record = asRecord(question);
  return stringFrom(
    record.lastRunAt ?? record.lastRun ?? record.lastRunDate,
    undefined as unknown as string,
  );
}

const toneColors: Record<string, string> = {
  blue: "bg-card",
  coral: "bg-destructive/10",
  teal: "bg-card",
  gold: "bg-muted",
  violet: "bg-muted",
  emerald: "bg-card",
};

function StatCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: string;
  value: string;
}) {
  const bgClass = toneColors[tone] || "bg-card";
  return (
    <article className={`celestial-card ${bgClass} border border-border text-foreground  p-4 hover:-translate-x-[2px] hover:-translate-y-[2px] hover: transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground/75">
            {label}
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
        </div>
        <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground">{icon}</div>
      </div>
    </article>
  );
}


export default function EvaluationPage() {
  const [questions, setQuestions] = useState<BenchmarkQuestion[]>([]);
  const [summary, setSummary] = useState<BenchmarkSummary>(emptySummary);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | BenchmarkDifficulty
  >("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(
    null,
  );
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] =
    useState<BenchmarkQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );

  const subjectCount = useMemo(
    () =>
      new Set(questions.map((question) => question.subject).filter(Boolean))
        .size,
    [questions],
  );

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          questions
            .map((question) => question.subject)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [questions],
  );

  const tabs = useMemo(
    () => [
      { key: "all" as const, label: `All (${questions.length})` },
      {
        key: "mine" as const,
        label: `My questions (${questions.filter((q) => q.createdBy).length})`,
      },
      {
        key: "recent" as const,
        label: `Recently run (${questions.filter((q) => getLastRunAt(q)).length})`,
      },
      {
        key: "review" as const,
        label: `Needs review (${questions.filter((q) => q.needsReview).length})`,
      },
    ],
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return questions.filter((question) => {
      if (activeTab === "mine" && !question.createdBy) return false;
      if (activeTab === "recent" && !getLastRunAt(question)) return false;
      if (activeTab === "review" && !question.needsReview) return false;
      if (
        difficultyFilter !== "all" &&
        question.difficulty !== difficultyFilter
      )
        return false;
      if (subjectFilter !== "all" && question.subject !== subjectFilter)
        return false;
      if (!normalizedQuery) return true;

      return [
        question.question,
        question.expectedAnswer,
        question.subject,
        question.documentTitle,
        question.id,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [activeTab, difficultyFilter, query, questions, subjectFilter]);

  async function loadBenchmarkData() {
    setError(null);
    setLoading(true);

    try {
      const [questionList, summaryData] = await Promise.all([
        getBenchmarkQuestions(),
        getBenchmarkSummary(),
      ]);
      setQuestions(questionList);
      setSummary(summaryData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load benchmark data",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!confirmDeleteQuestion) return;

    setDeletingQuestionId(confirmDeleteQuestion.id);
    setError(null);

    try {
      await deleteBenchmarkQuestion(confirmDeleteQuestion.id);
      setQuestions((currentQuestions) =>
        currentQuestions.filter(
          (question) => question.id !== confirmDeleteQuestion.id,
        ),
      );
      setConfirmDeleteQuestion(null);
      setOpenMenuQuestionId(null);
      const summaryData = await getBenchmarkSummary();
      setSummary(summaryData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete question",
      );
    } finally {
      setDeletingQuestionId(null);
    }
  }

  useEffect(() => {
    loadBenchmarkData();
  }, []);

  return (
    <main className="celestial-page min-h-svh overflow-y-auto bg-card p-5 md:p-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl text-foreground uppercase">
              Evaluation
            </h1>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Create benchmark questions with expected answers, then run them through Basic RAG and Corrective RAG to compare performance.
            </p>
            <p className="mt-2 text-xs font-bold text-foreground/60">
              {questions.length} questions across {subjectCount || 0} subjects.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-extrabold text-foreground  hover:bg-gray-100 active:translate-x-[1px] active:translate-y-[1px] active: transition-all"
              to="/evaluation/summary"
            >
              <BarChart3 className="size-4" />
              Summary
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 text-sm font-extrabold text-foreground  hover:bg-muted/90 active:translate-x-[1px] active:translate-y-[1px] active: transition-all"
              to="/evaluation/new"
            >
              <Plus className="size-4" />
              New question
            </Link>
          </div>
        </header>

        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-destructive/10 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between ">
            <span className="inline-flex items-center gap-2 font-bold">
              <AlertCircle className="size-4" />
              {error}
            </span>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-1 font-extrabold text-foreground  hover:bg-gray-100"
              onClick={loadBenchmarkData}
              type="button"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            icon={<Gauge />}
            label="Total runs"
            tone="blue"
            value={String(summary.totalRuns)}
          />
          <StatCard
            icon={<BarChart3 />}
            label="Avg basic"
            tone="coral"
            value={percent(summary.averageBasicScore)}
          />
          <StatCard
            icon={<Sparkles />}
            label="Avg corrective"
            tone="teal"
            value={percent(summary.averageCorrectiveScore)}
          />
          <StatCard
            icon={<Trophy />}
            label="Corrective wins"
            tone="gold"
            value={percent(summary.correctiveWinRate)}
          />
          <StatCard
            icon={<CheckCircle2 />}
            label="Faithfulness"
            tone="violet"
            value={signedPercent(summary.faithfulnessImprovement)}
          />
          <StatCard
            icon={<CheckCircle2 />}
            label="Correctness"
            tone="emerald"
            value={signedPercent(summary.correctnessImprovement)}
          />
        </section>

        <section className="celestial-panel overflow-hidden border border-border bg-card  rounded-xl">
          <div className="flex flex-col gap-4 border-b border-border p-4 bg-gray-55">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  className={`h-9 shrink-0 rounded-lg border border-border px-4 text-xs font-black uppercase tracking-wider transition  ${
                    activeTab === tab.key
                      ? "bg-muted text-foreground"
                      : "bg-card text-foreground hover:bg-gray-100"
                  }`}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
                <input
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm font-bold text-foreground outline-none  focus:"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search benchmark questions..."
                  value={query}
                />
              </label>
              <select
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground outline-none "
                onChange={(event) =>
                  setDifficultyFilter(
                    event.target.value as "all" | BenchmarkDifficulty,
                  )
                }
                value={difficultyFilter}
              >
                <option value="all">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground outline-none "
                onChange={(event) => setSubjectFilter(event.target.value)}
                value={subjectFilter}
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-64 place-items-center p-8">
              <Loader2 className="size-7 animate-spin text-foreground" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-8 text-center bg-card">
              <div>
                <FileText className="mx-auto size-9 text-foreground" />
                <h2 className="mt-3 text-lg font-black uppercase text-foreground">
                  No benchmark questions found
                </h2>
                <p className="mt-1 max-w-md text-sm font-bold text-muted-foreground">
                  Create a question with an expected answer, then run it through Basic RAG and Corrective RAG.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 bg-card">
              {filteredQuestions.map((question) => {
                return (
                  <article
                    className="celestial-card bg-card border border-border text-foreground  relative flex min-h-[230px] flex-col p-5 hover:-translate-x-[2px] hover:-translate-y-[2px] hover: transition-all"
                    key={question.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${difficultyStyles[question.difficulty]}`}
                        >
                          {question.difficulty}
                        </span>
                        <p className="mt-3 text-xs font-black text-foreground/60">
                          #{question.id.substring(0, 8)}
                        </p>
                      </div>
                      <button
                        aria-label="Question actions"
                        aria-expanded={openMenuQuestionId === question.id}
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground  hover:bg-gray-100"
                        onClick={() =>
                          setOpenMenuQuestionId((currentId) =>
                            currentId === question.id ? null : question.id,
                          )
                        }
                        type="button"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {openMenuQuestionId === question.id && (
                        <div className="absolute right-4 top-12 z-20 w-44 rounded-lg border border-border bg-card p-1 ">
                          <button
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-extrabold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                            disabled={deletingQuestionId === question.id}
                            onClick={() => {
                              setConfirmDeleteQuestion(question);
                              setOpenMenuQuestionId(null);
                            }}
                            type="button"
                          >
                            <Trash2 className="size-4" />
                            Delete question
                          </button>
                        </div>
                      )}
                    </div>

                    <h2 className="mt-3 line-clamp-3 min-h-[4.5rem] text-base font-extrabold leading-6 text-foreground uppercase">
                      {question.question}
                    </h2>

                    <div className="mt-3 flex min-w-0 items-center gap-2 text-sm font-bold text-muted-foreground">
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate">
                        {question.subject ||
                          question.documentTitle ||
                          "No subject"}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
                      <div className="min-w-0 text-foreground/60">
                      </div>
                      <Link
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card text-foreground  px-3 text-xs font-extrabold hover:bg-gray-100 active:translate-x-[1px] active:translate-y-[1px] active:"
                        to={`/evaluation/run/${question.id}`}
                      >
                        <RefreshCw className="size-4" />
                        Run benchmark
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {confirmDeleteQuestion && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
            <div
              aria-labelledby="delete-benchmark-question-title"
              aria-modal="true"
              className="w-full max-w-md rounded-xl border border-border bg-card p-5 "
              role="dialog"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-destructive/10 text-foreground">
                  <Trash2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg font-black text-foreground uppercase"
                    id="delete-benchmark-question-title"
                  >
                    Delete question?
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
                    This will delete "
                    {shortenText(confirmDeleteQuestion.question)}
                    ". Benchmark run history may also be removed.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-extrabold text-foreground  hover:bg-gray-100"
                  disabled={deletingQuestionId === confirmDeleteQuestion.id}
                  onClick={() => setConfirmDeleteQuestion(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-destructive/10 px-4 text-sm font-extrabold text-foreground  hover:bg-destructive/10/90"
                  disabled={deletingQuestionId === confirmDeleteQuestion.id}
                  onClick={handleDeleteQuestion}
                  type="button"
                >
                  {deletingQuestionId === confirmDeleteQuestion.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Delete question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
