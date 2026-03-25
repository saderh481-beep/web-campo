import axios, { type AxiosError, type AxiosResponse } from 'axios'

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
const legacyApiBaseUrl = resolvedApiUrl.replace(/\/api\/v1$/i, '')
const AUTH_TOKEN_KEY = 'campo_auth_token'
const AUTH_USER_KEY = 'campo_auth_user'
const LEGACY_FALLBACK_HEADER = 'x-campo-legacy-fallback'

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

function getStoredUser(): unknown {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setStoredUser(user: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

function clearStoredUser() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_USER_KEY)
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

function extractUser(data: unknown): Record<string, unknown> | null {
  if (!isRecord(data)) return null

  const candidates = [
    data.usuario,
    data.user,
    isRecord(data.data) ? data.data.usuario : null,
    isRecord(data.data) ? data.data.user : null,
  ]

  for (const candidate of candidates) {
    if (isRecord(candidate)) return candidate
  }

  const hasUserShape =
    (typeof data.id === 'number' || typeof data.id === 'string') &&
    typeof data.nombre === 'string'

  if (hasUserShape) return data
  return null
}

function saveAuthFromResponse(data: unknown) {
  const token = extractToken(data)
  if (token) setStoredToken(token)

  const user = extractUser(data)
  if (user) setStoredUser(user)
}

function normalizeRoleValue(role: unknown): string | undefined {
  if (typeof role !== 'string') return undefined
  const normalized = role.trim().toLowerCase()
  if (normalized === 'admin') return 'administrador'
  if (normalized === 'administrador' || normalized === 'coordinador' || normalized === 'tecnico') {
    return normalized
  }
  return role
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

function normalizeMonthlyParams(params?: { mes?: string; anio?: number }): { mes?: number | string; anio?: number } | undefined {
  if (!params) return undefined
  const maybeMonth = params.mes?.trim()
  if (!maybeMonth) return params

  const monthYearMatch = maybeMonth.match(/^(\d{4})-(\d{2})$/)
  if (!monthYearMatch) return params

  const [, year, month] = monthYearMatch
  const parsedMonth = Number(month)
  const parsedYear = Number(year)
  if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) return params

  return {
    ...params,
    mes: parsedMonth,
    anio: params.anio ?? parsedYear,
  }
}

function withBitacoraUpdateAliases(payload: unknown): unknown {
  if (!isRecord(payload)) return payload
  const notas = payload.notas
  const observaciones = payload.observaciones
  const actividadesRealizadas = payload.actividades_realizadas ?? payload.actividadesRealizadas
  return {
    ...payload,
    observaciones: typeof observaciones === 'string' ? observaciones : notas,
    actividades_realizadas: typeof actividadesRealizadas === 'string' ? actividadesRealizadas : undefined,
  }
}

function withBeneficiarioPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {}

  const payload: Record<string, unknown> = {
    nombre: data.nombre,
    municipio: data.municipio,
    tecnico_id: data.tecnico_id,
  }

  const optionalKeys = [
    'localidad_id',
    'localidad',
    'direccion',
    'cp',
    'telefono_principal',
    'telefono_secundario',
    'coord_parcela',
  ]

  for (const key of optionalKeys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      payload[key] = data[key]
    }
  }

  return payload
}

function withActividadPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {}
  return {
    nombre: data.nombre,
    descripcion: data.descripcion,
  }
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
  async (err) => {
    const cfg = err.config as (typeof err.config & { headers?: Record<string, unknown> }) | undefined
    const fallbackAttempted = Boolean(cfg?.headers?.[LEGACY_FALLBACK_HEADER])

    if (
      err.response?.status === 404 &&
      !fallbackAttempted &&
      legacyApiBaseUrl !== apiBaseUrl &&
      cfg
    ) {
      return api.request({
        ...cfg,
        baseURL: legacyApiBaseUrl,
        headers: {
          ...(cfg.headers ?? {}),
          [LEGACY_FALLBACK_HEADER]: '1',
        },
      })
    }

    const path = normalizePath(err.config?.url)
    const normalizedPath = path.replace(/^\/api\/v1(?=\/)/, '')
    const isAuthAttempt =
      normalizedPath === '/auth/login' ||
      normalizedPath === '/auth/request-codigo-acceso' ||
      normalizedPath === '/auth/verify-codigo-acceso' ||
      normalizedPath === '/auth/request-otp' ||
      normalizedPath === '/auth/verify-otp' ||
      normalizedPath === '/auth/me' ||
      normalizedPath === '/auth/logout' ||
      normalizedPath === '/usuarios/me'

    if (
      err.response?.status === 401 &&
      !isAuthAttempt &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      clearStoredToken()
      clearStoredUser()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────
export const authApi = {
  requestOTP: (correo: string) => with404Fallback([
    () => api.post('/auth/request-codigo-acceso', { correo }),
    () => api.post('/auth/request-otp', { correo, email: correo }),
  ]),
  login: async (correo: string, clave: string) => {
    const payload = {
      correo,
      email: correo,
      clave,
      codigo_acceso: clave,
      codigo: clave,
      code: clave,
      otp: clave,
      pin: clave,
    }

    const response = await withFallback([
      () => api.post('/auth/login', payload),
      () => api.post('/auth/verify-codigo-acceso', payload),
      () => api.post('/auth/verify-otp', payload),
    ], [404, 405])

    saveAuthFromResponse(response.data)
    return response
  },
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearStoredToken()
      clearStoredUser()
    }
  },
  me: () => {
    const cachedUser = getStoredUser()
    if (cachedUser) {
      return Promise.resolve({ data: { usuario: cachedUser } } as AxiosResponse<unknown>)
    }
    const token = getStoredToken()
    if (!token) {
      return Promise.resolve({ data: { usuario: null } } as AxiosResponse<unknown>)
    }
    return with404Fallback([
      () => api.get('/auth/me'),
      () => api.get('/usuarios/me'),
    ])
  },
}

function buildUsuarioPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {}
  const payload: Record<string, unknown> = {}
  const nombre = (data as Record<string, unknown>).nombre ?? (data as Record<string, unknown>).name
  const correo = (data as Record<string, unknown>).correo ?? (data as Record<string, unknown>).email
  const rol = normalizeRoleValue((data as Record<string, unknown>).rol ?? (data as Record<string, unknown>).role)

  if (nombre !== undefined && nombre !== null) {
    payload.nombre = nombre
  }
  if (correo !== undefined && correo !== null) {
    payload.correo = correo
  }
  if (rol !== undefined) {
    payload.rol = rol
  }

  const activo = (data as Record<string, unknown>).activo
  if (typeof activo === 'boolean') payload.activo = activo

  const optionalKeys = ['telefono', 'coordinador_id', 'fecha_limite', 'codigo_acceso']
  for (const key of optionalKeys) {
    const value = (data as Record<string, unknown>)[key]
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value
    }
  }

  return payload
}

function withUsuarioCreateAliases(payload: Record<string, unknown>): Record<string, unknown> {
  const correo = payload.correo
  const nombre = payload.nombre
  const rol = payload.rol
  const coordinadorId = payload.coordinador_id
  const fechaLimite = payload.fecha_limite

  return {
    ...payload,
    email: typeof payload.email === 'string' ? payload.email : correo,
    name: typeof payload.name === 'string' ? payload.name : nombre,
    role: typeof payload.role === 'string' ? payload.role : rol,
    coordinator_id: payload.coordinator_id ?? coordinadorId,
    coordinadorId: payload.coordinadorId ?? coordinadorId,
    fechaLimite: payload.fechaLimite ?? fechaLimite,
  }
}

async function createUsuarioWithFallback(data: unknown): Promise<AxiosResponse<unknown>> {
  const payload = buildUsuarioPayload(data)
  const aliasedPayload = withUsuarioCreateAliases(payload)

  return withFallback<unknown>([
    () => api.post('/usuarios', payload),
    () => api.post('/usuarios', aliasedPayload),
  ], [404, 405, 422])
}

async function updateUsuarioWithFallback(id: string | number, data: unknown): Promise<AxiosResponse<unknown>> {
  const payload = buildUsuarioPayload(data)
  const enrichedPayload = {
    ...payload,
    usuario_id: id,
    id_usuario: id,
    id,
    uuid: id,
  }

  return withFallback<unknown>([
    () => api.patch(`/usuarios/${id}`, payload),
    () => api.put(`/usuarios/${id}`, payload),
    () => api.patch(`/usuarios/${id}`, enrichedPayload),
    () => api.put(`/usuarios/${id}`, enrichedPayload),
    () => api.patch(`/usuarios/uuid/${id}`, payload),
    () => api.put(`/usuarios/uuid/${id}`, payload),
  ], [400, 404, 405])
}

// ── USUARIOS ──────────────────────────────────────────────────────
export const usuariosApi = {
  list: () => api.get('/usuarios'),
  create: (data: unknown) => createUsuarioWithFallback(data),
  update: (id: string | number, data: unknown) => updateUsuarioWithFallback(id, data),
  remove: (id: string | number) => api.delete(`/usuarios/${id}`),
}

// ── TÉCNICOS ──────────────────────────────────────────────────────
export const tecnicosApi = {
  list: () => api.get('/tecnicos'),
  get: (id: string | number) => api.get(`/tecnicos/${id}`),
  create: (data: unknown) => createUsuarioWithFallback({
    ...((isRecord(data) ? data : {}) as Record<string, unknown>),
    rol: 'tecnico',
  }),
  update: (id: string | number, data: unknown) => api.patch(`/tecnicos/${id}`, withNameAlias(withEmailAlias(data))),
  remove: (id: string | number) => api.delete(`/tecnicos/${id}`),
  generarCodigoAcceso: (id: string | number) => api.post(`/tecnicos/${id}/codigo`),
  aplicarCortes: () => api.post('/tecnicos/aplicar-cortes'),
  cerrarCorte: (id: string | number) => api.post(`/tecnicos/${id}/cerrar-corte`),
}

// ── CADENAS PRODUCTIVAS ───────────────────────────────────────────
export const cadenasApi = {
  list: () => api.get('/cadenas-productivas'),
  create: (data: unknown) => api.post('/cadenas-productivas', data),
  update: (id: string | number, data: unknown) => api.patch(`/cadenas-productivas/${id}`, data),
  remove: (id: string | number) => api.delete(`/cadenas-productivas/${id}`),
}

// ── BENEFICIARIOS ─────────────────────────────────────────────────
export const beneficiariosApi = {
  list: (params?: { page?: number; q?: string; tecnico_id?: string; cadena_id?: string }) =>
    api.get('/beneficiarios', { params }),
  get: (id: string | number) => api.get(`/beneficiarios/${id}`),
  create: (data: unknown) => api.post('/beneficiarios', withBeneficiarioPayload(data)),
  update: (id: string | number, data: unknown) => api.patch(`/beneficiarios/${id}`, withBeneficiarioPayload(data)),
  asignarCadenas: (id: string, cadenaIds: string[]) =>
    api.post(`/beneficiarios/${id}/cadenas`, { cadena_ids: cadenaIds }),
  subirDocumento: (id: string, formData: FormData) =>
    api.post(`/beneficiarios/${id}/documentos`, formData),
  getDocumentos: (id: string) => api.get(`/beneficiarios/${id}/documentos`),
}

// ── ACTIVIDADES ───────────────────────────────────────────────────
export const actividadesApi = {
  list: () => api.get('/actividades'),
  create: (data: unknown) => api.post('/actividades', withActividadPayload(data)),
  update: (id: string | number, data: unknown) => api.patch(`/actividades/${id}`, withActividadPayload(data)),
  remove: (id: string | number) => api.delete(`/actividades/${id}`),
}

// ── ASIGNACIONES ──────────────────────────────────────────────────
export const asignacionesApi = {
  asignarBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post('/asignaciones/beneficiario', data),
  quitarBeneficiario: (id: string | number) =>
    api.delete(`/asignaciones/beneficiario/${id}`),
  asignarActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post('/asignaciones/actividad', data),
  quitarActividad: (id: string | number) =>
    api.delete(`/asignaciones/actividad/${id}`),
}

// ── BITÁCORAS ─────────────────────────────────────────────────────
export const bitacorasApi = {
  list: (params?: { tecnico_id?: string; mes?: string; anio?: number; estado?: string; tipo?: string }) => {
    const normalized = params ? { ...normalizeMonthlyParams(params), estado: params.estado, tipo: params.tipo, tecnico_id: params.tecnico_id } : params
    return api.get('/bitacoras', { params: normalized })
  },
  get: (id: string | number) => api.get(`/bitacoras/${id}`),
  update: (id: string | number, data: unknown) => api.patch(`/bitacoras/${id}`, withBitacoraUpdateAliases(data)),
  pdfUrl: (id: string | number) => `${apiBaseUrl}/bitacoras/${id}/pdf`,
  pdfDownloadUrl: (id: string | number) => `${apiBaseUrl}/bitacoras/${id}/pdf/descargar`,
  imprimirPdf: (id: string | number) => api.post(`/bitacoras/${id}/pdf/imprimir`),
  versiones: (id: string | number) => api.get(`/bitacoras/${id}/versiones`),
}

// ── REPORTES ──────────────────────────────────────────────────────
export const reportesApi = {
  mensual: (params?: { mes?: string; anio?: number }) =>
    api.get('/reportes/mensual', { params: normalizeMonthlyParams(params) }),
  tecnico: (id: string | number, params?: { desde?: string; hasta?: string }) =>
    api.get(`/reportes/tecnico/${id}`, { params }),
}

// ── ARCHIVE ───────────────────────────────────────────────────────
export const archiveApi = {
  list: () => api.get('/archive'),
  descargar: (periodo: string) => api.get(`/archive/${periodo}/descargar`),
  confirmar: (periodo: string) => api.post(`/archive/${periodo}/confirmar`, { confirmar: true }),
  forzar: (periodo: string) => api.post(`/archive/${periodo}/forzar`),
}

// ── LOCALIDADES ──────────────────────────────────────────────────
export const localidadesApi = {
  list: () => api.get('/localidades'),
  create: (data: unknown) => api.post('/localidades', data),
  update: (id: string | number, data: unknown) => api.patch(`/localidades/${id}`, data),
  remove: (id: string | number) => api.delete(`/localidades/${id}`),
}

// ── CONFIGURACIONES ──────────────────────────────────────────────
export const configuracionesApi = {
  list: () => api.get('/configuraciones'),
  get: (clave: string) => api.get(`/configuraciones/${clave}`),
  update: (clave: string, valor: unknown) => api.put(`/configuraciones/${clave}`, { valor }),
}

// ── DOCUMENTOS PLANTILLA ─────────────────────────────────────────
export const documentosPlantillaApi = {
  activos: () => api.get('/documentos-plantilla/activos'),
  list: () => api.get('/documentos-plantilla'),
  create: (data: unknown) => api.post('/documentos-plantilla', data),
  update: (id: string | number, data: unknown) => api.patch(`/documentos-plantilla/${id}`, data),
  remove: (id: string | number) => api.delete(`/documentos-plantilla/${id}`),
}

// ── NOTIFICACIONES ────────────────────────────────────────────────
export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leer`),
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
}
