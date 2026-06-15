import type { AuthUser } from './auth'
import type { DocumentItem } from './document'

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

export interface AdminDocument extends DocumentItem {
  indexedStatus: 'indexed' | 'processing' | 'failed'
  ownerEmail: string
  ownerName: string
  uploadProgress?: number
  uploadStatus?: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed'
}

export interface AdminDocumentMetadataPayload {
  description?: string
  subject?: string
  title?: string
}

export interface AdminSubject {
  id: string
  code?: string
  color?: string
  createdAt: string
  description?: string
  documentCount: number
  name: string
  ownerId?: string
  updatedAt: string
}

export interface AdminSubjectPayload {
  code?: string
  color?: string
  description?: string
  name: string
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
