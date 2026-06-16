import { useCallback, useEffect, useState } from 'react'
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from '../services/subjectApi'
import type { Subject, SubjectPayload } from '../types/subject'

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSubjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextSubjects = await listSubjects()
      setSubjects(nextSubjects)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load subjects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubjects()
  }, [loadSubjects])

  const addSubject = useCallback(async (payload: SubjectPayload) => {
    const created = await createSubject(payload)
    setSubjects((current) => [created, ...current])
    return created
  }, [])

  const saveSubject = useCallback(async (subjectId: string, payload: SubjectPayload) => {
    const updated = await updateSubject(subjectId, payload)
    setSubjects((current) =>
      current.map((subject) => (subject._id === subjectId ? updated : subject)),
    )
    return updated
  }, [])

  const removeSubject = useCallback(async (subjectId: string) => {
    await deleteSubject(subjectId)
    setSubjects((current) => current.filter((subject) => subject._id !== subjectId))
  }, [])

  return {
    addSubject,
    error,
    isLoading,
    loadSubjects,
    removeSubject,
    saveSubject,
    subjects,
  }
}
