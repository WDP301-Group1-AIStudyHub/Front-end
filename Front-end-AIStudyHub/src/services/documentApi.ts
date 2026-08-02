import type { ApiResponse } from '../types/auth'
import type {
  DocumentDetail,
  DocumentItem,
  DocumentShare,
  DocumentSharePermission,
  DocumentSubject,
  DocumentsResponse,
  UpdateSharedDocumentProfilePayload,
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
  /** Machine-readable code from the backend, e.g. STORAGE_QUOTA_EXCEEDED. */
  code?: string
  /** Structured payload accompanying the code. */
  details?: Record<string, unknown>

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'DocumentApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = {
  body?: BodyInit | unknown
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
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
  }))) as ApiResponse<T> & {
    code?: string
    details?: Record<string, unknown>
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    throw new DocumentApiError(
      payload.message || 'Request failed',
      response.status,
      payload.code,
      payload.details,
    )
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
  const personalSubject = normalizeSubject(value.personalSubject)
  const populatedSubject =
    personalSubject || normalizeSubject(value.subject) || normalizeSubject(value.subjectId)
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
    accessRole: value.accessRole,
    isShared: Boolean(value.isShared),
    sharedBy: value.sharedBy,
    personalSubjectId: value.personalSubjectId,
    personalSubject,
    deletedAt: value.deletedAt ?? null,
    deletedBy: value.deletedBy ?? null,
    trashExpiresAt: value.trashExpiresAt ?? null,
    trashDaysRemaining: value.trashDaysRemaining ?? null,
    isStarred: Boolean(value.isStarred),
    starredAt: value.starredAt ?? null,
  }
}

function normalizeDocuments(documents: DocumentsResponse): DocumentsResponse {
  return documents.map(normalizeDocument)
}

export async function listDocuments(): Promise<DocumentsResponse> {
  const response = await request<unknown>('/api/documents?limit=100')
  return normalizeDocuments(unwrapDocumentList(response, 'Document list response was empty'))
}

export async function listSharedWithMe(): Promise<DocumentsResponse> {
  const response = await request<unknown>('/api/documents/shared-with-me?limit=100')
  return normalizeDocuments(unwrapDocumentList(response, 'Shared document list response was empty'))
}

export async function listStarredDocuments(): Promise<DocumentsResponse> {
  const response = await request<unknown>('/api/documents/starred?limit=100')
  return normalizeDocuments(unwrapDocumentList(response, 'Starred document list response was empty'))
}

export async function listTrashDocuments(): Promise<DocumentsResponse> {
  const response = await request<unknown>('/api/documents/trash?limit=100')
  return normalizeDocuments(unwrapDocumentList(response, 'Trash document list response was empty'))
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
    query ? `/api/documents?${query}&limit=100` : '/api/documents?limit=100',
  )

  return normalizeDocuments(unwrapDocumentList(response, 'Document search response was empty'))
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await request<DocumentDetail>(`/api/documents/${documentId}`)
  return normalizeDocument(
    unwrapData(response, 'Document response was empty'),
  ) as DocumentDetail
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

export async function updateSharedDocumentProfile(
  documentId: string,
  payload: UpdateSharedDocumentProfilePayload,
): Promise<DocumentItem> {
  const response = await request<DocumentItem>(
    `/api/documents/${documentId}/shared-profile`,
    {
      body: payload,
      method: 'PATCH',
    },
  )

  return normalizeDocument(unwrapData(response, 'Updated shared document response was empty'))
}

export async function deleteDocument(documentId: string): Promise<{ ragStatus: string; warning?: string }> {
  const response = await request<{ ragStatus: string; warning?: string }>(`/api/documents/${documentId}`, {
    method: 'DELETE',
  })
  return unwrapData(response, 'Move to Trash response was empty')
}

export async function restoreDocument(documentId: string): Promise<DocumentItem> {
  const response = await request<DocumentItem>(`/api/documents/${documentId}/restore`, {
    method: 'POST',
  })
  return normalizeDocument(unwrapData(response, 'Restored document response was empty'))
}

export async function deleteDocumentPermanently(documentId: string): Promise<void> {
  await request<void>(`/api/documents/${documentId}/permanent`, {
    method: 'DELETE',
  })
}

export async function emptyTrash(): Promise<{
  deletedCount: number
  failedCount: number
  failures: Array<{ documentId: string; stage: string; message: string }>
}> {
  const response = await request<{
    deletedCount: number
    failedCount: number
    failures: Array<{ documentId: string; stage: string; message: string }>
  }>('/api/documents/trash/empty', {
    method: 'DELETE',
  })
  return unwrapData(response, 'Empty trash response was empty')
}

export async function setDocumentStar(
  documentId: string,
  starred: boolean,
): Promise<DocumentItem> {
  const response = await request<DocumentItem>(`/api/documents/${documentId}/star`, {
    body: { starred },
    method: 'PATCH',
  })
  return normalizeDocument(unwrapData(response, 'Document star response was empty'))
}

export async function getDocumentDownloadUrl(
  documentId: string,
): Promise<{ downloadUrl: string; fileName?: string }> {
  const response = await request<{ downloadUrl: string; fileName?: string }>(
    `/api/documents/${documentId}/download`,
  )

  return unwrapData(response, 'Document download response was empty')
}

export async function downloadDocumentFile(document: DocumentItem): Promise<void> {
  const { downloadUrl } = await getDocumentDownloadUrl(document.id)
  window.open(downloadUrl, '_blank', 'noopener,noreferrer')
}

export async function listDocumentShares(documentId: string): Promise<DocumentShare[]> {
  const response = await request<DocumentShare[]>(`/api/documents/${documentId}/share`)
  return unwrapData(response, 'Document shares response was empty')
}

export async function shareDocument(
  documentId: string,
  payload: { email: string; permission: DocumentSharePermission },
): Promise<DocumentShare> {
  const response = await request<DocumentShare>(`/api/documents/${documentId}/share`, {
    body: payload,
    method: 'POST',
  })

  return unwrapData(response, 'Document share response was empty')
}

export async function updateDocumentShare(
  documentId: string,
  shareId: string,
  permission: DocumentSharePermission,
): Promise<DocumentShare> {
  const response = await request<DocumentShare>(
    `/api/documents/${documentId}/share/${shareId}`,
    {
      body: { permission },
      method: 'PATCH',
    },
  )

  return unwrapData(response, 'Document share update response was empty')
}

export async function revokeDocumentShare(
  documentId: string,
  shareId: string,
): Promise<void> {
  await request<void>(`/api/documents/${documentId}/share/${shareId}`, {
    method: 'DELETE',
  })
}

export async function resendDocumentShareEmail(
  documentId: string,
  shareId: string,
): Promise<DocumentShare> {
  const response = await request<DocumentShare>(
    `/api/documents/${documentId}/share/${shareId}/resend-email`,
    { method: 'POST' },
  )

  return unwrapData(response, 'Resend share email response was empty')
}

export async function getUploadSession(sessionId: string): Promise<UploadSession> {
  const response = await request<UploadSession>(`/api/documents/upload/session/${sessionId}`)
  return unwrapData(response, 'Upload session response was empty')
}
