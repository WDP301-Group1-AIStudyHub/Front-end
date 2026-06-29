import type { ApiResponse } from '../types/auth'
import type {
  AskChatPayload,
  AskChatResponse,
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
} from '../types/chat'
import { clearAuthSession, getStoredToken } from './authStorage'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export class ChatApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
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
    throw new ChatApiError(payload.message || 'Request failed', response.status)
  }

  return payload
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function askChat(
  payload: AskChatPayload,
  signal?: AbortSignal,
): Promise<AskChatResponse> {
  const res = await request<AskChatResponse>('/api/chat/ask', {
    method: 'POST',
    body: payload,
    signal,
  })
  if (!res.data) throw new ChatApiError('Empty response from chat', 500)
  return res.data
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

export async function listChatThreads(): Promise<ChatThreadItem[]> {
  const res = await request<ChatThreadListResponse | ChatThreadItem[]>('/api/chat/threads')
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
