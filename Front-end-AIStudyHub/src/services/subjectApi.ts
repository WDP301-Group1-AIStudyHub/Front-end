import { getStoredToken } from './authStorage'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export interface SubjectItem {
  _id: string
  name: string
  code?: string
  description?: string
}

interface ListSubjectResponse {
  success: boolean
  message?: string
  data?: {
    items: SubjectItem[]
  }
}

interface CreateSubjectResponse {
  success: boolean
  message?: string
  data?: SubjectItem
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

export async function listSubjects(): Promise<SubjectItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/subjects?limit=100`, {
    headers: authHeaders(),
    method: 'GET',
  })
  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from subjects API',
  }))) as ListSubjectResponse
  
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to list subjects')
  }
  return payload.data?.items ?? []
}

export async function createSubject(name: string): Promise<SubjectItem> {
  const response = await fetch(`${API_BASE_URL}/api/subjects`, {
    body: JSON.stringify({ name, code: name.trim().slice(0, 40) }),
    headers: authHeaders(),
    method: 'POST',
  })
  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from create subject API',
  }))) as CreateSubjectResponse

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to create subject')
  }
  return payload.data!
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
