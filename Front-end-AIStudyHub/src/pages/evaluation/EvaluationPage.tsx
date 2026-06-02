import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
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
  BenchmarkWinner,
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
  easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  hard: "border-red-500/30 bg-red-500/10 text-red-500",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
};

const winnerLabels: Record<BenchmarkWinner, string> = {
  basic: "Basic",
  corrective: "Corrective",
  not_run: "not run",
  tie: "Tie",
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

function compactDate(value?: string): string {
  if (!value) return "not run";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not run";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function shortenText(value: string, maxLength = 120): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function normalizeWinner(value: unknown): BenchmarkWinner {
  if (value === "basic" || value === "corrective" || value === "tie")
    return value;
  return "not_run";
}

function getRunCount(question: BenchmarkQuestion): number {
  const record = asRecord(question);
  return numberFrom(record.runCount ?? record.runs ?? record.totalRuns, 0);
}

function getLastWinner(question: BenchmarkQuestion): BenchmarkWinner {
  const record = asRecord(question);
  return normalizeWinner(record.lastWinner ?? record.winner);
}

function getLastRunAt(question: BenchmarkQuestion): string | undefined {
  const record = asRecord(question);
  return stringFrom(
    record.lastRunAt ?? record.lastRun ?? record.lastRunDate,
    undefined as unknown as string,
  );
}

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
  return (
    <article className={`celestial-card tone-surface tone-${tone} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`admin-icon-badge admin-tone-${tone}`}>{icon}</div>
      </div>
    </article>
  );
}

function WinnerBadge({ winner }: { winner: BenchmarkWinner }) {
  const isCorrective = winner === "corrective";
  const isBasic = winner === "basic";
  const classes = isCorrective
    ? "bg-teal-500/12 text-teal-500"
    : isBasic
      ? "bg-blue-500/12 text-blue-500"
      : winner === "tie"
        ? "bg-amber-500/12 text-amber-500"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${classes}`}
    >
      {(isCorrective || isBasic) && <ArrowUpRight className="size-3" />}
      {winnerLabels[winner]}
    </span>
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
        err instanceof Error
          ? err.message
          : "Failed to delete benchmark question",
      );
    } finally {
      setDeletingQuestionId(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError(null);
      setLoading(true);

      try {
        const [questionList, summaryData] = await Promise.all([
          getBenchmarkQuestions(),
          getBenchmarkSummary(),
        ]);
        if (!mounted) return;
        setQuestions(questionList);
        setSummary(summaryData);
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load benchmark data",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="celestial-page min-h-svh overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">
                v0.4 · dev
              </span>
            </div>
            <h1 className="celestial-title text-3xl font-semibold tracking-tight md:text-4xl">
              Evaluation
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create benchmark questions with expected answers, then run them
              <br />
              through Basic RAG and Corrective RAG to compare performance and
              improvements.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {questions.length} questions across {subjectCount || 0} subjects ·
              compare Basic RAG and Corrective RAG.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 text-sm font-semibold transition hover:border-primary"
              to="/evaluation/summary"
            >
              <BarChart3 className="size-4" />
              Summary
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              to="/evaluation/new"
            >
              <Plus className="size-4" />
              New question
            </Link>
          </div>
        </header>

        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="size-4" />
              {error}
            </span>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/40 px-3 py-2 font-semibold"
              onClick={loadBenchmarkData}
              type="button"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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

        <section className="celestial-panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border/70 p-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  className={`h-9 shrink-0 border-b px-3 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
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
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-lg border border-input bg-background/70 pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search benchmark questions..."
                  value={query}
                />
              </label>
              <select
                className="h-10 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-primary"
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
                className="h-10 rounded-lg border border-input bg-background/70 px-3 text-sm outline-none transition focus:border-primary"
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
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <FileText className="mx-auto size-9 text-muted-foreground" />
                <h2 className="mt-3 text-lg font-semibold">
                  No benchmark questions found
                </h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Create a question with an expected answer, then run it through
                  Basic RAG and Corrective RAG.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredQuestions.map((question) => {
                const winner = getLastWinner(question);
                const runCount = getRunCount(question);

                return (
                  <article
                    className="celestial-card tone-surface tone-blue relative flex min-h-[230px] flex-col p-4"
                    key={question.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${difficultyStyles[question.difficulty]}`}
                        >
                          {question.difficulty}
                        </span>
                        <p className="mt-3 text-xs font-semibold text-muted-foreground">
                          #{question.id}
                        </p>
                      </div>
                      <button
                        aria-label="Question actions"
                        aria-expanded={openMenuQuestionId === question.id}
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/70 text-muted-foreground transition hover:text-foreground"
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
                        <div className="absolute right-4 top-12 z-20 w-44 rounded-lg border border-border bg-background p-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
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

                    <h2 className="mt-3 line-clamp-3 min-h-[4.5rem] text-base font-semibold leading-6">
                      {question.question}
                    </h2>

                    <div className="mt-3 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate">
                        {question.subject ||
                          question.documentTitle ||
                          "No subject"}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
                      <div className="min-w-0 text-muted-foreground">
                        {/* <p>
                          <span className="font-semibold text-foreground">
                            {runCount}
                          </span>{" "}
                          runs · {compactDate(getLastRunAt(question))}
                        </p> */}
                        {/* <div className="mt-2">
                          <WinnerBadge winner={winner} />
                        </div> */}
                      </div>
                      <Link
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
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
          <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 px-4 backdrop-blur-sm">
            <div
              aria-labelledby="delete-benchmark-question-title"
              aria-modal="true"
              className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl"
              role="dialog"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg font-semibold"
                    id="delete-benchmark-question-title"
                  >
                    Delete benchmark question?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This will delete "
                    {shortenText(confirmDeleteQuestion.question)}
                    ". Benchmark run history may also be removed if the backend
                    cascades this deletion.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition hover:border-primary disabled:opacity-60"
                  disabled={deletingQuestionId === confirmDeleteQuestion.id}
                  onClick={() => setConfirmDeleteQuestion(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
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
