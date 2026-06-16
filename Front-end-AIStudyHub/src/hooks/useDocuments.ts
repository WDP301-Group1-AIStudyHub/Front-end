import { useCallback, useEffect, useState } from 'react'
import {
  deleteDocument,
  listDocuments,
  searchDocuments,
  updateDocument,
  uploadDocument,
} from '../services/documentApi'
import type {
  DocumentItem,
  UpdateDocumentPayload,
  UploadDocumentPayload,
} from '../types/document'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextDocuments = await listDocuments()
      setDocuments(nextDocuments)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const search = useCallback(async (keyword?: string, subjectId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await searchDocuments({ keyword, subjectId })
      setDocuments(results)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to search documents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const upload = useCallback(async (payload: UploadDocumentPayload): Promise<DocumentItem> => {
    const result = await uploadDocument(payload)
    setDocuments((current) => [result, ...current])
    return result
  }, [])

  const save = useCallback(async (documentId: string, payload: UpdateDocumentPayload) => {
    const updated = await updateDocument(documentId, payload)
    setDocuments((current) =>
      current.map((document) => (document._id === documentId ? updated : document)),
    )
    return updated
  }, [])

  const remove = useCallback(async (documentId: string) => {
    await deleteDocument(documentId)
    setDocuments((current) => current.filter((document) => document._id !== documentId))
  }, [])

  return {
    documents,
    error,
    isLoading,
    loadDocuments,
    remove,
    save,
    search,
    setDocuments,
    upload,
  }
}
