import { apiClient, unwrapApiData } from '@/services/apiClient'
import type {
  AiCredentialStatus,
  AiScenario,
  AiUsage,
  SaveCredentialPayload,
} from '@/types/ai'

// Mocking is opt-in. It used to default on in dev, which meant every developer
// without `VITE_USE_MOCK_AI=false` in their untracked `.env` was exercising the
// mock rather than the real BYOK endpoints — and could not tell from the UI.
// Set `VITE_USE_MOCK_AI=true` to work on states the backend is awkward to force,
// such as a rejected key.
const USE_MOCK = import.meta.env.VITE_USE_MOCK_AI === 'true'

// Loaded on demand so the mock is code-split out of the main bundle and never
// evaluated in a build that does not use it.
const loadMock = () => import('@/services/aiCredentialApi.mock')

export async function getCredentialStatus(): Promise<AiCredentialStatus> {
  if (USE_MOCK) {
    return (await loadMock()).mockGetCredentialStatus()
  }

  const response = await apiClient.get('/api/ai/credential')
  return unwrapApiData<AiCredentialStatus>(
    response.data,
    'Failed to retrieve credential status',
  )
}

export async function saveCredential(
  payload: SaveCredentialPayload,
): Promise<AiCredentialStatus> {
  if (USE_MOCK) {
    return (await loadMock()).mockSaveCredential(payload)
  }

  const response = await apiClient.post('/api/ai/credential', payload)
  return unwrapApiData<AiCredentialStatus>(
    response.data,
    'Failed to save credential',
  )
}

export async function deleteCredential(): Promise<void> {
  if (USE_MOCK) {
    return (await loadMock()).mockDeleteCredential()
  }

  await apiClient.delete('/api/ai/credential')
}

export async function getUsage(): Promise<AiUsage> {
  if (USE_MOCK) {
    return (await loadMock()).mockGetUsage()
  }

  const response = await apiClient.get('/api/ai/usage')
  return unwrapApiData<AiUsage>(response.data, 'Failed to retrieve usage info')
}

// Dev-only scenario control seam. Async because the mock is code-split.
export async function setDevMockScenario(scenario: AiScenario): Promise<void> {
  if (!USE_MOCK) return
  ;(await loadMock()).setMockScenario(scenario)
}

export async function getDevMockScenario(): Promise<AiScenario> {
  if (!USE_MOCK) return 'default'
  return (await loadMock()).getMockScenario()
}

export const isMockAiActive = USE_MOCK
