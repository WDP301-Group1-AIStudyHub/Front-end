import type { AuthUser } from '../types/auth'

const TOKEN_KEY = 'ai-study-hub:access-token'
const USER_KEY = 'ai-study-hub:user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem(USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function storeAuthSession(accessToken: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function hasAuthSession(): boolean {
  return Boolean(getStoredToken())
}
