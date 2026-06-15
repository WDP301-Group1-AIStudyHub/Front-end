import type { ApiResponse } from '../types/auth'
import type {
  DocumentItem,
  DocumentsResponse,
  UpdateDocumentPayload,
  UploadDocumentPayload,
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

function requestUpload<T>(
  path: string,
  body: FormData,
  onProgress?: (progress: number) => void,
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}${path}`)

    authHeaders(body).forEach((value, key) => {
      xhr.setRequestHeader(key, value)
    })

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    }

    xhr.onload = () => {
      const payload = JSON.parse(xhr.responseText || '{"success":false,"message":"Unexpected server response"}') as ApiResponse<T>

      if (xhr.status < 200 || xhr.status >= 300) {
        if (xhr.status === 401) {
          clearAuthSession()
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }

        reject(new DocumentApiError(payload.message || 'Request failed', xhr.status))
        return
      }

      onProgress?.(100)
      resolve(payload)
    }

    xhr.onerror = () => reject(new DocumentApiError('Network request failed', 0))
    xhr.send(body)
  })
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

export async function listDocuments(): Promise<DocumentsResponse> {
  const response = await request<unknown>('/api/documents')
  return unwrapDocumentList(response, 'Document list response was empty')
}

export async function searchDocuments({
  keyword,
  subject,
}: {
  keyword?: string
  subject?: string
}): Promise<DocumentsResponse> {
  const params = new URLSearchParams()

  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }

  if (subject?.trim()) {
    params.set('subject', subject.trim())
  }

  const query = params.toString()
  const response = await request<unknown>(
    query ? `/api/documents/search?${query}` : '/api/documents',
  )

  return unwrapDocumentList(response, 'Document search response was empty')
}

export async function getDocument(documentId: string): Promise<DocumentItem> {
  const response = await request<DocumentItem>(`/api/documents/${documentId}`)
  return unwrapData(response, 'Document response was empty')
}

export async function uploadDocument({
  description,
  file,
  onProgress,
  subject,
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

  const response = await requestUpload<DocumentItem>('/api/documents/upload', formData, onProgress)

  return unwrapData(response, 'Uploaded document response was empty')
}

export async function updateDocument(
  documentId: string,
  payload: UpdateDocumentPayload,
): Promise<DocumentItem> {
  const response = await request<DocumentItem>(`/api/documents/${documentId}`, {
    body: payload,
    method: 'PUT',
  })

  return unwrapData(response, 'Updated document response was empty')
}

export async function deleteDocument(documentId: string): Promise<void> {
  await request<void>(`/api/documents/${documentId}`, {
    method: 'DELETE',
  })
}
