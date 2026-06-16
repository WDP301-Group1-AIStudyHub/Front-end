import {
  clearAuthSession,
  getStoredToken,
  storeAuthSession,
} from './authStorage'
import type {
  ApiResponse,
  AuthResponse,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from '../types/auth'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  ''

export class AuthApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

type RequestOptions = {
  authenticated?: boolean
  body?: unknown
  method?: 'GET' | 'POST' | 'PUT'
}

async function request<T>(
  path: string,
  { authenticated = false, body, method = 'GET' }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers()

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const token = getStoredToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method,
  })
  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unexpected server response',
  }))) as ApiResponse<T>

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    throw new AuthApiError(payload.message || 'Request failed', response.status)
  }

  return payload
}

function persistAuthResponse(payload: ApiResponse<AuthResponse>): AuthResponse {
  if (!payload.data) {
    throw new AuthApiError('Authentication response did not include session data', 500)
  }

  storeAuthSession(payload.data.accessToken, payload.data.user)
  return payload.data
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/auth/login', {
    body: payload,
    method: 'POST',
  })

  return persistAuthResponse(response)
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/auth/register', {
    body: payload,
    method: 'POST',
  })

  return persistAuthResponse(response)
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/api/auth/logout', {
      authenticated: true,
      method: 'POST',
    })
  } finally {
    clearAuthSession()
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await request<AuthUser>('/api/auth/me', {
    authenticated: true,
  })

  if (!response.data) {
    throw new AuthApiError('Current user response was empty', 500)
  }

  return response.data
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const response = await request<AuthUser>('/api/auth/profile', {
    authenticated: true,
    body: payload,
    method: 'PUT',
  })

  if (!response.data) {
    throw new AuthApiError('Updated profile response was empty', 500)
  }

  return response.data
}

export async function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<ApiResponse<{ email: string }>> {
  return request<{ email: string }>('/api/auth/forgot-password', {
    body: payload,
    method: 'POST',
  })
}
