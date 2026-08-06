// Wording for the coded conditions the ask pipeline reports. The server sends a
// message alongside each code, but it is written for API consumers; these are
// the strings the user reads, keyed by code so the copy can change without a
// backend deploy. Rendered as markdown, so links are live.

export const NOTICE_TEXT: Record<string, string> = {
  DEGRADED_MODE:
    'Your saved API key was rejected, so this answer used your free monthly allowance. Update the key in [Settings](/settings) to go back to unlimited use.',
}

const QUOTA_ERROR_TEXT: Record<string, string> = {
  QUOTA_EXHAUSTED_NO_KEY:
    "You've used every free message for this month. Add your own Gemini API key in [Settings](/settings) for unlimited use, or wait for the allowance to reset on the 1st.",
  QUOTA_EXHAUSTED_INVALID_KEY:
    "You've used every free message for this month, and your saved API key was rejected. Update the key in [Settings](/settings) to keep asking.",
}

/**
 * Copy for a failed ask, or null when the failure is not one this maps.
 *
 * Duck-typed on `code` rather than narrowing to `ChatApiError`: this module is
 * imported by `chatApi`, so importing the class back would be a cycle. It
 * accepts both shapes that carry a code — the thrown error and the `error`
 * stream event.
 */
export function quotaErrorText(error: unknown): string | null {
  const code = (error as { code?: unknown } | null | undefined)?.code
  if (typeof code !== 'string') return null
  return QUOTA_ERROR_TEXT[code] ?? null
}

/**
 * Text for a failed run. A coded failure was already phrased for the user by
 * the server, so it is shown as-is; only an uncoded one gets the `Error:`
 * prefix, because that is a raw message the user was never meant to read.
 */
export function askErrorText(
  error: { code?: string; message?: string } | unknown,
  fallback = 'Failed to get answer',
): string {
  const { code, message } = (error ?? {}) as {
    code?: unknown
    message?: unknown
  }
  const text = typeof message === 'string' && message ? message : fallback

  if (typeof code === 'string' && code) {
    return QUOTA_ERROR_TEXT[code] ?? text
  }
  return `Error: ${text}`
}
