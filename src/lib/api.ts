import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────
export const authApi = {
  requestOTP: (correo: string) => api.post('/auth/otp', { correo }),
  login: (correo: string, otp: string) => api.post('/auth/login', { correo, otp }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ── USUARIOS ──────────────────────────────────────────────────────
export const usuariosApi = {
  list: () => api.get('/usuarios'),
  create: (data: unknown) => api.post('/usuarios', data),
  update: (id: number, data: unknown) => api.patch(`/usuarios/${id}`, data),
  remove: (id: number) => api.delete(`/usuarios/${id}`),
}

// ── TÉCNICOS ──────────────────────────────────────────────────────
export const tecnicosApi = {
  list: () => api.get('/tecnicos'),
  create: (data: unknown) => api.post('/tecnicos', data),
  update: (id: number, data: unknown) => api.patch(`/tecnicos/${id}`, data),
  regenerarCodigo: (id: number) => api.post(`/tecnicos/${id}/regenerar-codigo`),
  remove: (id: number) => api.delete(`/tecnicos/${id}`),
}

// ── CADENAS PRODUCTIVAS ───────────────────────────────────────────
export const cadenasApi = {
  list: () => api.get('/cadenas-productivas'),
  create: (data: unknown) => api.post('/cadenas-productivas', data),
  update: (id: number, data: unknown) => api.patch(`/cadenas-productivas/${id}`, data),
}

// ── ACTIVIDADES ───────────────────────────────────────────────────
export const actividadesApi = {
  list: () => api.get('/actividades'),
  create: (data: unknown) => api.post('/actividades', data),
  update: (id: number, data: unknown) => api.patch(`/actividades/${id}`, data),
}

// ── BENEFICIARIOS ─────────────────────────────────────────────────
export const beneficiariosApi = {
  list: (params?: { page?: number; q?: string; cadena?: number }) =>
    api.get('/beneficiarios', { params }),
  create: (data: unknown) => api.post('/beneficiarios', data),
  update: (id: number, data: unknown) => api.patch(`/beneficiarios/${id}`, data),
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
  mensual: (params?: { mes?: string; anio?: number }) =>
    api.get('/reportes/mensual', { params }),
}

// ── NOTIFICACIONES ────────────────────────────────────────────────
export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id: number) => api.patch(`/notificaciones/${id}/leer`),
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
}
