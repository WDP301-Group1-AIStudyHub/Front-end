import { useCallback, useEffect, useState } from 'react'
import { getDocument } from '../services/documentApi'
import type { DocumentDetail } from '../types/document'

export function useDocumentDetail(documentId: string | undefined) {
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocument = useCallback(async () => {
    if (!documentId) {
      setError('Document id is missing')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      setDocument(await getDocument(documentId))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load document')
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    void loadDocument()
  }, [loadDocument])

  return { document, error, isLoading, loadDocument }
}
