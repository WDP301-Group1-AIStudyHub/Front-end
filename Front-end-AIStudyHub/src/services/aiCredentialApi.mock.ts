import { ApiClientError } from '@/services/apiClient'
import type {
  AiCredentialStatus,
  AiScenario,
  AiUsage,
  SaveCredentialPayload,
} from '@/types/ai'

const SIMULATED_LATENCY_MS = 400

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getCurrentPeriod(): string {
  return new Date().toISOString().slice(0, 7)
}

// Initial in-memory state
let currentScenario: AiScenario = 'default'

let internalStatus: AiCredentialStatus = {
  provider: 'gemini',
  last4: null,
  status: 'none',
  addedAt: null,
  lastValidatedAt: null,
}

let internalUsage: AiUsage = {
  period: getCurrentPeriod(),
  used: 3,
  limit: 20,
  unlimited: false,
  degraded: false,
}

// Dev scenario reader from URL or internal variable
function getActiveScenario(): AiScenario {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const paramScenario = params.get('byok_scenario') as AiScenario | null
    if (paramScenario && SCENARIOS[paramScenario]) {
      return paramScenario
    }
  }
  return currentScenario
}

const SCENARIOS: Record<
  AiScenario,
  { status: AiCredentialStatus; usage: AiUsage }
> = {
  default: {
    status: {
      provider: 'gemini',
      last4: null,
      status: 'none',
      addedAt: null,
      lastValidatedAt: null,
    },
    usage: {
      period: getCurrentPeriod(),
      used: 3,
      limit: 20,
      unlimited: false,
      degraded: false,
    },
  },
  healthy_byok: {
    status: {
      provider: 'gemini',
      last4: '9876',
      status: 'valid',
      addedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastValidatedAt: new Date().toISOString(),
    },
    usage: {
      period: getCurrentPeriod(),
      used: 42,
      limit: 20,
      unlimited: true,
      unlimitedReason: 'byok',
      degraded: false,
    },
  },
  degraded: {
    status: {
      provider: 'gemini',
      last4: '4321',
      status: 'invalid',
      addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      lastValidatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    usage: {
      period: getCurrentPeriod(),
      used: 8,
      limit: 20,
      unlimited: false,
      degraded: true,
    },
  },
  quota_exhausted_no_key: {
    status: {
      provider: 'gemini',
      last4: null,
      status: 'none',
      addedAt: null,
      lastValidatedAt: null,
    },
    usage: {
      period: getCurrentPeriod(),
      used: 20,
      limit: 20,
      unlimited: false,
      degraded: false,
    },
  },
  quota_exhausted_broken_key: {
    status: {
      provider: 'gemini',
      last4: '1111',
      status: 'invalid',
      addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastValidatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    usage: {
      period: getCurrentPeriod(),
      used: 20,
      limit: 20,
      unlimited: false,
      degraded: true,
    },
  },
  admin_exempt: {
    status: {
      provider: 'gemini',
      last4: null,
      status: 'none',
      addedAt: null,
      lastValidatedAt: null,
    },
    usage: {
      period: getCurrentPeriod(),
      used: 0,
      limit: 20,
      unlimited: true,
      unlimitedReason: 'exempt',
      degraded: false,
    },
  },
}

export function setMockScenario(scenario: AiScenario) {
  currentScenario = scenario
  if (SCENARIOS[scenario]) {
    internalStatus = { ...SCENARIOS[scenario].status }
    internalUsage = { ...SCENARIOS[scenario].usage, period: getCurrentPeriod() }
  }
}

export function getMockScenario(): AiScenario {
  return getActiveScenario()
}

export async function mockGetCredentialStatus(): Promise<AiCredentialStatus> {
  await delay(SIMULATED_LATENCY_MS)
  const active = getActiveScenario()
  if (active !== 'default' && currentScenario !== active) {
    setMockScenario(active)
  }
  return { ...internalStatus }
}

export async function mockSaveCredential(
  payload: SaveCredentialPayload,
): Promise<AiCredentialStatus> {
  await delay(SIMULATED_LATENCY_MS)
  const key = payload.apiKey.trim()

  if (key.toLowerCase().includes('invalid') || key === 'AIzaSyInvalidKeyMock') {
    throw new ApiClientError(
      'The provided Google API key is invalid or lacks Gemini access.',
      400,
      'CREDENTIAL_INVALID',
    )
  }

  if (key.toLowerCase().includes('unavailable') || key === 'AIzaSyUnavailableKeyMock') {
    throw new ApiClientError(
      'Google Gemini API is currently unavailable. Please try again later.',
      503,
      'CREDENTIAL_UNAVAILABLE',
    )
  }

  if (!key || key.length < 8) {
    throw new ApiClientError(
      'API key is too short or invalid.',
      400,
      'CREDENTIAL_INVALID',
    )
  }

  const last4 = key.slice(-4)
  const now = new Date().toISOString()

  internalStatus = {
    provider: payload.provider ?? 'gemini',
    last4,
    status: 'valid',
    addedAt: internalStatus.addedAt || now,
    lastValidatedAt: now,
  }

  internalUsage = {
    ...internalUsage,
    period: getCurrentPeriod(),
    unlimited: true,
    unlimitedReason: 'byok',
    degraded: false,
  }

  currentScenario = 'healthy_byok'
  return { ...internalStatus }
}

export async function mockDeleteCredential(): Promise<void> {
  await delay(SIMULATED_LATENCY_MS)
  internalStatus = {
    provider: 'gemini',
    last4: null,
    status: 'none',
    addedAt: null,
    lastValidatedAt: null,
  }

  internalUsage = {
    ...internalUsage,
    period: getCurrentPeriod(),
    unlimited: false,
    unlimitedReason: undefined,
    degraded: false,
  }

  currentScenario = 'default'
}

export async function mockGetUsage(): Promise<AiUsage> {
  await delay(SIMULATED_LATENCY_MS)
  const active = getActiveScenario()
  if (active !== 'default' && currentScenario !== active) {
    setMockScenario(active)
  }
  return { ...internalUsage }
}
