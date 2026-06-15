import { apiClient, unwrapApiData } from './apiClient'
import type { Subject, SubjectPayload } from '../types/subject'

function unwrapSubjectList(payload: unknown): Subject[] {
  const data = unwrapApiData<unknown>(payload, 'Subject list response was empty')

  if (Array.isArray(data)) {
    return data as Subject[]
  }

  if (data && typeof data === 'object') {
    const candidate = data as { subjects?: unknown; items?: unknown; results?: unknown }

    if (Array.isArray(candidate.subjects)) {
      return candidate.subjects as Subject[]
    }

    if (Array.isArray(candidate.items)) {
      return candidate.items as Subject[]
    }

    if (Array.isArray(candidate.results)) {
      return candidate.results as Subject[]
    }
  }

  return []
}

export async function listSubjects(): Promise<Subject[]> {
  const response = await apiClient.get('/api/subjects')
  return unwrapSubjectList(response.data)
}

export async function createSubject(payload: SubjectPayload): Promise<Subject> {
  const response = await apiClient.post('/api/subjects', payload)
  return unwrapApiData<Subject>(response.data, 'Created subject response was empty')
}

export async function updateSubject(subjectId: string, payload: SubjectPayload): Promise<Subject> {
  const response = await apiClient.put(`/api/subjects/${subjectId}`, payload)
  return unwrapApiData<Subject>(response.data, 'Updated subject response was empty')
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await apiClient.delete(`/api/subjects/${subjectId}`)
}
