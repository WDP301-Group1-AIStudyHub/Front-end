import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconTile } from "@/components/shared/IconTile";
import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sigma,
} from "lucide-react";
import { getBenchmarkSummary } from "@/services/chatApi";
import type { BenchmarkScores, BenchmarkSummary } from "@/types/chat";

type MetricKey = keyof Omit<BenchmarkScores, "totalScore">;

const emptySummary: BenchmarkSummary = {
  averageAnswerCorrectness: 0,
  averageCompleteness: 0,
  averageFaithfulness: 0,
  averageRelevance: 0,
  averageScore: 0,
  totalRuns: 0,
};

const metricLabels: Record<MetricKey, string> = {
  completeness: "Completeness",
  correctness: "Correctness",
  faithfulness: "Faithfulness",
  relevance: "Relevance",
};

function normalizeScore(value: number): number {
  return value > 1 ? value / 100 : value;
}

function scoreText(value: number): string {
  return normalizeScore(value).toFixed(2);
}

function percent(value: number): string {
  return `${Math.round(normalizeScore(value) * 100)}%`;
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
  tone: "blue" | "emerald" | "coral" | "gold" | "teal" | "mist";
  value: string;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </div>
        <IconTile
          tone={
            tone === "emerald"
              ? "success"
              : tone === "coral"
                ? "destructive"
                : tone === "gold"
                  ? "warning"
                  : "info"
          }
        >
          {icon}
        </IconTile>
      </div>
    </article>
  );
}

function MetricBars({ summary }: { summary: BenchmarkSummary }) {
  const metrics = [
    {
      key: "correctness" as const,
      label: metricLabels.correctness,
      value: normalizeScore(summary.averageAnswerCorrectness),
    },
    {
      key: "faithfulness" as const,
      label: metricLabels.faithfulness,
      value: normalizeScore(summary.averageFaithfulness),
    },
    {
      key: "relevance" as const,
      label: metricLabels.relevance,
      value: normalizeScore(summary.averageRelevance),
    },
    {
      key: "completeness" as const,
      label: metricLabels.completeness,
      value: normalizeScore(summary.averageCompleteness),
    },
  ];

  return (
    <Panel className="p-4 md:p-5">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight">
          Average score per metric
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="size-3 rounded bg-primary" />
          DR-RAG judge score
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-lg border border-border/70 bg-background/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{metric.label}</span>
              <span className="text-sm font-semibold text-primary">
                {scoreText(metric.value)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${metric.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function Summary() {
  const [summary, setSummary] = useState<BenchmarkSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary() {
    setLoading(true);
    setError(null);

    try {
      setSummary(await getBenchmarkSummary());
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
    getBenchmarkSummary()
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
  }, []);

  function exportJson() {
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "benchmark-summary.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <PageHeader
        title="Evaluation Summary"
        description="Aggregate quality metrics for the single DR-RAG pipeline across all benchmark runs."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportJson} type="button" variant="outline">
              <ArrowDownToLine className="size-4 mr-1" aria-hidden="true" />
              Export
            </Button>
            <Button
              disabled={loading}
              onClick={loadSummary}
              type="button"
              variant="outline"
            >
              <RefreshCw
                className={`size-4 mr-1 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Refresh
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
            onClick={loadSummary}
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
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </Panel>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              detail="Completed benchmark runs"
              icon={<Sigma />}
              label="Total benchmarks"
              tone="blue"
              value={String(summary.totalRuns)}
            />
            <KpiCard
              detail="LLM judge aggregate"
              icon={<BarChart3 />}
              label="Average score"
              tone="teal"
              value={scoreText(summary.averageScore)}
            />
            <KpiCard
              detail="Grounded in retrieved context"
              icon={<CheckCircle2 />}
              label="Faithfulness"
              tone="mist"
              value={percent(summary.averageFaithfulness)}
            />
            <KpiCard
              detail="Matches the expected answer"
              icon={<CheckCircle2 />}
              label="Correctness"
              tone="gold"
              value={percent(summary.averageAnswerCorrectness)}
            />
          </section>

          <MetricBars summary={summary} />
        </>
      )}
    </PageShell>
  );
}
