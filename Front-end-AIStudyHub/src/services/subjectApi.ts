import { clearAuthSession, getStoredToken } from './authStorage'
import type { DocumentItem, DocumentSubject } from '@/types/document'

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export interface SubjectItem {
  _id: string
  name: string
  code?: string
  description?: string
  color?: string
  semester?: string
  documentCount?: number
  memberCount?: number
  teamCount?: number
  currentUserRole?: SubjectWorkspaceRole | null
  currentUserTeams?: Array<{ id: string; name: string }>
  createdAt?: string
  updatedAt?: string
}

export interface SubjectPayload {
  name: string
  code?: string
  description?: string
  color?: string
  semester?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

interface SubjectListData {
  items?: SubjectItem[]
  subjects?: SubjectItem[]
}

export type SubjectWorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type SubjectDocumentPermission = 'VIEW' | 'EDIT'
export type SubjectGrantType = 'USER' | 'TEAM'

export interface SubjectWorkspaceUser {
  id: string
  fullName: string
  email: string
  avatar?: string
}

export interface SubjectMember {
  id: string
  subjectId: string
  role: SubjectWorkspaceRole
  user: SubjectWorkspaceUser
  status?: 'ACTIVE' | 'PENDING'
  teamId?: string
  teamIds?: string[]
  teamNames?: string[]
  expiresAt?: string
  createdAt: string
  updatedAt: string
  notificationStatus?: 'ACCEPTED' | 'FAILED' | 'SKIPPED'
}

export interface SubjectTeam {
  id: string
  subjectId: string
  name: string
  description?: string
  members: SubjectWorkspaceUser[]
  pendingMembers?: SubjectWorkspaceUser[]
  createdAt: string
  updatedAt: string
  notificationStatus?: 'ACCEPTED' | 'FAILED' | 'SKIPPED'
}

export interface SubjectAccessGrant {
  id: string
  subjectId: string
  documentId: string
  granteeType: SubjectGrantType
  granteeId: string
  granteeName: string
  granteeEmail?: string
  permission: SubjectDocumentPermission
  grantedBy: string
  createdAt: string
  updatedAt: string
}

function normalizeSubjectSummary(value: unknown): DocumentSubject | null {
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

function normalizeSubjectWorkspaceDocument(value: DocumentItem): DocumentItem {
  const ownerSubject = normalizeSubjectSummary(value.subject) || normalizeSubjectSummary(value.subjectId)
  const personalSubject = normalizeSubjectSummary(value.personalSubject)
  const id = value.id || value._id || ''

  return {
    ...value,
    _id: value._id || id,
    id,
    subject: ownerSubject || (typeof value.subject === 'string' ? value.subject : null),
    subjectId:
      ownerSubject?._id ||
      (typeof value.subjectId === 'string' ? value.subjectId : undefined),
    personalSubject,
    personalSubjectId: value.personalSubjectId || personalSubject?._id,
    fileName: value.fileName || value.title || 'Untitled document',
    filePublicId: value.filePublicId || '',
    fileUrl: value.fileUrl || '',
    fileType: value.fileType || '',
    fileSize: value.fileSize || 0,
    uploadedBy: value.uploadedBy || '',
    createdAt: value.createdAt || '',
    updatedAt: value.updatedAt || value.createdAt || '',
    isShared: Boolean(value.isShared),
    deletedAt: value.deletedAt ?? null,
    deletedBy: value.deletedBy ?? null,
    trashExpiresAt: value.trashExpiresAt ?? null,
    trashDaysRemaining: value.trashDaysRemaining ?? null,
    isStarred: Boolean(value.isStarred),
    starredAt: value.starredAt ?? null,
  }
}

function authHeaders(): Headers {
  const headers = new Headers()
  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')
  return headers
}

async function request<T>(
  path: string,
  options: { body?: unknown; method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: authHeaders(),
    method: options.method ?? 'GET',
  })
  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from subjects API',
  }))) as ApiResponse<T>

  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    throw new Error(payload.message || 'Subject request failed')
  }

  if (payload.data === undefined) {
    return undefined as T
  }

  return payload.data
}

export async function listSubjects(): Promise<SubjectItem[]> {
  const data = await request<SubjectListData | SubjectItem[]>('/api/subjects?limit=100')

  if (Array.isArray(data)) {
    return data
  }

  return data.items ?? data.subjects ?? []
}

export async function createSubject(
  input: string | SubjectPayload,
): Promise<SubjectItem> {
  const payload =
    typeof input === 'string'
      ? { name: input, code: input.trim().slice(0, 40) }
      : input

  return request<SubjectItem>('/api/subjects', {
    body: payload,
    method: 'POST',
  })
}

export async function updateSubject(
  subjectId: string,
  payload: SubjectPayload,
): Promise<SubjectItem> {
  return request<SubjectItem>(`/api/subjects/${subjectId}`, {
    body: payload,
    method: 'PUT',
  })
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await request<void>(`/api/subjects/${subjectId}`, {
    method: 'DELETE',
  })
}

export async function findOrCreateSubjectByName(name: string): Promise<string> {
  const normalized = name.trim()
  if (!normalized) {
    throw new Error('Subject name cannot be empty')
  }
  const subjects = await listSubjects()
  const match = subjects.find(
    (s) => s.name.trim().toLowerCase() === normalized.toLowerCase(),
  )
  if (match) {
    return match._id
  }
  const newSubject = await createSubject(normalized)
  return newSubject._id
}

export async function getSubject(subjectId: string): Promise<SubjectItem> {
  return request<SubjectItem>(`/api/subjects/${subjectId}`)
}

export async function listSubjectMembers(subjectId: string): Promise<SubjectMember[]> {
  return request<SubjectMember[]>(`/api/subjects/${subjectId}/members`)
}

export async function addSubjectMember(
  subjectId: string,
  payload: { email: string; role: Exclude<SubjectWorkspaceRole, 'OWNER'>; teamId?: string },
): Promise<SubjectMember> {
  return request<SubjectMember>(`/api/subjects/${subjectId}/members`, {
    body: payload,
    method: 'POST',
  })
}

export async function updateSubjectMemberRole(
  subjectId: string,
  memberId: string,
  role: Exclude<SubjectWorkspaceRole, 'OWNER'>,
): Promise<SubjectMember> {
  return request<SubjectMember>(`/api/subjects/${subjectId}/members/${memberId}/role`, {
    body: { role },
    method: 'PATCH',
  })
}

export async function removeSubjectMember(
  subjectId: string,
  memberId: string,
): Promise<void> {
  await request<void>(`/api/subjects/${subjectId}/members/${memberId}`, {
    method: 'DELETE',
  })
}

export async function listSubjectTeams(subjectId: string): Promise<SubjectTeam[]> {
  return request<SubjectTeam[]>(`/api/subjects/${subjectId}/teams`)
}

export async function createSubjectTeam(
  subjectId: string,
  payload: { name: string; description?: string },
): Promise<SubjectTeam> {
  return request<SubjectTeam>(`/api/subjects/${subjectId}/teams`, {
    body: payload,
    method: 'POST',
  })
}

export async function updateSubjectTeam(
  subjectId: string,
  teamId: string,
  payload: { name?: string; description?: string },
): Promise<SubjectTeam> {
  return request<SubjectTeam>(`/api/subjects/${subjectId}/teams/${teamId}`, {
    body: payload,
    method: 'PUT',
  })
}

export async function deleteSubjectTeam(subjectId: string, teamId: string): Promise<void> {
  await request<void>(`/api/subjects/${subjectId}/teams/${teamId}`, {
    method: 'DELETE',
  })
}

export async function addSubjectTeamMember(
  subjectId: string,
  teamId: string,
  userId: string,
): Promise<SubjectTeam> {
  return request<SubjectTeam>(`/api/subjects/${subjectId}/teams/${teamId}/members`, {
    body: { userId },
    method: 'POST',
  })
}

export async function removeSubjectTeamMember(
  subjectId: string,
  teamId: string,
  userId: string,
): Promise<SubjectTeam> {
  return request<SubjectTeam>(
    `/api/subjects/${subjectId}/teams/${teamId}/members/${userId}`,
    { method: 'DELETE' },
  )
}

export async function listSubjectDocuments(subjectId: string) {
  const documents = await request<DocumentItem[]>(`/api/subjects/${subjectId}/documents`)
  return documents.map(normalizeSubjectWorkspaceDocument)
}

export async function listSubjectDocumentAccess(
  subjectId: string,
  documentId: string,
): Promise<SubjectAccessGrant[]> {
  return request<SubjectAccessGrant[]>(
    `/api/subjects/${subjectId}/documents/${documentId}/access`,
  )
}

export async function createSubjectDocumentAccess(
  subjectId: string,
  documentId: string,
  payload: {
    granteeType: SubjectGrantType
    granteeId: string
    permission: SubjectDocumentPermission
  },
): Promise<SubjectAccessGrant> {
  return request<SubjectAccessGrant>(
    `/api/subjects/${subjectId}/documents/${documentId}/access`,
    { body: payload, method: 'POST' },
  )
}

export async function updateSubjectDocumentAccess(
  subjectId: string,
  documentId: string,
  grantId: string,
  permission: SubjectDocumentPermission,
): Promise<SubjectAccessGrant> {
  return request<SubjectAccessGrant>(
    `/api/subjects/${subjectId}/documents/${documentId}/access/${grantId}`,
    { body: { permission }, method: 'PATCH' },
  )
}

export async function revokeSubjectDocumentAccess(
  subjectId: string,
  documentId: string,
  grantId: string,
): Promise<void> {
  await request<void>(
    `/api/subjects/${subjectId}/documents/${documentId}/access/${grantId}`,
    { method: 'DELETE' },
  )
}
