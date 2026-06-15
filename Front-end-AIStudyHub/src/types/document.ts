export interface DocumentItem {
  id: string
  title: string
  description?: string
  subject?: string | { _id: string; name: string; description?: string; color?: string; code?: string }
  fileUrl: string
  filePublicId: string
  fileName: string
  fileType: string
  fileSize: number
  extractedText?: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
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
