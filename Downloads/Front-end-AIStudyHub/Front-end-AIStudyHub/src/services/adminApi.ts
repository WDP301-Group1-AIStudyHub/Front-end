import type {
  AdminDocument,
  AdminDocumentMetadataPayload,
  AdminSubject,
  AdminSubjectPayload,
  AdminUser,
  AdminUserUpdatePayload,
  SystemActivity,
} from '../types/admin'

const USERS_KEY = 'ai-study-hub:admin-users'
const DOCUMENTS_KEY = 'ai-study-hub:admin-documents'
const SUBJECTS_KEY = 'ai-study-hub:admin-subjects'
const ACTIVITIES_KEY = 'ai-study-hub:admin-activities'

const now = new Date()

const mockUsers: AdminUser[] = [
  {
    id: 'admin-001',
    avatar: 'https://i.pravatar.cc/150?img=11',
    createdAt: '2025-08-12T09:00:00.000Z',
    documentCount: 18,
    email: 'arjun.admin@aistudy.edu',
    fullName: 'Arjun Sharma',
    isActive: true,
    lastLoginAt: now.toISOString(),
    role: 'admin',
    status: 'active',
    updatedAt: now.toISOString(),
  },
  {
    id: 'user-001',
    avatar: 'https://i.pravatar.cc/150?img=24',
    createdAt: '2025-10-04T11:45:00.000Z',
    documentCount: 42,
    email: 'maya.research@university.edu',
    fullName: 'Maya Iyer',
    isActive: true,
    lastLoginAt: '2026-05-24T14:15:00.000Z',
    role: 'user',
    status: 'active',
    updatedAt: '2026-05-24T14:15:00.000Z',
  },
  {
    id: 'user-002',
    avatar: 'https://i.pravatar.cc/150?img=42',
    createdAt: '2025-11-18T08:20:00.000Z',
    documentCount: 9,
    email: 'leo.notes@campus.edu',
    fullName: 'Leo Nakamura',
    isActive: false,
    lastLoginAt: '2026-05-18T06:05:00.000Z',
    role: 'user',
    status: 'inactive',
    updatedAt: '2026-05-20T10:30:00.000Z',
  },
  {
    id: 'user-003',
    avatar: 'https://i.pravatar.cc/150?img=18',
    createdAt: '2026-01-08T12:00:00.000Z',
    documentCount: 27,
    email: 'nora.ai@researchlab.edu',
    fullName: 'Nora Patel',
    isActive: true,
    lastLoginAt: '2026-05-25T03:42:00.000Z',
    role: 'user',
    status: 'active',
    updatedAt: '2026-05-25T03:42:00.000Z',
  },
]

const mockDocuments: AdminDocument[] = [
  {
    id: 'doc-001',
    createdAt: '2026-05-21T09:30:00.000Z',
    description: 'Rotational curves and halo density synthesis.',
    extractedText: 'Dark matter rotation curve research notes.',
    fileName: 'orbital-dynamics-analysis.pdf',
    filePublicId: 'mock/orbital-dynamics-analysis',
    fileSize: 4_200_000,
    fileType: 'application/pdf',
    fileUrl: 'https://example.com/orbital-dynamics-analysis.pdf',
    indexedStatus: 'indexed',
    ownerEmail: 'maya.research@university.edu',
    ownerName: 'Maya Iyer',
    subject: 'Astrophysics',
    title: 'Orbital Dynamics Analysis v2.4',
    uploadProgress: 100,
    uploadStatus: 'completed',
    updatedAt: '2026-05-21T09:30:00.000Z',
    uploadedBy: 'user-001',
  },
  {
    id: 'doc-002',
    createdAt: '2026-05-22T16:10:00.000Z',
    description: 'Annotated AI research topology notes.',
    extractedText: 'Graph and neural model notes.',
    fileName: 'deep-space-neural-topologies.pdf',
    filePublicId: 'mock/deep-space-neural-topologies',
    fileSize: 12_800_000,
    fileType: 'application/pdf',
    fileUrl: 'https://example.com/deep-space-neural-topologies.pdf',
    indexedStatus: 'processing',
    ownerEmail: 'nora.ai@researchlab.edu',
    ownerName: 'Nora Patel',
    subject: 'AI Research',
    title: 'Deep Space Neural Topologies',
    uploadProgress: 72,
    uploadStatus: 'processing',
    updatedAt: '2026-05-23T05:45:00.000Z',
    uploadedBy: 'user-003',
  },
  {
    id: 'doc-003',
    createdAt: '2026-05-19T10:20:00.000Z',
    description: 'Dataset metadata review required.',
    fileName: 'void-flux-data-stream.pdf',
    filePublicId: 'mock/void-flux-data-stream',
    fileSize: 256_000,
    fileType: 'application/pdf',
    fileUrl: 'https://example.com/void-flux-data-stream.pdf',
    indexedStatus: 'failed',
    ownerEmail: 'leo.notes@campus.edu',
    ownerName: 'Leo Nakamura',
    subject: 'Quantum Physics',
    title: 'Void Flux Data Stream',
    uploadProgress: 36,
    uploadStatus: 'failed',
    updatedAt: '2026-05-20T11:15:00.000Z',
    uploadedBy: 'user-002',
  },
]

const mockSubjects: AdminSubject[] = [
  {
    id: 'sub-001',
    code: 'ASTRO',
    color: '#2f73d9',
    createdAt: '2026-04-12T09:00:00.000Z',
    description: 'Physics, orbital mechanics, and astronomy learning material.',
    documentCount: 1,
    name: 'Astrophysics',
    ownerId: 'admin-001',
    updatedAt: '2026-05-21T09:30:00.000Z',
  },
  {
    id: 'sub-002',
    code: 'AI',
    color: '#18a99d',
    createdAt: '2026-04-18T10:15:00.000Z',
    description: 'Machine learning, neural networks, and AI research notes.',
    documentCount: 1,
    name: 'AI Research',
    ownerId: 'admin-001',
    updatedAt: '2026-05-23T05:45:00.000Z',
  },
  {
    id: 'sub-003',
    code: 'QPHY',
    color: '#dca53d',
    createdAt: '2026-04-20T14:25:00.000Z',
    description: 'Quantum mechanics and experimental physics documents.',
    documentCount: 1,
    name: 'Quantum Physics',
    ownerId: 'admin-001',
    updatedAt: '2026-05-20T11:15:00.000Z',
  },
]

const mockActivities: SystemActivity[] = [
  {
    id: 'act-001',
    actor: 'Astraea Indexer',
    createdAt: '2026-05-25T04:22:00.000Z',
    description: 'Processed 12 document embeddings for AI chat.',
    severity: 'success',
    target: 'Document pipeline',
    type: 'system',
  },
  {
    id: 'act-002',
    actor: 'Arjun Sharma',
    createdAt: '2026-05-25T03:57:00.000Z',
    description: 'Updated user role and profile metadata.',
    severity: 'info',
    target: 'Nora Patel',
    type: 'user',
  },
  {
    id: 'act-003',
    actor: 'Cloudinary Sync',
    createdAt: '2026-05-24T18:30:00.000Z',
    description: 'Document indexing failed because extracted text was empty.',
    severity: 'warning',
    target: 'Void Flux Data Stream',
    type: 'document',
  },
  {
    id: 'act-004',
    actor: 'Auth Guard',
    createdAt: '2026-05-24T15:12:00.000Z',
    description: 'Blocked inactive account from protected route.',
    severity: 'critical',
    target: 'Leo Nakamura',
    type: 'auth',
  },
]

function readCollection<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }

  try {
    return JSON.parse(raw) as T[]
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
}

function writeCollection<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function createActivity(activity: Omit<SystemActivity, 'createdAt' | 'id'>) {
  const activities = readCollection<SystemActivity>(ACTIVITIES_KEY, mockActivities)
  const nextActivity: SystemActivity = {
    ...activity,
    createdAt: new Date().toISOString(),
    id: `act-${Date.now()}`,
  }

  writeCollection(ACTIVITIES_KEY, [nextActivity, ...activities].slice(0, 80))
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 220)
  })
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return delay(readCollection<AdminUser>(USERS_KEY, mockUsers))
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<AdminUser> {
  const users = readCollection<AdminUser>(USERS_KEY, mockUsers)
  const updatedUsers: AdminUser[] = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          isActive,
          status: isActive ? 'active' : 'inactive',
          updatedAt: new Date().toISOString(),
        }
      : user,
  )
  const updatedUser = updatedUsers.find((user) => user.id === userId)

  if (!updatedUser) {
    throw new Error('User was not found')
  }

  writeCollection(USERS_KEY, updatedUsers)
  createActivity({
    actor: 'Admin Console',
    description: `${isActive ? 'Activated' : 'Deactivated'} user account.`,
    severity: isActive ? 'success' : 'warning',
    target: updatedUser.fullName,
    type: 'user',
  })

  return delay(updatedUser)
}

export async function updateAdminUser(
  userId: string,
  payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
  const users = readCollection<AdminUser>(USERS_KEY, mockUsers)
  const updatedUsers = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          ...payload,
          updatedAt: new Date().toISOString(),
        }
      : user,
  )
  const updatedUser = updatedUsers.find((user) => user.id === userId)

  if (!updatedUser) {
    throw new Error('User was not found')
  }

  writeCollection(USERS_KEY, updatedUsers)
  createActivity({
    actor: 'Admin Console',
    description: 'Updated user information.',
    severity: 'info',
    target: updatedUser.fullName,
    type: 'user',
  })

  return delay(updatedUser)
}

export async function listAdminDocuments(): Promise<AdminDocument[]> {
  return delay(readCollection<AdminDocument>(DOCUMENTS_KEY, mockDocuments))
}

export async function listSubjects(): Promise<AdminSubject[]> {
  const subjects = readCollection<AdminSubject>(SUBJECTS_KEY, mockSubjects)
  const documents = readCollection<AdminDocument>(DOCUMENTS_KEY, mockDocuments)

  return delay(
    subjects.map((subject) => ({
      ...subject,
      documentCount: documents.filter((document) => document.subject === subject.name).length,
    })),
  )
}

export async function createSubject(payload: AdminSubjectPayload): Promise<AdminSubject> {
  const subjects = readCollection<AdminSubject>(SUBJECTS_KEY, mockSubjects)
  const now = new Date().toISOString()
  const nextSubject: AdminSubject = {
    code: payload.code?.trim(),
    color: payload.color || '#2f73d9',
    createdAt: now,
    description: payload.description?.trim(),
    documentCount: 0,
    id: `sub-${Date.now()}`,
    name: payload.name.trim(),
    ownerId: 'admin-001',
    updatedAt: now,
  }

  writeCollection(SUBJECTS_KEY, [nextSubject, ...subjects])
  createActivity({
    actor: 'Admin Console',
    description: 'Created subject metadata.',
    severity: 'success',
    target: nextSubject.name,
    type: 'system',
  })

  return delay(nextSubject)
}

export async function updateSubject(
  subjectId: string,
  payload: AdminSubjectPayload,
): Promise<AdminSubject> {
  const subjects = readCollection<AdminSubject>(SUBJECTS_KEY, mockSubjects)
  const documents = readCollection<AdminDocument>(DOCUMENTS_KEY, mockDocuments)
  const currentSubject = subjects.find((subject) => subject.id === subjectId)

  if (!currentSubject) {
    throw new Error('Subject was not found')
  }

  const nextName = payload.name.trim()
  const updatedSubjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          code: payload.code?.trim(),
          color: payload.color || subject.color,
          description: payload.description?.trim(),
          name: nextName,
          updatedAt: new Date().toISOString(),
        }
      : subject,
  )

  const updatedDocuments = documents.map((document) =>
    document.subject === currentSubject.name
      ? {
          ...document,
          subject: nextName,
          updatedAt: new Date().toISOString(),
        }
      : document,
  )
  const updatedSubject = updatedSubjects.find((subject) => subject.id === subjectId)

  if (!updatedSubject) {
    throw new Error('Subject was not found')
  }

  writeCollection(SUBJECTS_KEY, updatedSubjects)
  writeCollection(DOCUMENTS_KEY, updatedDocuments)
  createActivity({
    actor: 'Admin Console',
    description: 'Updated subject metadata.',
    severity: 'info',
    target: updatedSubject.name,
    type: 'system',
  })

  return delay(updatedSubject)
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const subjects = readCollection<AdminSubject>(SUBJECTS_KEY, mockSubjects)
  const subject = subjects.find((item) => item.id === subjectId)

  if (!subject) {
    throw new Error('Subject was not found')
  }

  writeCollection(
    SUBJECTS_KEY,
    subjects.filter((item) => item.id !== subjectId),
  )
  createActivity({
    actor: 'Admin Console',
    description: 'Deleted subject metadata.',
    severity: 'warning',
    target: subject.name,
    type: 'system',
  })

  return delay(undefined)
}

export async function updateDocumentMetadata(
  documentId: string,
  payload: AdminDocumentMetadataPayload,
): Promise<AdminDocument> {
  const documents = readCollection<AdminDocument>(DOCUMENTS_KEY, mockDocuments)
  const updatedDocuments = documents.map((document) =>
    document.id === documentId
      ? {
          ...document,
          ...payload,
          updatedAt: new Date().toISOString(),
        }
      : document,
  )
  const updatedDocument = updatedDocuments.find((document) => document.id === documentId)

  if (!updatedDocument) {
    throw new Error('Document was not found')
  }

  writeCollection(DOCUMENTS_KEY, updatedDocuments)
  createActivity({
    actor: 'Admin Console',
    description: 'Edited document metadata.',
    severity: 'info',
    target: updatedDocument.title,
    type: 'document',
  })

  return delay(updatedDocument)
}

export async function listSystemActivities(): Promise<SystemActivity[]> {
  return delay(readCollection<SystemActivity>(ACTIVITIES_KEY, mockActivities))
}
