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
const AUTH_TOKEN_KEY = 'campo_auth_token'
const AUTH_USER_KEY = 'campo_auth_user'

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

function setStoredUser(user: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

function clearStoredUser() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_USER_KEY)
}

export function clearAuthStorage() {
  clearStoredToken()
  clearStoredUser()
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

  const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : data.nombre
  const municipio = typeof data.municipio === 'string' ? data.municipio.trim() : data.municipio
  const tecnicoId = typeof data.tecnico_id === 'string' ? data.tecnico_id.trim() : data.tecnico_id
  const localidadId = typeof data.localidad_id === 'string' ? data.localidad_id.trim() : data.localidad_id
  const localidad = typeof data.localidad === 'string' ? data.localidad.trim() : data.localidad

  const payload: Record<string, unknown> = {
    nombre,
    municipio,
    tecnico_id: tecnicoId,
  }

  if (localidadId) {
    payload.localidad_id = localidadId
  } else if (localidad) {
    payload.localidad = localidad
  }

  const optionalKeys = [
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

function withBeneficiarioMinimalPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {}

  const payload: Record<string, unknown> = {
    nombre: typeof data.nombre === 'string' ? data.nombre.trim() : data.nombre,
    municipio: typeof data.municipio === 'string' ? data.municipio.trim() : data.municipio,
    tecnico_id: typeof data.tecnico_id === 'string' ? data.tecnico_id.trim() : data.tecnico_id,
  }

  const localidadId = typeof data.localidad_id === 'string' ? data.localidad_id.trim() : data.localidad_id
  if (localidadId) payload.localidad_id = localidadId

  return payload
}

function withActividadPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {}
  return {
    nombre: data.nombre,
    descripcion: data.descripcion,
  }
}

function shouldRetryWithAlias(error: unknown, primaryPath: string): boolean {
  const axiosErr = error as AxiosError
  const status = axiosErr.response?.status
  const path = normalizePath(axiosErr.config?.url)
  return (status === 404 || status === 405) && path.includes(primaryPath)
}

async function requestWithPathFallback<T>(
  primaryPath: string,
  secondaryPath: string,
  request: (path: string) => Promise<AxiosResponse<T>>,
): Promise<AxiosResponse<T>> {
  try {
    return await request(primaryPath)
  } catch (error) {
    if (!shouldRetryWithAlias(error, primaryPath)) throw error
    return request(secondaryPath)
  }
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
      clearAuthStorage()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────
export const authApi = {
  requestOTP: (correo: string) => api.post('/auth/request-codigo-acceso', { correo }),
  login: async (correo: string, clave: string) => {
    const payload = {
      correo,
      codigo_acceso: clave,
    }

    const response = await api.post('/auth/login', payload)

    saveAuthFromResponse(response.data)
    return response
  },
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuthStorage()
    }
  },
  me: async () => {
    const token = getStoredToken()
    if (!token) {
      clearAuthStorage()
      return { data: { usuario: null } } as AxiosResponse<unknown>
    }

    try {
      const response = await requestWithPathFallback(
        '/auth/me',
        '/usuarios/me',
        (path) => api.get(path),
      )
      saveAuthFromResponse(response.data)
      return response
    } catch (error) {
      clearAuthStorage()
      throw error
    }
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

async function createUsuarioWithFallback(data: unknown): Promise<AxiosResponse<unknown>> {
  const payload = buildUsuarioPayload(data)
  try {
    return await api.post('/usuarios', payload)
  } catch (error) {
    // Si falla, intentar con alias de campos
    const aliasPayload = {
      ...payload,
      correo: payload.correo || payload.email,
      nombre: payload.nombre || payload.name,
      rol: payload.rol || payload.role,
    }
    return api.post('/usuarios', aliasPayload)
  }
}

async function updateUsuarioWithFallback(id: string | number, data: unknown): Promise<AxiosResponse<unknown>> {
  const payload = buildUsuarioPayload(data)
  return api.patch(`/usuarios/${id}`, payload)
}

async function createBeneficiarioWithFallback(data: unknown): Promise<AxiosResponse<unknown>> {
  const minimalPayload = withBeneficiarioMinimalPayload(data)
  const fullPayload = withBeneficiarioPayload(data)
  const response = await api.post('/beneficiarios', minimalPayload)

  const createdRecord = response.data as Record<string, unknown> | undefined
  const createdId = createdRecord?.id ?? (isRecord(createdRecord?.beneficiario) ? createdRecord.beneficiario.id : undefined)

  const hasExtendedFields = Object.keys(fullPayload).some((key) => !(key in minimalPayload))
  if (!createdId || !hasExtendedFields) return response

  try {
    await api.patch(`/beneficiarios/${createdId}`, fullPayload)
  } catch {
    // Keep create successful even if the backend rejects optional extended fields.
  }

  return response
}

// ── USUARIOS ──────────────────────────────────────────────────────
export const usuariosApi = {
  list: () => api.get('/usuarios'),
  create: (data: unknown) => createUsuarioWithFallback(data),
  update: (id: string | number, data: unknown) => updateUsuarioWithFallback(id, data),
  remove: (id: string | number) => api.delete(`/usuarios/${id}`),
  hardRemove: (id: string | number) => api.delete(`/usuarios/${id}`, { params: { permanent: true, force: true, hard: true } }),
}

// ── TÉCNICOS ──────────────────────────────────────────────────────
export const tecnicosApi = {
  list: () => api.get('/tecnicos'),
  get: (id: string | number) => api.get(`/tecnicos/${id}`),
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
  create: (data: unknown) => createBeneficiarioWithFallback(data),
  update: (id: string | number, data: unknown) => api.patch(`/beneficiarios/${id}`, withBeneficiarioPayload(data)),
  remove: (id: string | number) => api.delete(`/beneficiarios/${id}`),
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
  obtenerCoordinadorTecnico: (tecnico_id: string) =>
    api.get('/asignaciones/coordinador-tecnico', { params: { tecnico_id } }),
  listarCoordinadorTecnico: (tecnico_id?: string) =>
    requestWithPathFallback(
      '/asignaciones/coordinador-tecnico/lista',
      '/asignaciones/coordinador-tecnico',
      (path) => api.get(path, { params: tecnico_id ? { tecnico_id } : undefined }),
    ),
  obtenerCoordinadorTecnicoPorPath: (tecnico_id: string) =>
    api.get(`/asignaciones/coordinador-tecnico/${tecnico_id}`),
  asignarCoordinadorTecnico: (data: { tecnico_id: string; coordinador_id: string; fecha_limite: string }) =>
    api.post('/asignaciones/coordinador-tecnico', data),
  actualizarCoordinadorTecnico: (tecnico_id: string, data: { coordinador_id?: string; fecha_limite?: string; activo?: boolean }) =>
    api.patch(`/asignaciones/coordinador-tecnico/${tecnico_id}`, data),
  quitarCoordinadorTecnico: (tecnico_id: string) =>
    api.delete(`/asignaciones/coordinador-tecnico/${tecnico_id}`),
  listarBeneficiario: (params?: { tecnico_id?: string; beneficiario_id?: string; activo?: boolean }) =>
    api.get('/asignaciones/beneficiario', { params }),
  obtenerBeneficiario: (id: string | number) =>
    api.get(`/asignaciones/beneficiario/${id}`),
  asignarBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post('/asignaciones/beneficiario', data),
  actualizarBeneficiario: (id: string | number, data: { tecnico_id?: string; beneficiario_id?: string; activo?: boolean }) =>
    api.patch(`/asignaciones/beneficiario/${id}`, data),
  quitarBeneficiario: (id: string | number) =>
    api.delete(`/asignaciones/beneficiario/${id}`),
  listarActividad: (params?: { tecnico_id?: string; actividad_id?: string; activo?: boolean }) =>
    api.get('/asignaciones/actividad', { params }),
  obtenerActividad: (id: string | number) =>
    api.get(`/asignaciones/actividad/${id}`),
  asignarActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post('/asignaciones/actividad', data),
  actualizarActividad: (id: string | number, data: { tecnico_id?: string; actividad_id?: string; activo?: boolean }) =>
    api.patch(`/asignaciones/actividad/${id}`, data),
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
  updatePdfConfig: (id: string | number, pdf_edicion: unknown) => api.patch(`/bitacoras/${id}/pdf-config`, { pdf_edicion }),
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

// ── DASHBOARD ─────────────────────────────────────────────────────
export const dashboardApi = {
  coordinador: () => api.get('/dashboard/coordinador'),
}

// ── ARCHIVE ───────────────────────────────────────────────────────
export const archiveApi = {
  list: () => api.get('/archive'),
  descargar: (periodo: string) => api.get(`/archive/${periodo}/descargar`, { responseType: 'blob' }),
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

// ── ZONAS ─────────────────────────────────────────────────────────
export const zonasApi = {
  list: () => api.get('/zonas'),
  create: (data: unknown) => api.post('/zonas', data),
  update: (id: string | number, data: unknown) => api.patch(`/zonas/${id}`, data),
  remove: (id: string | number) => api.delete(`/zonas/${id}`),
}

// ── CONFIGURACIONES ──────────────────────────────────────────────
export const configuracionesApi = {
  list: () => api.get('/configuraciones'),
  get: (clave: string) => api.get(`/configuraciones/${clave}`),
  update: (clave: string, valor: unknown) => api.put(`/configuraciones/${clave}`, { valor }),
}

// ── DOCUMENTOS PLANTILLA ─────────────────────────────────────────
export const documentosPlantillaApi = {
  activos: () =>
    requestWithPathFallback(
      '/documentos-plantilla/activos',
      '/documentos_plantilla/activos',
      (path) => api.get(path),
    ),
  list: () =>
    requestWithPathFallback(
      '/documentos-plantilla',
      '/documentos_plantilla',
      (path) => api.get(path),
    ),
  create: (data: unknown) =>
    requestWithPathFallback(
      '/documentos-plantilla',
      '/documentos_plantilla',
      (path) => api.post(path, data),
    ),
  update: (id: string | number, data: unknown) =>
    requestWithPathFallback(
      `/documentos-plantilla/${id}`,
      `/documentos_plantilla/${id}`,
      (path) => api.patch(path, data),
    ),
  remove: (id: string | number) =>
    requestWithPathFallback(
      `/documentos-plantilla/${id}`,
      `/documentos_plantilla/${id}`,
      (path) => api.delete(path),
    ),
}

// ── DOCUMENTOS PDF ────────────────────────────────────────────────
export const documentosPdfApi = {
  list: () => api.get('/documentos-pdf'),
  create: (formData: FormData) => api.post('/documentos-pdf', formData),
  update: (id: string | number, data: unknown) => api.patch(`/documentos-pdf/${id}`, data),
  remove: (id: string | number) => api.delete(`/documentos-pdf/${id}`),
}

// ── NOTIFICACIONES ────────────────────────────────────────────────
export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leer`),
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
}
