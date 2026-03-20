import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
  enviarCodigoTecnico: (email: string) => api.post('/auth/tecnico', { email }),
}

// ── USUARIOS ──────────────────────────────────────────────────────
export const usuariosApi = {
  list: () => api.get('/usuarios'),
  create: (data: unknown) => api.post('/usuarios', data),
  update: (id: number, data: unknown) => api.patch(`/usuarios/${id}`, data),
  remove: (id: number) => api.delete(`/usuarios/${id}`),
  perfil: () => api.get('/usuarios/perfil'),
  actualizarPerfil: (data: unknown) => api.patch('/usuarios/perfil', data),
}

// ── TÉCNICOS ──────────────────────────────────────────────────────
export const tecnicosApi = {
  list: () => api.get('/tecnicos'),
  getById: (id: string) => api.get(`/tecnicos/${id}`),
  create: (data: unknown) => api.post('/tecnicos', data),
  update: (id: number, data: unknown) => api.patch(`/tecnicos/${id}`, data),
  regenerarCodigo: (id: number) => api.post(`/tecnicos/${id}/regenerar-codigo`),
  generarCodigoAcceso: (id: number) => api.post(`/tecnicos/${id}/codigo`),
  remove: (id: number) => api.delete(`/tecnicos/${id}`),
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
  list: () => api.get('/actividades'),
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
  list: (params?: { page?: number; q?: string; cadena?: number }) =>
    api.get('/beneficiarios', { params }),
  getById: (id: string) => api.get(`/beneficiarios/${id}`),
  create: (data: unknown) => api.post('/beneficiarios', data),
  update: (id: number, data: unknown) => api.patch(`/beneficiarios/${id}`, data),
  asignarCadenas: (id: string, cadenaIds: string[]) => 
    api.post(`/beneficiarios/${id}/cadenas`, { cadena_ids: cadenaIds }),
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
  pdfUrl: (id: number) => `/bitacoras/${id}/pdf`,
  pdfDownloadUrl: (id: number) => `/bitacoras/${id}/pdf/descargar`,
}

// ── REPORTES ──────────────────────────────────────────────────────
export const reportesApi = {
  mensual: (params?: { mes?: string; anio?: number }) =>
    api.get('/bitacoras-mensual', { params }),
}

// ── NOTIFICACIONES ────────────────────────────────────────────────
export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leer`),
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
}
