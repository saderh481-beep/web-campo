import axios, { type AxiosError } from 'axios'

const DEFAULT_API_URL = 'https://campo-api-web-campo-saas.up.railway.app'
const API_VERSION_PREFIX = '/api/v1'

function resolveApiBaseUrl(): string {
  const rawApiUrl = import.meta.env.VITE_API_URL?.trim()
  if (rawApiUrl && rawApiUrl.length > 0) return rawApiUrl
  return DEFAULT_API_URL
}

const resolvedApiUrl = resolveApiBaseUrl().replace(/\/+$/, '')
const apiBaseUrl = /\/api\/v1$/i.test(resolvedApiUrl)
  ? resolvedApiUrl
  : `${resolvedApiUrl}${API_VERSION_PREFIX}`

export const AUTH_TOKEN_KEY = 'campo_auth_token'
export const AUTH_USER_KEY = 'campo_auth_user'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string; error?: string }>
  const payload = axiosErr.response?.data
  if (isRecord(payload)) {
    const error = payload.error
    if (typeof error === 'string' && error.trim().length > 0) return error
    const message = payload.message
    if (typeof message === 'string' && message.trim().length > 0) return message
  }
  return fallback
}

function getStoredTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredToken(): string | null {
  return getStoredTokenFromStorage()
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function setStoredUser(user: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_USER_KEY)
}

export function clearAuthStorage() {
  clearStoredToken()
  clearStoredUser()
}

export function extractToken(data: unknown): string | null {
  if (!isRecord(data)) return null
  const token = data.token
  if (typeof token === 'string' && token.trim().length > 0) return token
  return null
}

export function extractUser(data: unknown): Record<string, unknown> | null {
  if (!isRecord(data)) return null
  const usuario = data.usuario
  if (isRecord(usuario)) return usuario
  return null
}

export function saveAuthFromResponse(data: unknown) {
  const token = extractToken(data)
  if (token) setStoredToken(token)
  const user = extractUser(data)
  if (user) setStoredUser(user)
}

const CSRF_TOKEN_KEY = 'campo_csrf_token'

function getStoredCsrfToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CSRF_TOKEN_KEY)
}

export function clearCsrfToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CSRF_TOKEN_KEY)
}

function normalizePath(url?: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).pathname
    } catch {
      return ''
    }
  }
  return url.startsWith('/') ? url : `/${url}`
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
  xsrfCookieName: 'campo_csrf',
  xsrfHeaderName: 'X-CSRF-Token',
})

api.interceptors.request.use((config) => {
  const token = getStoredTokenFromStorage()
  const csrfToken = getStoredCsrfToken()
  
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    config.headers = config.headers ?? {}
    config.headers['X-CSRF-Token'] = csrfToken
  }
  
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = normalizePath(err.config?.url)
    const normalizedPath = path.replace(/^\/api\/v1(?=\/)/, '')
    const isAuthAttempt = [
      '/auth/login',
      '/auth/verify-codigo-acceso',
      '/auth/logout',
      '/usuarios/me'
    ].includes(normalizedPath)

    if (
      err.response?.status === 401 &&
      !isAuthAttempt &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      clearAuthStorage()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

export const apiUrl = apiBaseUrl
