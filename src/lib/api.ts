import axios, { type AxiosError, type AxiosResponse } from 'axios'

const DEFAULT_PROD_API_URL = 'https://campo-api-web-campo-saas.up.railway.app'

function resolveApiBaseUrl(): string {
  const rawApiUrl = import.meta.env.VITE_API_URL?.trim()
  if (rawApiUrl && rawApiUrl.length > 0) return rawApiUrl

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isLocalDev = host === 'localhost' || host === '127.0.0.1'
    if (isLocalDev) return '/api'
  }

  return DEFAULT_PROD_API_URL
}

const apiBaseUrl = resolveApiBaseUrl().replace(/\/+$/, '')
const AUTH_TOKEN_KEY = 'campo_auth_token'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function setStoredToken(token: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

function clearStoredToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

function extractToken(data: unknown): string | null {
  if (!isRecord(data)) return null

  const candidates = [
    data.token,
    data.access_token,
    data.accessToken,
    data.jwt,
    isRecord(data.data) ? data.data.token : null,
    isRecord(data.data) ? data.data.access_token : null,
    isRecord(data.data) ? data.data.accessToken : null,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }
  return null
}

function saveTokenFromResponse(data: unknown) {
  const token = extractToken(data)
  if (token) setStoredToken(token)
}

function withEmailAlias(payload: unknown): unknown {
  if (!isRecord(payload)) return payload
  const correo = payload.correo
  const email = payload.email
  return {
    ...payload,
    correo: typeof correo === 'string' ? correo : email,
    email: typeof email === 'string' ? email : correo,
  }
}

function withRoleAlias(payload: unknown): unknown {
  if (!isRecord(payload)) return payload
  const rol = payload.rol
  const role = payload.role
  return {
    ...payload,
    rol: typeof rol === 'string' ? rol : role,
    role: typeof role === 'string' ? role : rol,
  }
}

function withNameAlias(payload: unknown): unknown {
  if (!isRecord(payload)) return payload
  const nombre = payload.nombre
  const name = payload.name
  return {
    ...payload,
    nombre: typeof nombre === 'string' ? nombre : name,
    name: typeof name === 'string' ? name : nombre,
  }
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


async function with404Fallback<T>(requests: Array<() => Promise<AxiosResponse<T>>>): Promise<AxiosResponse<T>> {
  return withFallback(requests, [404])
}

async function withFallback<T>(
  requests: Array<() => Promise<AxiosResponse<T>>>,
  fallbackStatuses: number[]
): Promise<AxiosResponse<T>> {
  let lastError: unknown
  for (const request of requests) {
    try {
      return await request()
    } catch (error) {
      const status = (error as AxiosError)?.response?.status
      if (!status || !fallbackStatuses.includes(status)) throw error
      lastError = error
    }
  }
  throw lastError
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = normalizePath(err.config?.url)
    const isAuthAttempt =
      path === '/auth/login' ||
      path === '/auth/otp' ||
      path === '/auth/request-otp' ||
      path === '/auth/verify-otp' ||
      path === '/auth/tecnico'
    if (
      err.response?.status === 401 &&
      !isAuthAttempt &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      clearStoredToken()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────
export const authApi = {
  requestOTP: (correo: string) => with404Fallback([
    () => api.post('/auth/request-otp', { correo, email: correo }),
    () => api.post('/auth/otp', { correo, email: correo }),
    () => api.post('/auth/tecnico', { correo, email: correo }),
  ]),
  login: async (correo: string, clave: string) => {
    const payload = {
      correo,
      email: correo,
      clave,
      codigo: clave,
      code: clave,
      otp: clave,
      pin: clave,
    }
    const response = await withFallback([
      () => api.post('/auth/tecnico', payload),
      () => api.post('/auth/verify-otp', payload),
      () => api.post('/auth/login', payload),
    ], [404, 405])
    saveTokenFromResponse(response.data)
    return response
  },
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearStoredToken()
    }
  },
  me: () => with404Fallback([
    () => api.get('/usuarios/me'),
    () => api.get('/usuarios/perfil'),
    () => api.get('/auth/me'),
    () => api.get('/me'),
  ]),
  enviarCodigoTecnico: (email: string) => api.post('/auth/tecnico', { email }),
}

// ── USUARIOS ──────────────────────────────────────────────────────
export const usuariosApi = {
  list: () => api.get('/usuarios'),
  create: (data: unknown) => api.post('/usuarios', withRoleAlias(withNameAlias(withEmailAlias(data)))),
  update: (id: number, data: unknown) => api.patch(`/usuarios/${id}`, withRoleAlias(withNameAlias(withEmailAlias(data)))),
  remove: (id: number) => withFallback([
    () => api.delete(`/usuarios/${id}`),
    () => api.patch(`/usuarios/${id}/desactivar`),
    () => api.post(`/usuarios/${id}/desactivar`),
  ], [404, 405]),
  perfil: () => api.get('/usuarios/perfil'),
  actualizarPerfil: (data: unknown) => api.patch('/usuarios/perfil', data),
}

// ── TÉCNICOS ──────────────────────────────────────────────────────
export const tecnicosApi = {
  list: () => api.get('/tecnicos'),
  getById: (id: string) => api.get(`/tecnicos/${id}`),
  create: (data: unknown) => api.post('/tecnicos', withNameAlias(withEmailAlias(data))),
  update: (id: number, data: unknown) => api.patch(`/tecnicos/${id}`, withNameAlias(withEmailAlias(data))),
  regenerarCodigo: (id: number) => api.post(`/tecnicos/${id}/regenerar-codigo`),
  generarCodigoAcceso: (id: number) => api.post(`/tecnicos/${id}/codigo`),
  remove: (id: number) => withFallback([
    () => api.delete(`/tecnicos/${id}`),
    () => api.patch(`/tecnicos/${id}/desactivar`),
    () => api.post(`/tecnicos/${id}/desactivar`),
  ], [404, 405]),
}

// ── CADENAS PRODUCTIVAS ───────────────────────────────────────────
export const cadenasApi = {
  list: () => api.get('/cadenas-productivas'),
  create: (data: unknown) => api.post('/cadenas-productivas', data),
  update: (id: number, data: unknown) => api.patch(`/cadenas-productivas/${id}`, data),
  remove: (id: number) => api.delete(`/cadenas-productivas/${id}`),
}

// ── ACTIVIDADES ───────────────────────────────────────────────────
export const actividadesApi = {
  list: () => with404Fallback([
    () => api.get('/actividades'),
    () => api.get('/mis-actividades'),
    () => api.get('/datos/mis-actividades'),
  ]),
  create: (data: unknown) => api.post('/actividades', data),
  update: (id: number, data: unknown) => api.patch(`/actividades/${id}`, data),
  remove: (id: number) => api.delete(`/actividades/${id}`),
}

// ── ASIGNACIONES ──────────────────────────────────────────────────────
export const asignacionesApi = {
  asignarBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post('/asignaciones/beneficiario', data),
  desasignarBeneficiario: (id: string) => api.delete(`/asignaciones/beneficiario/${id}`),
  asignarActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post('/asignaciones/actividad', data),
  desasignarActividad: (id: string) => api.delete(`/asignaciones/actividad/${id}`),
}

// ── BENEFICIARIOS ─────────────────────────────────────────────────
export const beneficiariosApi = {
  list: (params?: { page?: number; q?: string; cadena?: number }) => {
    const normalizedParams = params ? {
      ...params,
      query: params.q,
      search: params.q,
      cadena_id: params.cadena,
    } : params
    return with404Fallback([
      () => api.get('/beneficiarios', { params: normalizedParams }),
      () => api.get('/mis-beneficiarios', { params: normalizedParams }),
      () => api.get('/datos/mis-beneficiarios', { params: normalizedParams }),
    ])
  },
  getById: (id: string) => api.get(`/beneficiarios/${id}`),
  create: (data: unknown) => api.post('/beneficiarios', withNameAlias(data)),
  update: (id: number, data: unknown) => api.patch(`/beneficiarios/${id}`, withNameAlias(data)),
  asignarCadenas: (id: string, cadenaIds: string[]) => 
    api.post(`/beneficiarios/${id}/cadenas`, { cadena_ids: cadenaIds, cadenas_ids: cadenaIds }),
  subirDocumento: (id: string, formData: FormData) => 
    api.post(`/beneficiarios/${id}/documentos`, formData),
  getDocumentos: (id: string) => api.get(`/beneficiarios/${id}/documentos`),
}

// ── BITÁCORAS ─────────────────────────────────────────────────────
export const bitacorasApi = {
  list: (params?: { mes?: string; estado?: string; tipo?: string }) =>
    api.get('/bitacoras', { params }),
  get: (id: number) => api.get(`/bitacoras/${id}`),
  update: (id: number, data: unknown) => api.patch(`/bitacoras/${id}`, data),
  pdfUrl: (id: number) => `/api/bitacoras/${id}/pdf`,
  pdfDownloadUrl: (id: number) => `/api/bitacoras/${id}/pdf/descargar`,
}

// ── REPORTES ──────────────────────────────────────────────────────
export const reportesApi = {
  mensual: (params?: { mes?: string; anio?: number }) => with404Fallback([
    () => api.get('/reportes/mensual', { params }),
    () => api.get('/bitacoras/mensual', { params }),
    () => api.get('/bitacoras-mensual', { params }),
  ]),
}

// ── NOTIFICACIONES ────────────────────────────────────────────────
export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leer`),
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
}
