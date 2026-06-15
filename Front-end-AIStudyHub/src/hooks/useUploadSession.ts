import { useEffect, useState } from 'react'
import { getUploadSession } from '../services/documentApi'
import type { UploadSession } from '../types/document'

const POLL_INTERVAL_MS = 2500

export function useUploadSession(sessionId: string | null, enabled = true) {
  const [session, setSession] = useState<UploadSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || !enabled) {
      return undefined
    }

    let cancelled = false
    let timeoutId: number | undefined

    async function poll() {
      try {
        const nextSession = await getUploadSession(sessionId as string)

        if (cancelled) {
          return
        }

        setSession(nextSession)
        setError(null)

        if (nextSession.status !== 'COMPLETED' && nextSession.status !== 'FAILED') {
          timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load upload session')
          timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS)
        }
      }
    }

    void poll()

    return () => {
      cancelled = true
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [enabled, sessionId])

  return { error, session, setSession }
}
