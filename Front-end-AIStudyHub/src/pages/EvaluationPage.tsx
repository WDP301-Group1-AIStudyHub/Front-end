import { useEffect, useState } from 'react'
import { BarChart2, Clock, Loader2, Target, Zap } from 'lucide-react'
import { getEvaluationLogs, getEvaluationSummary } from '../services/chatApi'
import type { EvaluationLog, EvaluationSummary } from '../types/chat'

function StatCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode
  label: string
  tone: string
  value: string
}) {
  return (
    <article className={`celestial-card tone-surface tone-${tone} p-5`}>
      <div className={`admin-icon-badge admin-tone-${tone}`}>{icon}</div>
      <p className="mt-4 text-3xl font-light tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </article>
  )
}

export default function EvaluationPage() {
  const [summary, setSummary] = useState<EvaluationSummary | null>(null)
  const [logs, setLogs] = useState<EvaluationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    Promise.all([getEvaluationSummary(), getEvaluationLogs()])
      .then(([s, l]) => {
        if (!mounted) return
        setSummary(s)
        setLogs(l)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load evaluation data')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="celestial-page min-h-svh overflow-y-auto p-5 md:p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          RAG Research
        </p>
        <h1 className="celestial-title text-3xl font-semibold tracking-tight md:text-4xl">Evaluation</h1>
        <p className="text-sm text-muted-foreground">
          Compare Basic RAG vs Corrective RAG performance metrics.
        </p>
      </header>

      {loading && (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Summary stats */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={<Target />}
              label="Total questions"
              tone="blue"
              value={String(summary.totalQuestions)}
            />
            <StatCard
              icon={<BarChart2 />}
              label="Avg relevance score"
              tone="teal"
              value={`${Math.round(summary.averageRelevanceScore * 100)}%`}
            />
            <StatCard
              icon={<Zap />}
              label="Avg confidence score"
              tone="gold"
              value={`${Math.round(summary.averageConfidenceScore * 100)}%`}
            />
            <StatCard
              icon={<Clock />}
              label="Avg response time"
              tone="violet"
              value={`${(summary.averageResponseTime / 1000).toFixed(1)}s`}
            />
            <StatCard
              icon={<BarChart2 />}
              label="Basic mode questions"
              tone="coral"
              value={String(summary.basicModeCount)}
            />
            <StatCard
              icon={<Zap />}
              label="Corrective mode questions"
              tone="teal"
              value={String(summary.correctiveModeCount)}
            />
          </section>

          {/* Logs table */}
          <section className="mt-8">
            <article className="celestial-card celestial-table tone-surface tone-violet overflow-hidden">
              <div className="border-b border-border/70 p-5">
                <h2 className="text-lg font-semibold">Evaluation logs</h2>
                <p className="text-sm text-muted-foreground">
                  Per-question RAG metrics from your chat sessions.
                </p>
              </div>

              {logs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No logs yet. Ask questions in AI Chat to generate evaluation data.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                        <th className="px-5 py-3 text-left font-medium">Question</th>
                        <th className="px-5 py-3 text-left font-medium">Mode</th>
                        <th className="px-5 py-3 text-right font-medium">Confidence</th>
                        <th className="px-5 py-3 text-right font-medium">Relevance</th>
                        <th className="px-5 py-3 text-right font-medium">Grounded</th>
                        <th className="px-5 py-3 text-right font-medium">Time</th>
                        <th className="px-5 py-3 text-right font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {logs.map((log) => (
                        <tr className="hover:bg-muted/35" key={log.id}>
                          <td className="max-w-[260px] truncate px-5 py-3">{log.question}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                log.mode === 'corrective'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {log.mode}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {log.evaluation
                              ? `${Math.round(log.evaluation.confidenceScore * 100)}%`
                              : '—'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {log.evaluation
                              ? `${Math.round(log.evaluation.averageRelevanceScore * 100)}%`
                              : '—'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {log.evaluation ? (
                              log.evaluation.isGrounded ? (
                                <span className="text-green-500">Yes</span>
                              ) : (
                                <span className="text-yellow-500">No</span>
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {log.evaluation
                              ? `${(log.evaluation.responseTimeMs / 1000).toFixed(1)}s`
                              : '—'}
                          </td>
                          <td className="px-5 py-3 text-right text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  )
}
