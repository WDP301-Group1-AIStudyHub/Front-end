import { apiClient, ApiClientError, unwrapApiData } from './apiClient'
import type {
  DocumentDetail,
  DocumentItem,
  DocumentsResponse,
  UpdateDocumentPayload,
  UploadDocumentPayload,
  UploadDocumentResult,
  UploadSession,
} from '../types/document'

export class DocumentApiError extends ApiClientError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = 'DocumentApiError'
  }
}

function normalizeDocument(document: DocumentItem): DocumentItem {
  const documentId = document._id || document.id || ''

  return {
    ...document,
    _id: documentId,
    id: documentId,
    subjectId: document.subjectId || '',
    status: document.status || 'PENDING',
    totalViews: document.totalViews ?? 0,
    totalDownloads: document.totalDownloads ?? 0,
    fileName: document.fileName || document.title || 'Untitled document',
    filePublicId: document.filePublicId || '',
    fileUrl: document.fileUrl || '',
    uploadedBy: document.uploadedBy || '',
  }
}

function unwrapDocumentList(payload: unknown): DocumentsResponse {
  const data = unwrapApiData<unknown>(payload, 'Document list response was empty')

  if (Array.isArray(data)) {
    return (data as DocumentItem[]).map(normalizeDocument)
  }

  if (data && typeof data === 'object') {
    const candidate = data as { documents?: unknown; items?: unknown; results?: unknown }

    if (Array.isArray(candidate.documents)) {
      return (candidate.documents as DocumentItem[]).map(normalizeDocument)
    }

    if (Array.isArray(candidate.items)) {
      return (candidate.items as DocumentItem[]).map(normalizeDocument)
    }

    if (Array.isArray(candidate.results)) {
      return (candidate.results as DocumentItem[]).map(normalizeDocument)
    }
  }

  return []
}

export async function listDocuments(): Promise<DocumentsResponse> {
  const response = await apiClient.get('/api/documents')
  return unwrapDocumentList(response.data)
}

export async function searchDocuments({
  keyword,
  subjectId,
}: {
  keyword?: string
  subjectId?: string
}): Promise<DocumentsResponse> {
  const params = new URLSearchParams()

  if (keyword?.trim()) {
    params.set('keyword', keyword.trim())
  }

  if (subjectId?.trim()) {
    params.set('subjectId', subjectId.trim())
  }

  const query = params.toString()
  const response = await apiClient.get(query ? `/api/documents/search?${query}` : '/api/documents')
  return unwrapDocumentList(response.data)
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await apiClient.get(`/api/documents/${documentId}`)
  return normalizeDocument(
    unwrapApiData<DocumentDetail>(response.data, 'Document response was empty'),
  ) as DocumentDetail
}

export async function uploadDocument({
  description,
  file,
  subjectId,
  title,
}: UploadDocumentPayload): Promise<UploadDocumentResult> {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('title', title.trim())
  formData.set('subjectId', subjectId)

  if (description?.trim()) {
    formData.set('description', description.trim())
  }

  const response = await apiClient.post('/api/documents/upload', formData)
  const data = unwrapApiData<unknown>(response.data, 'Uploaded document response was empty')

  if (data && typeof data === 'object') {
    const candidate = data as {
      document?: DocumentItem
      uploadSession?: UploadSession
      session?: UploadSession
      uploadSessionId?: string
    }

    return {
      document: candidate.document ? normalizeDocument(candidate.document) : undefined,
      uploadSession:
        candidate.uploadSession ||
        candidate.session ||
        (candidate.uploadSessionId
          ? {
              _id: candidate.uploadSessionId,
              status: 'PENDING',
              stage: 'UPLOADED',
              progress: 0,
            }
          : undefined),
    }
  }

  return {}
}

export async function updateDocument(
  documentId: string,
  payload: UpdateDocumentPayload,
): Promise<DocumentItem> {
  const response = await apiClient.put(`/api/documents/${documentId}`, payload)
  return normalizeDocument(
    unwrapApiData<DocumentItem>(response.data, 'Updated document response was empty'),
  )
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/api/documents/${documentId}`)
}

export async function getUploadSession(sessionId: string): Promise<UploadSession> {
  const response = await apiClient.get(`/api/upload-sessions/${sessionId}`)
  return unwrapApiData<UploadSession>(response.data, 'Upload session response was empty')
}
