import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sigma,
  Trophy,
} from "lucide-react";
import { getBenchmarkSummary } from "../../services/chatApi";
import type {
  BenchmarkRecentRun,
  BenchmarkScores,
  BenchmarkSummary,
  BenchmarkWinner,
} from "../../types/chat";

type Period = "7d" | "30d" | "all";
type MetricKey = keyof Omit<BenchmarkScores, "totalScore">;

type NormalizedSummary = {
  raw: BenchmarkSummary;
  totalRuns: number;
  periodDelta: number;
  averageBasicScore: number;
  averageCorrectiveScore: number;
  correctiveWinRate: number;
  metrics: Array<{
    key: MetricKey;
    label: string;
    basic: number;
    corrective: number;
  }>;
  winCounts: {
    basic: number;
    corrective: number;
    tie: number;
  };
  recentRuns: BenchmarkRecentRun[];
};

const emptySummary: BenchmarkSummary = {
  averageBasicScore: 0,
  averageCorrectiveScore: 0,
  basicWinRate: 0,
  correctnessImprovement: 0,
  correctiveWinRate: 0,
  faithfulnessImprovement: 0,
  totalRuns: 0,
};

const periods: Array<{ label: string; value: Period }> = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
];

const metricLabels: Record<MetricKey, string> = {
  completeness: "Completeness",
  correctness: "Correctness",
  faithfulness: "Faithfulness",
  relevance: "Relevance",
};

const winnerLabels: Record<BenchmarkWinner, string> = {
  basic: "Basic",
  corrective: "Corrective",
  not_run: "Not run",
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
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeScore(value: unknown): number {
  const numeric = numberFrom(value);
  return numeric > 1 ? numeric / 100 : numeric;
}

function scoreText(value: unknown): string {
  return normalizeScore(value).toFixed(2);
}

function percent(value: unknown): string {
  return `${Math.round(normalizeScore(value) * 100)}%`;
}

function signedCount(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function signedScore(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function normalizeWinner(value: unknown): BenchmarkWinner {
  if (value === "basic" || value === "corrective" || value === "tie") {
    return value;
  }
  return "not_run";
}

function formatRunTime(value?: string): string {
  if (!value) return "recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recent";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function normalizeRecentRun(value: unknown): BenchmarkRecentRun {
  const run = asRecord(value);
  return {
    id: stringFrom(run.id ?? run.runId, "unknown"),
    question: stringFrom(
      run.question ?? run.questionText,
      "Untitled benchmark",
    ),
    questionId: stringFrom(run.questionId ?? run.benchmarkQuestionId),
    runAt: stringFrom(run.runAt ?? run.createdAt),
    winner: normalizeWinner(run.winner),
    delta: numberFrom(run.delta ?? run.scoreDelta ?? run.overallDelta),
  };
}

function metricValue(
  summary: BenchmarkSummary,
  mode: "basic" | "corrective",
  key: MetricKey,
) {
  const summaryRecord = asRecord(summary);
  const metricAverages = asRecord(summary.metricAverages);
  const nested = asRecord(metricAverages[mode]);
  const modeAverages =
    mode === "basic"
      ? asRecord(summary.basicMetricAverages)
      : asRecord(summary.correctiveMetricAverages);
  const flatKeys =
    mode === "basic"
      ? [`basic${key}`, `averageBasic${key}`, `${key}Basic`]
      : [`corrective${key}`, `averageCorrective${key}`, `${key}Corrective`];

  const candidate =
    nested[key] ??
    modeAverages[key] ??
    flatKeys
      .map((flatKey) => summaryRecord[flatKey])
      .find((value) => value !== undefined);

  return normalizeScore(candidate);
}

function normalizeSummary(summary: BenchmarkSummary): NormalizedSummary {
  const record = asRecord(summary);
  const averageBasicScore = normalizeScore(
    summary.averageBasicScore ??
      summary.basicAverageScore ??
      record.basicAvgScore,
  );
  const averageCorrectiveScore = normalizeScore(
    summary.averageCorrectiveScore ??
      summary.correctiveAverageScore ??
      record.correctiveAvgScore,
  );
  const totalRuns = numberFrom(summary.totalRuns ?? summary.totalBenchmarks);
  const winCountsRecord = asRecord(summary.winCounts);
  const correctiveWins = numberFrom(
    summary.correctiveWins ??
      winCountsRecord.corrective ??
      Math.round(normalizeScore(summary.correctiveWinRate) * totalRuns),
  );
  const basicWins = numberFrom(
    summary.basicWins ??
      winCountsRecord.basic ??
      Math.round(normalizeScore(summary.basicWinRate) * totalRuns),
  );
  const ties = numberFrom(
    summary.ties ??
      winCountsRecord.tie ??
      Math.max(0, totalRuns - correctiveWins - basicWins),
  );
  const recentRunsSource = summary.recentRuns ?? summary.latestRuns ?? [];

  return {
    raw: summary,
    averageBasicScore,
    averageCorrectiveScore,
    correctiveWinRate: normalizeScore(summary.correctiveWinRate),
    metrics: (Object.keys(metricLabels) as MetricKey[]).map((key) => ({
      key,
      label: metricLabels[key],
      basic: metricValue(summary, "basic", key),
      corrective: metricValue(summary, "corrective", key),
    })),
    periodDelta: numberFrom(summary.periodDelta ?? record.deltaRuns),
    recentRuns: recentRunsSource.map(normalizeRecentRun),
    totalRuns,
    winCounts: {
      basic: basicWins,
      corrective: correctiveWins,
      tie: ties,
    },
  };
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`moonlit-panel ${className}`}>{children}</section>
  );
}

function KpiCard({
  detail,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <article className={`moonlit-card tone-surface tone-${tone} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className={`admin-icon-badge admin-tone-${tone}`}>{icon}</div>
      </div>
    </article>
  );
}

function MetricBars({ summary }: { summary: NormalizedSummary }) {
  return (
    <Panel className="p-4 md:p-5">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight">Average score per metric</h2>
        <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-[#ECEFE7] border border-[#D9DDD3]" />
            Basic RAG
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-[#3B5247]" />
            Corrective RAG
          </span>
        </div>
      </div>

      {/* SVG Dual Column Chart */}
      <div className="w-full overflow-x-auto overflow-y-hidden mt-2">
        <svg className="w-full min-w-[440px] h-52 md:h-60" viewBox="0 0 500 220" xmlns="http://www.w3.org/2000/svg">
          {/* Grid lines */}
          <line x1="40" y1="30" x2="480" y2="30" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
          <line x1="40" y1="80" x2="480" y2="80" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
          <line x1="40" y1="130" x2="480" y2="130" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
          <line x1="40" y1="180" x2="480" y2="180" stroke="var(--border)" strokeWidth="0.8" opacity="0.8" />

          {/* Y-Axis Labels */}
          <text x="32" y="34" className="text-[10px] fill-muted-foreground font-semibold" textAnchor="end">1.0</text>
          <text x="32" y="84" className="text-[10px] fill-muted-foreground font-semibold" textAnchor="end">0.7</text>
          <text x="32" y="134" className="text-[10px] fill-muted-foreground font-semibold" textAnchor="end">0.4</text>
          <text x="32" y="184" className="text-[10px] fill-muted-foreground font-semibold" textAnchor="end">0.0</text>

          {/* Render dual bars for each metric */}
          {summary.metrics.map((metric, idx) => {
            const groupWidth = 105;
            const startX = 55 + idx * groupWidth;
            
            // Map score (0.0 to 1.0) to height (0 to 150)
            const basicHeight = Math.max(metric.basic * 150, 4);
            const correctiveHeight = Math.max(metric.corrective * 150, 4);

            return (
              <g key={metric.key} className="group cursor-pointer">
                {/* Background Group Highlight */}
                <rect
                  x={startX - 10}
                  y="10"
                  width="68"
                  height="170"
                  className="fill-transparent group-hover:fill-muted/20 rounded-lg transition-colors"
                  rx="6"
                />

                {/* Basic Bar (Left column) */}
                <rect
                  x={startX}
                  y={180 - basicHeight}
                  width="20"
                  height={basicHeight}
                  rx="4"
                  className="fill-[#ECEFE7] stroke-[#D9DDD3] stroke-1 hover:brightness-[0.98] transition-all duration-300"
                />
                
                {/* Corrective Bar (Right column) */}
                <rect
                  x={startX + 26}
                  y={180 - correctiveHeight}
                  width="20"
                  height={correctiveHeight}
                  rx="4"
                  className="fill-[#3B5247] hover:brightness-[1.05] transition-all duration-300"
                />

                {/* X-Axis Metric Name */}
                <text 
                  x={startX + 23} 
                  y="204" 
                  className="text-[10px] font-bold fill-foreground"
                  textAnchor="middle"
                >
                  {metric.label}
                </text>

                {/* Values Tooltip on Hover */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect x={startX - 12} y={Math.min(180 - basicHeight, 180 - correctiveHeight) - 25} width="72" height="18" rx="4" className="fill-foreground" />
                  <text 
                    x={startX + 24} 
                    y={Math.min(180 - basicHeight, 180 - correctiveHeight) - 13} 
                    className="text-[9px] fill-background font-bold"
                    textAnchor="middle"
                  >
                    B: {metric.basic.toFixed(2)} | C: {metric.corrective.toFixed(2)}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </Panel>
  );
}

function WinRatePanel({ summary }: { summary: NormalizedSummary }) {
  const total =
    summary.winCounts.basic +
      summary.winCounts.corrective +
      summary.winCounts.tie ||
    summary.totalRuns ||
    1;

  return (
    <Panel className="grid content-start gap-4 p-4 md:p-5">
      <h2 className="text-lg font-semibold">Win rate</h2>
      <div className="overflow-hidden rounded-lg border border-border/70">
        <div className="flex h-8">
          <div
            className="bg-primary"
            style={{
              width: `${(summary.winCounts.corrective / total) * 100}%`,
            }}
          />
          <div
            className="bg-primary"
            style={{ width: `${(summary.winCounts.basic / total) * 100}%` }}
          />
          <div
            className="bg-muted-foreground"
            style={{ width: `${(summary.winCounts.tie / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        <WinRow
          color="bg-primary"
          label="Corrective"
          value={summary.winCounts.corrective}
        />
        <WinRow
          color="bg-primary"
          label="Basic"
          value={summary.winCounts.basic}
        />
        <WinRow
          color="bg-muted-foreground"
          label="Tie"
          value={summary.winCounts.tie}
        />
      </div>
    </Panel>
  );
}

function WinRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className={`size-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function RecentRuns({ runs }: { runs: BenchmarkRecentRun[] }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4 md:p-5">
        <h2 className="text-lg font-semibold">Recent benchmark runs</h2>
        <Link
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          to="/evaluation"
        >
          view all
        </Link>
      </div>

      {runs.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          Result history is not available from the current benchmark API yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Question</th>
                <th className="px-4 py-3 text-left font-medium">Run</th>
                <th className="px-4 py-3 text-left font-medium">Winner</th>
                <th className="px-4 py-3 text-right font-medium">Delta</th>
                <th className="px-4 py-3 text-right font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {runs.map((run) => (
                <tr
                  className="hover:bg-muted/25"
                  key={`${run.id}-${run.questionId}`}
                >
                  <td className="px-4 py-3 font-semibold">{run.id}</td>
                  <td className="max-w-[280px] truncate px-4 py-3">
                    {run.question}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRunTime(run.runAt ?? run.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <WinnerBadge winner={run.winner} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {signedScore(numberFrom(run.delta))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {run.questionId ? (
                      <Link
                        className="inline-flex items-center gap-1 font-semibold text-primary"
                        to={`/evaluation/run/${run.questionId}`}
                      >
                        Open
                        <ChevronRight className="size-4" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function WinnerBadge({ winner }: { winner: BenchmarkWinner }) {
  const classes =
    winner === "corrective"
      ? "bg-primary/10 text-primary"
      : winner === "basic"
        ? "bg-primary/10 text-primary"
        : winner === "tie"
          ? "bg-muted text-muted-foreground"
          : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${classes}`}
    >
      {winnerLabels[winner]}
    </span>
  );
}

export default function Summary() {
  const [period, setPeriod] = useState<Period>("7d");
  const [summary, setSummary] = useState<BenchmarkSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeSummary(summary), [summary]);

  async function loadSummary(nextPeriod = period) {
    setLoading(true);
    setError(null);

    try {
      const response = await getBenchmarkSummary(nextPeriod);
      setSummary(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load benchmark summary",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    getBenchmarkSummary(period)
      .then((response) => {
        if (mounted) setSummary(response);
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load benchmark summary",
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [period]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(normalized.raw, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `benchmark-summary-${period}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="botanical-page min-h-svh overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Link to="/evaluation">
                <span>Benchmark</span>
              </Link>
              <span>/</span>
              <span className="text-foreground">Summary</span>
              <span className="ml-2 rounded-full border border-border/70 px-2 py-1 text-[10px] uppercase tracking-[0.14em]">
                v0.4 - dev
              </span>
            </div>
            <h1 className="moonlit-title text-3xl font-semibold tracking-tight md:text-4xl">
              Benchmark Summary
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aggregate performance across all benchmark runs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-border bg-background/50 p-1">
              {periods.map((item) => (
                <button
                  className={`h-8 rounded-md px-3 text-sm font-semibold transition ${
                    period === item.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={item.value}
                  onClick={() => setPeriod(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 text-sm font-semibold transition hover:border-primary"
              onClick={exportJson}
              type="button"
            >
              <ArrowDownToLine className="size-4" />
              Export
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
              onClick={() => loadSummary()}
              type="button"
            >
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <Panel className="grid min-h-80 place-items-center p-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </Panel>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                detail={`${signedCount(normalized.periodDelta)} this period`}
                icon={<Sigma />}
                label="Total benchmarks"
                tone="blue"
                value={String(normalized.totalRuns)}
              />
              <KpiCard
                detail="baseline"
                icon={<BarChart3 />}
                label="Basic avg score"
                tone="coral"
                value={scoreText(normalized.averageBasicScore)}
              />
              <KpiCard
                detail={`${signedScore(
                  normalized.averageCorrectiveScore -
                    normalized.averageBasicScore,
                )} vs Basic`}
                icon={<ArrowUpRight />}
                label="Corrective avg score"
                tone="teal"
                value={scoreText(normalized.averageCorrectiveScore)}
              />
              <KpiCard
                detail={`${normalized.winCounts.corrective} / ${normalized.totalRuns || 0} runs`}
                icon={<Trophy />}
                label="Corrective win-rate"
                tone="gold"
                value={percent(normalized.correctiveWinRate)}
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
              <MetricBars summary={normalized} />
              <WinRatePanel summary={normalized} />
            </section>

            <RecentRuns runs={normalized.recentRuns} />
          </>
        )}
      </div>
    </main>
  );
}
