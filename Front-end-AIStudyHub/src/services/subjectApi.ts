import { clearAuthSession, getStoredToken } from './authStorage'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export interface SubjectItem {
  _id: string
  name: string
  code?: string
  description?: string
  color?: string
  semester?: string
  createdAt?: string
  updatedAt?: string
}

export interface SubjectPayload {
  name: string
  code?: string
  description?: string
  color?: string
  semester?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

interface SubjectListData {
  items?: SubjectItem[]
  subjects?: SubjectItem[]
}

function authHeaders(): Headers {
  const headers = new Headers()
  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')
  return headers
}

async function request<T>(
  path: string,
  options: { body?: unknown; method?: 'GET' | 'POST' | 'PUT' | 'DELETE' } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: authHeaders(),
    method: options.method ?? 'GET',
  })
  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from subjects API',
  }))) as ApiResponse<T>

  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    throw new Error(payload.message || 'Subject request failed')
  }

  if (payload.data === undefined) {
    return undefined as T
  }

  return payload.data
}

export async function listSubjects(): Promise<SubjectItem[]> {
  const data = await request<SubjectListData | SubjectItem[]>('/api/subjects?limit=100')

  if (Array.isArray(data)) {
    return data
  }

  return data.items ?? data.subjects ?? []
}

export async function createSubject(
  input: string | SubjectPayload,
): Promise<SubjectItem> {
  const payload =
    typeof input === 'string'
      ? { name: input, code: input.trim().slice(0, 40) }
      : input

  return request<SubjectItem>('/api/subjects', {
    body: payload,
    method: 'POST',
  })
}

export async function updateSubject(
  subjectId: string,
  payload: SubjectPayload,
): Promise<SubjectItem> {
  return request<SubjectItem>(`/api/subjects/${subjectId}`, {
    body: payload,
    method: 'PUT',
  })
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await request<void>(`/api/subjects/${subjectId}`, {
    method: 'DELETE',
  })
}

export async function findOrCreateSubjectByName(name: string): Promise<string> {
  const normalized = name.trim()
  if (!normalized) {
    throw new Error('Subject name cannot be empty')
  }
  const subjects = await listSubjects()
  const match = subjects.find(
    (s) => s.name.trim().toLowerCase() === normalized.toLowerCase(),
  )
  if (match) {
    return match._id
  }
  const newSubject = await createSubject(normalized)
  return newSubject._id
}
