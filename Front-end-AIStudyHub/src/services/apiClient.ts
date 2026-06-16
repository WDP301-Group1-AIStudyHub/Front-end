import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { clearAuthSession, getStoredToken } from './authStorage'

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, '')

export class ApiClientError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status = error.response?.status ?? 0

    if (status === 401) {
      clearAuthSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed'

    throw new ApiClientError(message, status)
  },
)

export function unwrapApiData<T>(payload: unknown, fallbackMessage: string): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = payload as { data?: T }

    if (nested.data !== undefined) {
      return nested.data
    }
  }

  if (payload !== undefined) {
    return payload as T
  }

  throw new ApiClientError(fallbackMessage, 500)
}
