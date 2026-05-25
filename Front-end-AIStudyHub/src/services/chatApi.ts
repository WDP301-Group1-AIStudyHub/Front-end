import type { ApiResponse } from '../types/auth'
import type {
  AskChatPayload,
  AskChatResponse,
  ChatHistoryItem,
  ChatHistoryListResponse,
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
