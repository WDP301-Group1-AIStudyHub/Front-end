/**
 * Authoritative wire contract for the BYOK (Bring Your Own Key) feature.
 * src/types/ai.ts is the single contract of record for wire shapes.
 * The backend implementation is written to match this contract.
 */

export type AiProvider = 'gemini'

export type AiCredentialStatusValue = 'none' | 'valid' | 'invalid'

export interface AiCredentialStatus {
  provider: AiProvider
  last4: string | null
  status: AiCredentialStatusValue
  addedAt: string | null
  lastValidatedAt: string | null
}

export type AiUnlimitedReason = 'byok' | 'exempt'

export interface AiUsage {
  /**
   * Calendar month the counter belongs to in "YYYY-MM" format (e.g. "2026-08"),
   * matching the { userId, period } unique index in the backend design.
   * Reset date is derivable from it, so no separate periodEnd field is needed.
   */
  period: string
  used: number
  limit: number
  unlimited: boolean
  degraded: boolean
  /**
   * Why the cap does not apply. A user with a working key and an exempt admin
   * are both `unlimited`, but telling a keyless admin they are on BYOK is wrong.
   * Only meaningful when `unlimited` is true.
   */
  unlimitedReason?: AiUnlimitedReason
}

export type AiErrorCode =
  | 'QUOTA_EXHAUSTED_NO_KEY'
  | 'QUOTA_EXHAUSTED_INVALID_KEY'
  | 'CREDENTIAL_INVALID'
  | 'CREDENTIAL_UNAVAILABLE'

export interface SaveCredentialPayload {
  apiKey: string
  provider?: AiProvider
}

export type AiScenario =
  | 'default'
  | 'healthy_byok'
  | 'degraded'
  | 'quota_exhausted_no_key'
  | 'quota_exhausted_broken_key'
  | 'admin_exempt'
