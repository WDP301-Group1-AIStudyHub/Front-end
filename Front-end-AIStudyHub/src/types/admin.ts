import type { AuthUser } from './auth'
export type AdminUserStatus = 'active' | 'inactive'
export type SystemActivitySeverity = 'info' | 'success' | 'warning' | 'critical'

export interface AdminUser extends AuthUser {
  isActive: boolean
  lastLoginAt?: string
  documentCount: number
  status: AdminUserStatus
}

export interface AdminUserUpdatePayload {
  avatar?: string
  email?: string
  fullName?: string
  role?: AuthUser['role']
}

export interface AdminDocument {
  id: string
  createdAt: string
  description?: string
  extractedText?: string
  fileName: string
  filePublicId: string
  fileSize: number
  fileType: string
  fileUrl: string
  indexedStatus: 'indexed' | 'processing' | 'failed'
  ownerEmail: string
  ownerName: string
  subject?: string
  title: string
  updatedAt?: string
  uploadedBy: string
}

export interface AdminDocumentMetadataPayload {
  description?: string
  subject?: string
  title?: string
}

export interface SystemActivity {
  id: string
  actor: string
  createdAt: string
  description: string
  severity: SystemActivitySeverity
  target: string
  type: 'auth' | 'user' | 'document' | 'system'
}
