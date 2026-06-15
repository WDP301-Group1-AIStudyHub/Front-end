export interface DocumentItem {
  id: string
  title: string
  description?: string
  subject?: string
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
  onProgress?: (progress: number) => void
  file: File
  title: string
  description?: string
  subject?: string
}

export interface UpdateDocumentPayload {
  title?: string
  description?: string
  subject?: string
}

export type DocumentsResponse = DocumentItem[]
