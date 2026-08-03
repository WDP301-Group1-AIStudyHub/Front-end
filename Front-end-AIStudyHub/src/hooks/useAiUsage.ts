import { useCallback, useEffect, useState } from 'react'
import { getUsage } from '@/services/aiCredentialApi'
import type { AiUsage } from '@/types/ai'

export const AI_USAGE_UPDATED_EVENT = 'ai-usage-updated'

export function notifyAiUsageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_USAGE_UPDATED_EVENT))
  }
}

export function useAiUsage() {
  const [usage, setUsage] = useState<AiUsage | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsage()
      setUsage(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load AI usage'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()

    const handleUpdate = () => {
      fetchUsage()
    }

    window.addEventListener(AI_USAGE_UPDATED_EVENT, handleUpdate)
    return () => {
      window.removeEventListener(AI_USAGE_UPDATED_EVENT, handleUpdate)
    }
  }, [fetchUsage])

  return {
    usage,
    loading,
    error,
    refreshUsage: fetchUsage,
  }
}
