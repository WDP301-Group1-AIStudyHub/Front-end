import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
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
} from "@/services/chatApi";
import type {
  BenchmarkDifficulty,
  BenchmarkQuestion,
  BenchmarkSummary,
} from "@/types/chat";

type TabKey = "all" | "mine" | "recent" | "review";

const emptySummary: BenchmarkSummary = {
  averageAnswerCorrectness: 0,
  averageCompleteness: 0,
  averageFaithfulness: 0,
  averageRelevance: 0,
  averageScore: 0,
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
  mist: "bg-muted",
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
    <article
      className={`border border-border p-4 text-foreground transition-all ${bgClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase text-foreground/75">
            {label}
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground">
          {icon}
        </div>
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
    <PageShell>
      <PageHeader
        title="Evaluation"
        description={
          <>
            <span className="block">
              Create benchmark questions with expected answers, then score the
              DR-RAG pipeline.
            </span>
            <span className="mt-1 block text-xs">
              {questions.length} questions across {subjectCount || 0} subjects.
            </span>
          </>
        }
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              to="/evaluation/summary"
            >
              <BarChart3 className="size-4" />
              Summary
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-bold text-primary-foreground transition-all hover:bg-[color-mix(in_oklab,var(--primary),black_12%)] active:scale-[0.98]"
              to="/evaluation/new"
            >
              <Plus className="size-4" />
              New Question
            </Link>
          </>
        }
      />

      {error && (
        <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-destructive/10 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 font-bold">
            <AlertCircle className="size-4" />
            {error}
          </span>
          <Button
            onClick={loadBenchmarkData}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Retry
          </Button>
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
          label="Avg score"
          tone="coral"
          value={percent(summary.averageScore)}
        />
        <StatCard
          icon={<Sparkles />}
          label="Correctness"
          tone="teal"
          value={percent(summary.averageAnswerCorrectness)}
        />
        <StatCard
          icon={<Trophy />}
          label="Relevance"
          tone="gold"
          value={percent(summary.averageRelevance)}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Faithfulness"
          tone="mist"
          value={percent(summary.averageFaithfulness)}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Completeness"
          tone="emerald"
          value={percent(summary.averageCompleteness)}
        />
      </section>

      <section className="overflow-hidden border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Button
                aria-pressed={activeTab === tab.key}
                className="shrink-0 px-4 text-xs"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                variant={activeTab === tab.key ? "default" : "outline"}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
              <input
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm font-bold text-foreground outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search benchmark questions..."
                value={query}
              />
            </label>
            <Select
              value={difficultyFilter}
              onValueChange={(val) =>
                setDifficultyFilter(val as "all" | BenchmarkDifficulty)
              }
            >
              <SelectTrigger className="h-10 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={subjectFilter}
              onValueChange={(val) => setSubjectFilter(val)}
            >
              <SelectTrigger className="h-10 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center p-8">
            <Loader2 className="size-7 animate-spin text-foreground" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="grid min-h-64 place-items-center p-8 text-center bg-card">
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <FileText className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No benchmark questions found</EmptyTitle>
                <EmptyDescription>
                  Create a question with an expected answer, then run it through
                  DR-RAG.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="divide-y divide-border bg-card">
            {filteredQuestions.map((question) => {
              return (
                <article
                  className="relative grid gap-3 bg-white p-4 text-foreground transition-colors hover:bg-muted/40 md:grid-cols-[130px_minmax(0,1fr)_190px_150px] md:items-center"
                  key={question.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${difficultyStyles[question.difficulty]}`}
                      >
                        {question.difficulty}
                      </span>
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        #{question.id.substring(0, 8)}
                      </p>
                    </div>
                    <Button
                      aria-label="Question actions"
                      aria-expanded={openMenuQuestionId === question.id}
                      className="shrink-0"
                      onClick={() =>
                        setOpenMenuQuestionId((currentId) =>
                          currentId === question.id ? null : question.id,
                        )
                      }
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                    {openMenuQuestionId === question.id && (
                      <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-border bg-card p-1 shadow-sm">
                        <Button
                          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletingQuestionId === question.id}
                          onClick={() => {
                            setConfirmDeleteQuestion(question);
                            setOpenMenuQuestionId(null);
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 data-icon="inline-start" aria-hidden="true" />
                          Delete question
                        </Button>
                      </div>
                    )}
                  </div>

                  <h2 className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">
                    {question.question}
                  </h2>

                  <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate">
                      {question.subject ||
                        question.documentTitle ||
                        "No subject"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 text-sm">
                    <div className="min-w-0 text-foreground/60"></div>
                    <Link
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted active:translate-y-px"
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
            className="w-full max-w-md rounded-[20px] border border-border bg-card p-5 shadow-sm"
            role="dialog"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-destructive/10 text-foreground">
                <Trash2 className="size-5" />
              </div>
              <div className="min-w-0">
                <h2
                  className="text-lg font-black text-foreground"
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
              <Button
                className="px-4"
                disabled={deletingQuestionId === confirmDeleteQuestion.id}
                onClick={() => setConfirmDeleteQuestion(null)}
                size="lg"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="px-4"
                disabled={deletingQuestionId === confirmDeleteQuestion.id}
                onClick={handleDeleteQuestion}
                size="lg"
                type="button"
                variant="destructive"
              >
                {deletingQuestionId === confirmDeleteQuestion.id ? (
                  <Loader2
                    data-icon="inline-start"
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                )}
                Delete question
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
