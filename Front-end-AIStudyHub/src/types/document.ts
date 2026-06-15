export interface DocumentItem {
  _id: string
  id: string
  title: string
  description?: string
  subjectId: string
  subject?: string
  fileType: string
  fileSize: number
  status: string
  totalViews: number
  totalDownloads: number
  createdAt: string
  updatedAt?: string
  fileUrl: string
  fileName: string
  filePublicId: string
  extractedText?: string
  uploadedBy: string
}

export interface UploadSession {
  _id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  stage:
    | 'UPLOADED'
    | 'EXTRACTING_TEXT'
    | 'CHUNKING'
    | 'EMBEDDING'
    | 'UPSERTING_VECTOR'
    | 'COMPLETED'
  progress: number
  message?: string
}

export interface DocumentVersion {
  _id?: string
  versionNumber: number
  uploadMode: string
  uploadDate: string
  processingStatus: string
}

export interface DocumentDetail extends DocumentItem {
  visibility?: string
  totalVersions?: number
  originalFileName?: string
  storedFileName?: string
  mimeType?: string
  extractionStatus?: string
  totalChunks?: number
  lastIndexedAt?: string
  versions?: DocumentVersion[]
}

export interface UploadDocumentPayload {
  file: File
  title: string
  description?: string
  subjectId: string
}

export interface UploadDocumentResult {
  document?: DocumentItem
  uploadSession?: UploadSession
}

export interface UpdateDocumentPayload {
  title?: string
  description?: string
  subjectId?: string
}

export type DocumentsResponse = DocumentItem[]
