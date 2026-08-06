import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { runBenchmarkQuestion } from "@/services/chatApi";
import type {
  BenchmarkEvaluationScore,
  BenchmarkRunResult,
  BenchmarkScores,
} from "@/types/chat";

type MetricKey = keyof Omit<BenchmarkScores, "totalScore">;

const metricKeys: MetricKey[] = [
  "correctness",
  "faithfulness",
  "relevance",
  "completeness",
];

const metricLabels: Record<keyof BenchmarkScores, string> = {
  completeness: "Completeness",
  correctness: "Correctness",
  faithfulness: "Faithfulness",
  relevance: "Relevance",
  totalScore: "Overall",
};

function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeScore(value: unknown): number {
  const numeric = numberFrom(value);
  return numeric > 1 ? numeric / 100 : numeric;
}

function percent(value: unknown): string {
  return `${Math.round(normalizeScore(value) * 100)}%`;
}

function scoreText(value: unknown): string {
  return normalizeScore(value).toFixed(2);
}

function formatDate(value?: string): string {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

function normalizeScores(evaluation: BenchmarkEvaluationScore): BenchmarkScores {
  return {
    completeness: normalizeScore(evaluation.completeness),
    correctness: normalizeScore(evaluation.answerCorrectness),
    faithfulness: normalizeScore(evaluation.faithfulness),
    relevance: normalizeScore(evaluation.relevance),
    totalScore: normalizeScore(evaluation.overallScore),
  };
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={className}>{children}</section>;
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{scoreText(value)}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${normalizeScore(value) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ExplanationPanel({ explanation }: { explanation?: string }) {
  return (
    <Panel className="p-4 md:p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <CheckCircle2 className="size-4" />
        Judge explanation
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
        {explanation || "No explanation returned."}
      </p>
    </Panel>
  );
}

export default function RunBenchmark() {
  const { questionId = "" } = useParams();
  const [result, setResult] = useState<BenchmarkRunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBenchmark = useCallback(
    async (isRerun = false) => {
      if (!questionId) {
        setError("Missing benchmark question id.");
        setLoading(false);
        return;
      }

      if (isRerun) setRerunning(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await runBenchmarkQuestion(questionId);
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to run benchmark");
      } finally {
        setLoading(false);
        setRerunning(false);
      }
    },
    [questionId],
  );

  useEffect(() => {
    runBenchmark();
  }, [runBenchmark]);

  const scores = useMemo(
    () => (result ? normalizeScores(result.evaluation) : null),
    [result],
  );

  function exportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `benchmark-run-${result.id || result.benchmarkQuestionId || questionId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <PageHeader
        title="Run Evaluation Benchmark"
        description="The benchmark runs the single DR-RAG pipeline and scores the generated answer."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/evaluation">
                <ChevronLeft className="size-4 mr-1" />
                Back
              </Link>
            </Button>
            <Button
              disabled={!result}
              onClick={exportJson}
              type="button"
              variant="outline"
            >
              <ArrowDownToLine className="size-4 mr-1" aria-hidden="true" />
              Export JSON
            </Button>
            <Button
              disabled={loading || rerunning}
              onClick={() => runBenchmark(true)}
              type="button"
            >
              <RefreshCw
                className={`size-4 mr-1 ${rerunning ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {rerunning ? "Running..." : "Re-run benchmark"}
            </Button>
          </div>
        }
      />

        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="size-4" />
              {error}
            </span>
            <Button
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => runBenchmark()}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <Panel className="grid min-h-80 place-items-center p-8">
            <div className="text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Running DR-RAG benchmark...
              </p>
            </div>
          </Panel>
        ) : result && scores ? (
          <>
            <section className="grid gap-4 md:grid-cols-[1fr_260px]">
              <Panel className="p-4 md:p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <FileText className="size-4" />
                  Expected Answer
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px]">
                    ground truth
                  </span>
                </div>
                <p className="text-sm leading-6 text-foreground/90">
                  {result.expectedAnswer || "No expected answer returned for this run."}
                </p>
              </Panel>

              <Panel className="tone-teal grid content-center gap-2 p-4 text-center md:p-5">
                <BarChart3 className="mx-auto size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Overall score
                </p>
                <p className="text-4xl font-semibold">{percent(scores.totalScore)}</p>
              </Panel>
            </section>

            <Panel className="grid gap-4 p-4 md:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  DR-RAG answer
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {result.answer}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metricKeys.map((key) => (
                  <ScoreCard key={key} label={metricLabels[key]} value={scores[key]} />
                ))}
              </div>
            </Panel>

            <ExplanationPanel explanation={result.evaluation.explanation} />
          </>
        ) : (
          <Panel className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto size-9 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-semibold">No benchmark result</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Run the benchmark again or return to the question list.
              </p>
            </div>
          </Panel>
        )}
    </PageShell>
  );
}
