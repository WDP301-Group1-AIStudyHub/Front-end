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
