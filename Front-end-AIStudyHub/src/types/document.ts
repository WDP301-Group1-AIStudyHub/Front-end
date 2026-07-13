export interface DocumentSubject {
  _id: string
  name: string
  description?: string
  color?: string
  code?: string
  semester?: string
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
  ragStatus?: 'INDEXED' | 'DELETE_PENDING' | 'DELETED' | 'INDEXING' | 'FAILED' | 'NOT_AVAILABLE'
  ragError?: string
  ragStatusUpdatedAt?: string | null
  deletedAt?: string | null
  deletedBy?: string | null
  trashExpiresAt?: string | null
  trashDaysRemaining?: number | null
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
  ownerId?: string
  createdAt: string
  updatedAt: string
  accessRole?: 'OWNER' | 'EDITOR' | 'VIEWER'
  isShared?: boolean
  sharedBy?: {
    id: string
    fullName: string
    email: string
  }
  personalSubjectId?: string
  personalSubject?: DocumentSubject | null
  shareContext?: 'SUBJECT_WORKSPACE' | 'PERSONAL_SHARE'
  isStarred?: boolean
  starredAt?: string | null
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
  subjectId?: string
}

export interface UpdateDocumentPayload {
  title?: string
  description?: string
  subjectId?: string
  visibility?: 'PUBLIC' | 'PRIVATE'
  status?: 'ACTIVE' | 'ARCHIVED'
}

export interface UpdateSharedDocumentProfilePayload {
  subjectId?: string | null
}

export type DocumentsResponse = DocumentItem[]

export type DocumentSharePermission = 'VIEW' | 'EDIT'
export type EmailDeliveryStatus = 'ACCEPTED' | 'FAILED' | 'SKIPPED'

export interface DocumentShareUser {
  id: string
  fullName: string
  email: string
  avatar?: string
}

export interface DocumentShare {
  id: string
  documentId: string
  sharedWithUser: DocumentShareUser
  permission: DocumentSharePermission
  sharedBy: string
  status: 'ACTIVE' | 'PENDING'
  notificationStatus?: EmailDeliveryStatus
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface UploadSession {
  id: string
  progress: number
  status: string
  stage: string
  message?: string
}
