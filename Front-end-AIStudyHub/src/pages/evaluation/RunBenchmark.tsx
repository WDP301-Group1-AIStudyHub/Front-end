import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Loader2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { runBenchmarkQuestion } from "../../services/chatApi";
import type {
  BenchmarkDifficulty,
  BenchmarkModeResult,
  BenchmarkRetrievedChunk,
  BenchmarkRunResult,
  BenchmarkScores,
  BenchmarkWinner,
} from "../../types/chat";

type NormalizedBenchmarkRunResult = BenchmarkRunResult & {
  basic: BenchmarkModeResult;
  corrective: BenchmarkModeResult;
};

const metricKeys: Array<keyof Omit<BenchmarkScores, "totalScore">> = [
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

const winnerLabels: Record<BenchmarkWinner, string> = {
  basic: "Basic RAG",
  corrective: "Corrective RAG",
  not_run: "Not run",
  tie: "Tie",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeScore(value: unknown): number {
  const numeric = numberFrom(value);
  return numeric > 1 ? numeric / 100 : numeric;
}

function percent(value: unknown): string {
  return `${Math.round(normalizeScore(value) * 100)}%`;
}

function scoreDelta(corrective: number, basic: number): string {
  const delta = corrective - basic;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)}`;
}

function formatMs(value?: number): string {
  if (!value) return "time pending";
  return `${(value / 1000).toFixed(1)}s`;
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

function normalizeWinner(value: unknown): BenchmarkWinner {
  if (value === "basic" || value === "corrective" || value === "tie") {
    return value;
  }
  return "not_run";
}

function normalizeScores(value: unknown): BenchmarkScores {
  const score = asRecord(value);
  const total =
    score.totalScore ?? score.overallScore ?? score.total ?? score.score ?? score.overall;
  return {
    completeness: normalizeScore(score.completeness),
    correctness: normalizeScore(score.correctness ?? score.answerCorrectness),
    faithfulness: normalizeScore(score.faithfulness),
    relevance: normalizeScore(score.relevance),
    totalScore: normalizeScore(total),
  };
}

function normalizeList(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value];

  return asArray(value)
    .map((item) => (typeof item === "string" ? item : stringFrom(asRecord(item).text)))
    .filter(Boolean);
}

function normalizeExplanation(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function normalizeChunks(value: unknown): BenchmarkRetrievedChunk[] {
  return asArray(value).map((item) => {
    const chunk = asRecord(item);
    return {
      chunkIndex: numberFrom(chunk.chunkIndex ?? chunk.index ?? chunk.chunk),
      contentPreview: stringFrom(chunk.contentPreview ?? chunk.preview ?? chunk.content),
      documentTitle: stringFrom(chunk.documentTitle ?? chunk.title ?? chunk.documentName),
      page: numberFrom(chunk.page ?? chunk.pageNumber, undefined as unknown as number),
      relevanceScore: normalizeScore(chunk.relevanceScore ?? chunk.score),
    };
  });
}

function normalizeModeResult(value: unknown, fallbackAnswer: string): BenchmarkModeResult {
  const record = asRecord(value);
  const evaluation = asRecord(record.evaluation);
  const scores = normalizeScores(record.scores ?? evaluation ?? record);
  const chunks =
    record.retrievedChunks ??
    record.chunks ??
    record.sources ??
    evaluation.retrievedChunks ??
    [];

  return {
    answer: stringFrom(record.answer ?? record.response, fallbackAnswer),
    durationMs: numberFrom(
      record.durationMs ?? record.responseTimeMs ?? evaluation.responseTimeMs,
      undefined as unknown as number,
    ),
    explanation: normalizeExplanation(
      record.explanation,
      evaluation.explanation,
      record.reasoning,
      evaluation.reasoning,
      record.summary,
      evaluation.summary,
    ),
    groundingSummary: stringFrom(record.groundingSummary ?? record.groundingCheck),
    improvements: normalizeList(record.improvements),
    issues: normalizeList(record.issues ?? record.flags),
    relevantChunksCount: numberFrom(
      record.relevantChunksCount ?? evaluation.relevantChunksCount,
      undefined as unknown as number,
    ),
    retrievedChunks: normalizeChunks(chunks),
    retrievedChunksCount: numberFrom(
      record.retrievedChunksCount ?? evaluation.retrievedChunksCount,
      undefined as unknown as number,
    ),
    rewrittenQuery: stringFrom(record.rewrittenQuery ?? record.rewritten_query),
    scores,
  };
}

function normalizeRunResult(
  result: BenchmarkRunResult,
  fallbackQuestionId: string,
): NormalizedBenchmarkRunResult {
  const record = asRecord(result);
  const question =
    typeof record.question === "object"
      ? asRecord(record.question)
      : asRecord(record.questionData);
  const basicSource =
    record.basic ??
    record.basicResult ?? {
      answer: record.basicAnswer,
      evaluation: record.basicEvaluation,
    };
  const correctiveSource =
    record.corrective ??
    record.correctiveResult ?? {
      answer: record.correctiveAnswer,
      evaluation: record.correctiveEvaluation,
    };
  const basic = normalizeModeResult(
    basicSource,
    "No Basic RAG answer returned.",
  );
  const corrective = normalizeModeResult(
    correctiveSource,
    "No Corrective RAG answer returned.",
  );
  const durationMs =
    numberFrom(record.durationMs ?? record.totalDurationMs, 0) ||
    (basic.durationMs || 0) + (corrective.durationMs || 0);

  return {
    id: stringFrom(record.id ?? record.runId),
    basic,
    corrective,
    createdAt: stringFrom(record.createdAt ?? record.runAt),
    difficulty: stringFrom(record.difficulty ?? question.difficulty) as BenchmarkDifficulty,
    documentId: stringFrom(record.documentId ?? question.documentId),
    documentTitle: stringFrom(record.documentTitle ?? question.documentTitle ?? question.documentName),
    durationMs,
    expectedAnswer: stringFrom(record.expectedAnswer ?? question.expectedAnswer),
    question: stringFrom(
      record.questionText ??
        (typeof record.question === "string" ? record.question : undefined) ??
        question.question,
    ),
    questionId: stringFrom(
      record.questionId ?? record.benchmarkQuestionId ?? question.id,
      fallbackQuestionId,
    ),
    subject: stringFrom(record.subject ?? question.subject),
    winner: normalizeWinner(record.winner),
  };
}

function WinnerBadge({ winner }: { winner: BenchmarkWinner }) {
  const classes =
    winner === "corrective"
      ? "bg-teal-500/12 text-teal-500"
      : winner === "basic"
        ? "bg-blue-500/12 text-blue-500"
        : "bg-amber-500/12 text-amber-500";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${classes}`}>
      <Trophy className="size-4" />
      Winner: {winnerLabels[winner]}
    </span>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`celestial-panel ${className}`}>{children}</section>;
}

function ModeColumn({
  mode,
  result,
  tone,
}: {
  mode: string;
  result: BenchmarkModeResult;
  tone: string;
}) {
  const chunkCount =
    result.retrievedChunksCount ?? result.retrievedChunks?.length ?? 0;

  return (
    <Panel className={`tone-${tone} grid content-start gap-4 p-4 md:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {mode}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMs(result.durationMs)} · {chunkCount} chunks
          </p>
        </div>
        <p className="text-2xl font-semibold tone-text">
          {percent(result.scores.totalScore)}
        </p>
      </div>

      <p className="text-sm leading-6 text-foreground/90">{result.answer}</p>

      <ExplanationPanel explanation={result.explanation} />

      <CalloutList
        emptyLabel={mode === "Basic RAG" ? "No issues returned." : "No improvements returned."}
        items={mode === "Basic RAG" ? result.issues : result.improvements}
        title={mode === "Basic RAG" ? "Issues flagged" : "Improvements"}
      />

      <ChunkList chunks={result.retrievedChunks ?? []} />
    </Panel>
  );
}

function ExplanationPanel({ explanation }: { explanation?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Evaluation explanation
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
        {explanation || "No explanation returned."}
      </p>
    </div>
  );
}

function CalloutList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items?: string[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {items && items.length > 0 ? (
        <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li className="flex gap-2" key={item}>
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function ChunkList({ chunks }: { chunks: BenchmarkRetrievedChunk[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Retrieved chunks ({chunks.length})
      </p>
      {chunks.length === 0 ? (
        <p className="mt-2 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
          No retrieved chunk detail returned.
        </p>
      ) : (
        <div className="mt-2 grid gap-2">
          {chunks.map((chunk, index) => (
            <div
              className="rounded-lg border border-border/70 bg-background/40 p-3 text-xs text-muted-foreground"
              key={`${chunk.documentTitle}-${chunk.chunkIndex}-${index}`}
            >
              <p className="font-semibold text-foreground">
                chunk #{chunk.chunkIndex ?? index + 1} · {chunk.documentTitle || "source"}{" "}
                {chunk.page ? `· p.${chunk.page}` : ""} · {percent(chunk.relevanceScore)}
              </p>
              {chunk.contentPreview && <p className="mt-1 line-clamp-2">{chunk.contentPreview}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreDiffPanel({ result }: { result: NormalizedBenchmarkRunResult }) {
  return (
    <Panel className="grid content-start gap-4 p-4 md:p-5">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Judge delta
        </p>
        <p className="mt-2 text-lg font-semibold">
          {result.winner === "corrective"
            ? "Corrective wins"
            : result.winner === "basic"
              ? "Basic wins"
              : "Tie"}
        </p>
      </div>

      <div className="grid gap-4">
        {metricKeys.map((key) => {
          const basic = result.basic.scores[key];
          const corrective = result.corrective.scores[key];

          return (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {metricLabels[key]}
                </span>
                <span className="font-semibold text-primary">
                  {scoreDelta(corrective, basic)}
                </span>
              </div>
              <div className="grid grid-cols-[48px_1fr_48px] items-center gap-2 text-xs">
                <span className="text-right font-semibold">{basic.toFixed(2)}</span>
                <div className="grid gap-1">
                  <div className="h-2 overflow-hidden rounded-full bg-blue-500/10">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${basic * 100}%` }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-teal-500/10">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${corrective * 100}%` }} />
                  </div>
                </div>
                <span className="font-semibold">{corrective.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Overall
        </p>
        <p className="mt-1 text-2xl font-semibold">
          {scoreDelta(result.corrective.scores.totalScore, result.basic.scores.totalScore)}
        </p>
      </div>
    </Panel>
  );
}

export default function RunBenchmark() {
  const { questionId = "" } = useParams();
  const [result, setResult] = useState<NormalizedBenchmarkRunResult | null>(null);
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
        setResult(normalizeRunResult(response, questionId));
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

  const winnerSummary = useMemo(() => {
    if (!result) return "";
    const delta = scoreDelta(
      result.corrective.scores.totalScore,
      result.basic.scores.totalScore,
    );
    const stronger = metricKeys
      .filter((key) => result.corrective.scores[key] > result.basic.scores[key])
      .map((key) => metricLabels[key]);

    return `${delta} overall${stronger.length ? ` · stronger on ${stronger.join(", ")}` : ""}`;
  }, [result]);

  function exportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `benchmark-run-${result.id || result.questionId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="celestial-page min-h-svh overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>Admin</span>
              <span>/</span>
              <span>Benchmark</span>
              <span>/</span>
              <span className="text-foreground">
                Run #{result?.id || questionId || "pending"}
              </span>
              <span className="ml-2 rounded-full border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">
                v0.4 · dev
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              RUN #{result?.id || questionId} · {formatDate(result?.createdAt)} · {formatMs(result?.durationMs)} total
            </p>
            <h1 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {result?.question || "Running benchmark..."}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {[result?.subject, result?.difficulty, result?.documentTitle]
                .filter(Boolean)
                .join(" · ") || "Benchmark result detail"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              to="/evaluation"
            >
              <ChevronLeft className="size-4" />
              Back
            </Link>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 text-sm font-semibold transition hover:border-primary disabled:opacity-60"
              disabled={!result}
              onClick={exportJson}
              type="button"
            >
              <ArrowDownToLine className="size-4" />
              Export JSON
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={loading || rerunning}
              onClick={() => runBenchmark(true)}
              type="button"
            >
              {rerunning ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Re-run
            </button>
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
              onClick={() => runBenchmark()}
              type="button"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <Panel className="grid min-h-80 place-items-center p-8">
            <div className="text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Running Basic RAG and Corrective RAG...
              </p>
            </div>
          </Panel>
        ) : result ? (
          <>
            <Panel className="tone-teal flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <WinnerBadge winner={result.winner} />
              <p className="text-sm text-muted-foreground">{winnerSummary}</p>
            </Panel>

            <Panel className="p-4 md:p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <FileText className="size-4" />
                Expected Answer
                <span className="rounded-full bg-muted px-2 py-1 text-[10px]">ground truth</span>
              </div>
              <p className="text-sm leading-6 text-foreground/90">
                {result.expectedAnswer || "No expected answer returned for this run."}
              </p>
            </Panel>

            <section className="grid gap-4 xl:grid-cols-[1fr_360px_1fr]">
              <ModeColumn mode="Basic RAG" result={result.basic} tone="blue" />
              <ScoreDiffPanel result={result} />
              <ModeColumn mode="Corrective RAG" result={result.corrective} tone="teal" />
            </section>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Diff coloring</span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-blue-500" />
                weaker answer
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-teal-500" />
                stronger answer
              </span>
            </div>
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
      </div>
    </main>
  );
}
