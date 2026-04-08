import { api } from '../axios'

export interface Configuracion {
  id: string
  clave: string
  valor: Record<string, unknown> | unknown
  descripcion?: string
  updated_by?: string
  updated_at?: string
}

export interface Notificacion {
  id: string
  destino_id: string
  destino_tipo: string
  tipo: string
  titulo: string
  cuerpo: string
  leido: boolean
  enviado_push: boolean
  enviado_email: boolean
  created_at: string
}

export interface Dashboard {
  total_tecnicos: number
  tecnicos_activos: number
  tecnicos_suspendidos: number
  total_beneficiarios: number
  beneficiarios_activos: number
  bitacoras_mes: number
  bitacoras_pendientes: number
}

export interface DocumentoPlantilla {
  id: string
  nombre: string
  descripcion?: string
  obligatorio: boolean
  orden: number
  activo: boolean
}

export interface ReporteTecnico {
  tecnico: { id: string; nombre: string }
  bitacoras: number
  beneficiarios: number
  visitas: { id: string; fecha: string; beneficiario: string; actividad: string }[]
}

export interface Archive {
  id: string
  periodo: string
  total_bitacoras: number
  total_fotos: number
  bytes_comprimidos: number
  estado: 'generando' | 'completado'
  zip_public_url?: string
  created_at: string
}

export const configuracionesService = {
  /** GET /configuraciones — Listar configuraciones (admin) */
  list: () => api.get<Configuracion[]>('/configuraciones'),

  /** GET /configuraciones/:clave — Obtener configuración (admin) */
  get: (clave: string) => api.get<Configuracion>(`/configuraciones/${clave}`),

  /** PUT /configuraciones/:clave — Actualizar configuración (admin) */
  update: (clave: string, valor: unknown) => api.put<Configuracion>(`/configuraciones/${clave}`, { valor }),
}

export const notificacionesService = {
  /** GET /notificaciones — Listar notificaciones */
  list: () => api.get<Notificacion[]>('/notificaciones'),

  /** PATCH /notificaciones/:id/leer — Marcar como leído */
  marcarLeida: (id: string | number) => api.patch<Notificacion>(`/notificaciones/${id}/leer`),

  /** PATCH /notificaciones/leer-todas — Marcar todas como leído */
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
}

export const dashboardService = {
  /** GET /dashboard — Dashboard general */
  get: () => api.get<Dashboard>('/dashboard'),

  /** GET /dashboard/coordinador — Dashboard de coordinador */
  coordinador: () => api.get<Dashboard>('/dashboard/coordinador'),
}

export const documentosPlantillaService = {
  /** GET /documentos-plantilla — Listar documentos (admin) */
  list: () => api.get<DocumentoPlantilla[]>('/documentos-plantilla'),

  /** GET /documentos-plantilla/activos — Listar documentos activos */
  activos: () => api.get<DocumentoPlantilla[]>('/documentos-plantilla/activos'),

  /** POST /documentos-plantilla — Crear documento (admin) */
  create: (data: { nombre: string; descripcion?: string; obligatorio?: boolean; orden?: number; configuracion?: unknown }) =>
    api.post<DocumentoPlantilla>('/documentos-plantilla', data),

  /** PATCH /documentos-plantilla/:id — Actualizar documento (admin) */
  update: (id: string | number, data: { nombre?: string; descripcion?: string; obligatorio?: boolean; orden?: number }) =>
    api.patch<DocumentoPlantilla>(`/documentos-plantilla/${id}`, data),

  /** DELETE /documentos-plantilla/:id — Desactivar documento (admin) */
  remove: (id: string | number) => api.delete(`/documentos-plantilla/${id}`),
}

export const reportesService = {
  /** GET /reportes/tecnico/:id — Reporte de técnico */
  tecnico: (id: string | number, params?: { mes?: number; anio?: number }) =>
    api.get<ReporteTecnico>(`/reportes/tecnico/${id}`, { params }),

  /** GET /reportes/mensual — Reporte mensual */
  mensual: (params?: { mes?: number; anio?: number }) =>
    api.get('/reportes/mensual', { params }),
}

export const archiveService = {
  /** GET /archive — Listar archivos */
  list: () => api.get<Archive[]>('/archive'),

  /** GET /archive/:periodo/descargar — Descargar archivo */
  descargar: (periodo: string) => api.get(`/archive/${periodo}/descargar`, { responseType: 'blob' }),

  /** POST /archive/:periodo/confirmar — Confirmar archivo */
  confirmar: (periodo: string) => api.post(`/archive/${periodo}/confirmar`),

  /** POST /archive/:periodo/forzar — Forzar generación */
  forzar: (periodo: string) => api.post<Archive>(`/archive/${periodo}/forzar`),
}
