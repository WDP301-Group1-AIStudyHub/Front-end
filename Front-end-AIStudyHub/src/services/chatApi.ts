import type { ApiResponse } from '@/types/auth'
import type {
  AgentEvent,
  AskChatPayload,
  BenchmarkQuestion,
  BenchmarkQuestionsResponse,
  BenchmarkRunResult,
  BenchmarkSummary,
  ChatHistoryItem,
  ChatHistoryListResponse,
  ChatThreadDetail,
  ChatThreadItem,
  ChatThreadListResponse,
  CreateBenchmarkQuestionPayload,
  EvaluationLogsResponse,
  EvaluationSummary,
} from '@/types/chat'
import { clearAuthSession, getStoredToken } from './authStorage'
import { notifyAiUsageChanged } from '@/lib/aiUsageEvents'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export class ChatApiError extends Error {
  status: number
  // The server's machine-readable code, when it sent one. Callers branch on
  // this rather than the prose, which is written for API consumers.
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
    this.code = code
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeBenchmarkSummary(summary: BenchmarkSummary): BenchmarkSummary {
  const record = asRecord(summary)

  return {
    ...summary,
    averageScore: numberFrom(summary.averageScore ?? record.avgScore),
    averageAnswerCorrectness: numberFrom(
      summary.averageAnswerCorrectness ?? record.averageCorrectness ?? record.answerCorrectness,
    ),
    averageCompleteness: numberFrom(summary.averageCompleteness ?? record.completeness),
    averageFaithfulness: numberFrom(summary.averageFaithfulness ?? record.faithfulness),
    averageRelevance: numberFrom(summary.averageRelevance ?? record.relevance),
    totalRuns: numberFrom(summary.totalRuns),
  }
}

function authHeaders(): Headers {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, signal } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unexpected server response',
  }))) as ApiResponse<T>

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw new ChatApiError(
      payload.message || 'Request failed',
      response.status,
      (payload as { code?: string }).code,
    )
  }

  return payload
}

// ─── Chat ───────────────────────────────────────────────────────────────────
// Agentic engine only: Gemini decides when and how to search the documents
// (tool-calling loop). The web app streams events; the non-stream
// /api/agent/ask and legacy /api/chat/ask routes still exist on the backend
// for the mobile app and the benchmark suite.

export async function* askAgentStream(
  payload: AskChatPayload,
  signal?: AbortSignal,
): AsyncGenerator<AgentEvent> {
  const token = getStoredToken()
  const response = await fetch(`${API_BASE_URL}/api/agent/ask/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    // Quota rejection lands here rather than as an `error` event: the check
    // runs before the handler writes the SSE headers, so it is a plain 429.
    const errorPayload = await response.json().catch(() => ({}))
    throw new ChatApiError(
      errorPayload.message || 'Streaming request failed',
      response.status,
      errorPayload.code,
    )
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6)
          try {
            yield JSON.parse(jsonStr) as AgentEvent
          } catch (e) {
            console.error('Failed to parse SSE JSON', e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()

    // Deliberately after the loop rather than on the `final` event: the server
    // increments the counter once the handler returns, which is after `final`
    // has already been written to the stream. Refetching on `final` races that
    // write and reads back the previous count.
    //
    // Unconditional, including on failed and aborted runs, because a request
    // that dies mid-stream is exactly when the key may have just been marked
    // invalid — that is the moment the plan badge most needs to be re-read.
    // The refetch is a cheap idempotent GET.
    notifyAiUsageChanged()
  }
}


export async function getChatHistory(): Promise<ChatHistoryListResponse> {
  const res = await request<ChatHistoryListResponse | { histories: ChatHistoryItem[]; total: number }>('/api/chat/history')
  if (!res.data) return []
  // BE may return { histories: [...], total: N } or a plain array
  if (Array.isArray(res.data)) return res.data
  if ('histories' in (res.data as object) && Array.isArray((res.data as { histories: unknown }).histories)) {
    return (res.data as { histories: ChatHistoryItem[] }).histories
  }
  return []
}

export async function getChatHistoryById(id: string): Promise<ChatHistoryItem> {
  const res = await request<ChatHistoryItem>(`/api/chat/history/${id}`)
  if (!res.data) throw new ChatApiError('Chat history item not found', 404)
  return res.data
}

export async function deleteChatHistory(id: string): Promise<void> {
  await request(`/api/chat/history/${id}`, { method: 'DELETE' })
}

export async function createChatThread(title?: string): Promise<ChatThreadItem> {
  const res = await request<ChatThreadItem>('/api/chat/threads', {
    method: 'POST',
    body: title ? { title } : {},
  })
  if (!res.data) throw new ChatApiError('Failed to create chat thread', 500)
  return res.data
}

export async function listChatThreads(
  status?: 'ACTIVE' | 'ARCHIVED',
): Promise<ChatThreadItem[]> {
  const query = status ? `?status=${status}` : ''
  const res = await request<ChatThreadListResponse | ChatThreadItem[]>(
    `/api/chat/threads${query}`,
  )
  if (!res.data) return []
  if (Array.isArray(res.data)) return res.data
  return res.data.threads ?? []
}

export async function getChatThreadById(threadId: string): Promise<ChatThreadDetail> {
  const res = await request<ChatThreadDetail>(`/api/chat/threads/${threadId}`)
  if (!res.data) throw new ChatApiError('Chat thread not found', 404)
  return res.data
}

export async function updateChatThread(
  threadId: string,
  payload: { title?: string; status?: 'ACTIVE' | 'ARCHIVED' },
): Promise<ChatThreadItem> {
  const res = await request<ChatThreadItem>(`/api/chat/threads/${threadId}`, {
    method: 'PATCH',
    body: payload,
  })
  if (!res.data) throw new ChatApiError('Chat thread not found', 404)
  return res.data
}

export async function deleteChatThread(threadId: string): Promise<void> {
  await request(`/api/chat/threads/${threadId}`, { method: 'DELETE' })
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

export async function getEvaluationLogs(): Promise<EvaluationLogsResponse> {
  const res = await request<EvaluationLogsResponse>('/api/evaluation/logs')
  return res.data ?? []
}

export async function getEvaluationSummary(): Promise<EvaluationSummary> {
  const res = await request<EvaluationSummary>('/api/evaluation/summary')
  if (!res.data) throw new ChatApiError('Empty evaluation summary', 500)
  return res.data
}

// ─── Benchmark ──────────────────────────────────────────────────────────────

export async function getBenchmarkQuestions(): Promise<BenchmarkQuestionsResponse> {
  const res = await request<BenchmarkQuestionsResponse | { questions: BenchmarkQuestionsResponse }>('/api/benchmark/questions')
  if (!res.data) return []
  if (Array.isArray(res.data)) return res.data
  if ('questions' in (res.data as object) && Array.isArray((res.data as { questions: unknown }).questions)) {
    return (res.data as { questions: BenchmarkQuestionsResponse }).questions
  }
  return []
}

export async function createBenchmarkQuestion(
  payload: CreateBenchmarkQuestionPayload,
): Promise<BenchmarkQuestion | null> {
  const res = await request<
    BenchmarkQuestion | { question?: BenchmarkQuestion }
  >('/api/benchmark/questions', {
    method: 'POST',
    body: payload,
  })

  if (!res.data) return null
  if ('question' in (res.data as object)) {
    return (res.data as { question?: BenchmarkQuestion }).question ?? null
  }
  return res.data as BenchmarkQuestion
}

export async function deleteBenchmarkQuestion(questionId: string): Promise<void> {
  await request(`/api/benchmark/questions/${questionId}`, {
    method: 'DELETE',
  })
}

export async function runBenchmarkQuestion(
  questionId: string,
): Promise<BenchmarkRunResult> {
  const res = await request<BenchmarkRunResult>(`/api/benchmark/run/${questionId}`, {
    method: 'POST',
  })
  if (!res.data) throw new ChatApiError('Empty benchmark result', 500)
  return res.data
}

export async function getBenchmarkSummary(period?: '7d' | '30d' | 'all'): Promise<BenchmarkSummary> {
  const query = period && period !== 'all' ? `?period=${encodeURIComponent(period)}` : ''
  const res = await request<BenchmarkSummary>(`/api/benchmark/summary${query}`)
  if (!res.data) throw new ChatApiError('Empty benchmark summary', 500)
  return normalizeBenchmarkSummary(res.data)
}
