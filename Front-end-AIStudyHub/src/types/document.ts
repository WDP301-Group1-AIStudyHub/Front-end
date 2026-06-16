export interface DocumentSubject {
  _id: string
  name: string
  description?: string
  color?: string
  code?: string
}

export interface DocumentItem {
  _id?: string
  id: string
  title: string
  description?: string
  subjectId?: string
  subject?: string | DocumentSubject | null
  visibility?: 'PUBLIC' | 'PRIVATE'
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED' | string
  totalViews?: number
  totalDownloads?: number
  totalVersions?: number
  totalChunks?: number
  lastIndexedAt?: string | null
  fileUrl: string
  filePublicId: string
  fileName: string
  fileType: string
  fileSize: number
  originalFileName?: string
  storedFileName?: string
  mimeType?: string
  extractionStatus?: string
  extractedText?: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  versionNumber: number
  uploadMode: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  processingStatus?: string
  processingStage?: string
  processingProgress?: number
  totalChunks: number
  indexedAt?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface DocumentDetail extends DocumentItem {
  versions?: DocumentVersion[]
}

export interface UploadDocumentPayload {
  file: File
  title: string
  description?: string
  subject?: string
}

export interface UpdateDocumentPayload {
  title?: string
  description?: string
  subject?: string
  subjectId?: string
}

export type DocumentsResponse = DocumentItem[]

export interface UploadSession {
  id: string
  progress: number
  status: string
  stage: string
  message?: string
}
