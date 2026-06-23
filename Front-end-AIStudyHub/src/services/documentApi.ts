import type { ApiResponse } from '../types/auth'
import type {
  DocumentDetail,
  DocumentItem,
  DocumentSubject,
  DocumentVersion,
  DocumentsResponse,
  UpdateDocumentPayload,
  UploadDocumentPayload,
  UploadSession,
} from '../types/document'
import { clearAuthSession, getStoredToken } from './authStorage'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export class DocumentApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DocumentApiError'
    this.status = status
  }
}

type RequestOptions = {
  body?: BodyInit | unknown
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

function authHeaders(body?: BodyInit | unknown): Headers {
  const headers = new Headers()
  const token = getStoredToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

async function request<T>(
  path: string,
  { body, method = 'GET' }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body:
      body === undefined || body instanceof FormData
        ? body
        : JSON.stringify(body),
    headers: authHeaders(body),
    method,
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

    throw new DocumentApiError(payload.message || 'Request failed', response.status)
  }

  return payload
}

function unwrapData<T>(payload: ApiResponse<T>, fallbackMessage: string): T {
  if (payload.data === undefined) {
    throw new DocumentApiError(fallbackMessage, 500)
  }

  return payload.data
}

function unwrapDocumentList(
  payload: ApiResponse<unknown>,
  fallbackMessage: string,
): DocumentsResponse {
  const data = unwrapData(payload, fallbackMessage)

  if (Array.isArray(data)) {
    return data as DocumentsResponse
  }

  if (data && typeof data === 'object') {
    const candidate = data as {
      documents?: unknown
      items?: unknown
      results?: unknown
    }

    if (Array.isArray(candidate.documents)) {
      return candidate.documents as DocumentsResponse
    }

    if (Array.isArray(candidate.items)) {
      return candidate.items as DocumentsResponse
    }

    if (Array.isArray(candidate.results)) {
      return candidate.results as DocumentsResponse
    }
  }

  throw new DocumentApiError('Document list response was not an array', 500)
}

function normalizeSubject(value: unknown): DocumentSubject | null {
  if (!value || typeof value !== 'object' || !('_id' in value) || !('name' in value)) {
    return null
  }

  const subject = value as DocumentSubject
  return {
    _id: String(subject._id),
    name: String(subject.name),
    code: subject.code,
    color: subject.color,
    description: subject.description,
    semester: subject.semester,
  }
}

function normalizeDocument(value: DocumentItem): DocumentItem {
  const populatedSubject =
    normalizeSubject(value.subject) || normalizeSubject(value.subjectId)
  const id = value.id || value._id || ''

  return {
    ...value,
    _id: value._id || id,
    id,
    subject: populatedSubject || (typeof value.subject === 'string' ? value.subject : null),
    subjectId:
      populatedSubject?._id ||
      (typeof value.subjectId === 'string' ? value.subjectId : undefined),
    fileName: value.fileName || value.title || 'Untitled document',
    filePublicId: value.filePublicId || '',
    fileUrl: value.fileUrl || '',
    fileType: value.fileType || '',
    fileSize: value.fileSize || 0,
    uploadedBy: value.uploadedBy || '',
    createdAt: value.createdAt || '',
    updatedAt: value.updatedAt || value.createdAt || '',
  }
}

function normalizeDocuments(documents: DocumentsResponse): DocumentsResponse {
  return documents.map(normalizeDocument)
}

export async function listDocuments(): Promise<DocumentsResponse> {
  const response = await request<unknown>('/api/documents?limit=100')
  return normalizeDocuments(unwrapDocumentList(response, 'Document list response was empty'))
}

export async function searchDocuments({
  keyword,
  subject,
  subjectId,
}: {
  keyword?: string
  subject?: string
  subjectId?: string
}): Promise<DocumentsResponse> {
  const params = new URLSearchParams()

  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }

  if (subject?.trim()) {
    params.set('subject', subject.trim())
  }

  if (subjectId?.trim()) {
    params.set('subjectId', subjectId.trim())
  }

  const query = params.toString()
  const response = await request<unknown>(
    query ? `/api/documents/search?${query}` : '/api/documents',
  )

  return normalizeDocuments(unwrapDocumentList(response, 'Document search response was empty'))
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await request<DocumentDetail>(`/api/documents/${documentId}`)
  return normalizeDocument(
    unwrapData(response, 'Document response was empty'),
  ) as DocumentDetail
}

export async function listDocumentVersions(
  documentId: string,
): Promise<DocumentVersion[]> {
  const response = await request<DocumentVersion[]>(
    `/api/documents/${documentId}/versions?limit=100`,
  )

  return unwrapData(response, 'Document versions response was empty')
}

export async function uploadDocument({
  description,
  file,
  subject,
  subjectId,
  title,
}: UploadDocumentPayload): Promise<DocumentItem> {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('title', title.trim())

  if (description?.trim()) {
    formData.set('description', description.trim())
  }

  if (subject?.trim()) {
    formData.set('subject', subject.trim())
  }

  if (subjectId?.trim()) {
    formData.set('subjectId', subjectId.trim())
  }

  const response = await request<DocumentItem>('/api/documents/upload', {
    body: formData,
    method: 'POST',
  })

  return normalizeDocument(unwrapData(response, 'Uploaded document response was empty'))
}

export async function updateDocument(
  documentId: string,
  payload: UpdateDocumentPayload,
): Promise<DocumentItem> {
  const response = await request<DocumentItem>(`/api/documents/${documentId}`, {
    body: payload,
    method: 'PUT',
  })

  return normalizeDocument(unwrapData(response, 'Updated document response was empty'))
}

export async function deleteDocument(documentId: string): Promise<void> {
  await request<void>(`/api/documents/${documentId}`, {
    method: 'DELETE',
  })
}

export async function getUploadSession(sessionId: string): Promise<UploadSession> {
  const response = await request<UploadSession>(`/api/documents/upload/session/${sessionId}`)
  return unwrapData(response, 'Upload session response was empty')
}
