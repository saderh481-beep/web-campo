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

const SESSION_ID_KEY = 'campo_session_id'

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  const urlParams = new URLSearchParams(window.location.search)
  const urlSessionId = urlParams.get('sessionId')
  
  if (urlSessionId) {
    window.sessionStorage.setItem(SESSION_ID_KEY, urlSessionId)
    return urlSessionId
  }
  
  let sessionId = window.sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  
  return sessionId
}

export function getAuthKeys(sessionId?: string): { tokenKey: string; userKey: string; csrfKey: string } {
  const sid = sessionId || getSessionId()
  return {
    tokenKey: `campo_auth_token_${sid}`,
    userKey: `campo_auth_user_${sid}`,
    csrfKey: `campo_csrf_token_${sid}`,
  }
}

export function clearCurrentSession() {
  const sid = getSessionId()
  const { tokenKey, userKey, csrfKey } = getAuthKeys(sid)
  window.sessionStorage.removeItem(tokenKey)
  window.sessionStorage.removeItem(userKey)
  window.sessionStorage.removeItem(csrfKey)
}

export function redirectToSharedSession() {
  const currentUrl = new URL(window.location.href)
  const sessionId = getSessionId()
  
  if (!currentUrl.searchParams.has('sessionId')) {
    currentUrl.searchParams.set('sessionId', sessionId)
    window.history.replaceState({}, '', currentUrl.toString())
  }
}

export function getSharedUrl(): string {
  const sessionId = getSessionId()
  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set('sessionId', sessionId)
  return url.toString()
}

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
  const { tokenKey } = getAuthKeys()
  return window.sessionStorage.getItem(tokenKey)
}

export function getStoredToken(): string | null {
  return getStoredTokenFromStorage()
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return
  const { tokenKey } = getAuthKeys()
  window.sessionStorage.setItem(tokenKey, token)
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return
  const { tokenKey } = getAuthKeys()
  window.sessionStorage.removeItem(tokenKey)
}

export function setStoredUser(user: unknown) {
  if (typeof window === 'undefined') return
  const { userKey } = getAuthKeys()
  window.sessionStorage.setItem(userKey, JSON.stringify(user))
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return
  const { userKey } = getAuthKeys()
  window.sessionStorage.removeItem(userKey)
}

export function clearAuthStorage() {
  const sid = getSessionId()
  const { tokenKey, userKey, csrfKey } = getAuthKeys(sid)
  window.sessionStorage.removeItem(tokenKey)
  window.sessionStorage.removeItem(userKey)
  window.sessionStorage.removeItem(csrfKey)
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


export function clearCsrfToken() {
  if (typeof window === 'undefined') return
  const { csrfKey } = getAuthKeys()
  window.sessionStorage.removeItem(csrfKey)
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
  timeout: 8000,
  xsrfCookieName: 'campo_csrf',
  xsrfHeaderName: 'X-CSRF-Token',
})

api.interceptors.request.use((config) => {
  const sid = getSessionId()
  const { tokenKey, csrfKey } = getAuthKeys(sid)
  
  const token = window.sessionStorage.getItem(tokenKey)
  const csrfToken = window.sessionStorage.getItem(csrfKey)
  
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
      '/auth/me'
    ].includes(normalizedPath)

    if (
      err.response?.status === 401 &&
      !isAuthAttempt &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      clearCurrentSession()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

export const apiUrl = apiBaseUrl
