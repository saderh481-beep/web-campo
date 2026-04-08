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
  list: () => api.get<Configuracion[]>('/configuraciones'),
  get: (clave: string) => api.get<Configuracion>(`/configuraciones/${clave}`),
  update: (clave: string, valor: unknown) => api.put<Configuracion>(`/configuraciones/${clave}`, { valor }),
}

export const notificacionesService = {
  list: () => api.get<Notificacion[]>('/notificaciones'),
  marcarLeida: (id: string | number) => api.patch<Notificacion>(`/notificaciones/${id}`, { leido: true }),
  marcarTodas: () => api.patch('/notificaciones/leer-todas'),
  eliminar: (id: string | number) => api.delete(`/notificaciones/${id}`),
}

export const dashboardService = {
  get: () => api.get<Dashboard>('/dashboard'),
  coordinador: () => api.get<Dashboard>('/dashboard/coordinador'),
}

export const documentosPlantillaService = {
  list: () => api.get<DocumentoPlantilla[]>('/documentos-plantilla'),
  activos: () => api.get<DocumentoPlantilla[]>('/documentos-plantilla/activos'),
  create: (data: { nombre: string; descripcion?: string; obligatorio?: boolean; orden?: number; configuracion?: unknown }) =>
    api.post<DocumentoPlantilla>('/documentos-plantilla', data),
  update: (id: string | number, data: { nombre?: string; descripcion?: string; obligatorio?: boolean; orden?: number }) =>
    api.patch<DocumentoPlantilla>(`/documentos-plantilla/${id}`, data),
  remove: (id: string | number) => api.delete(`/documentos-plantilla/${id}`),
}

export const reportesService = {
  tecnico: (id: string | number, params?: { mes?: number; anio?: number }) =>
    api.get<ReporteTecnico>(`/reportes/tecnico/${id}`, { params }),
  mensual: (params?: { mes?: number; anio?: number }) =>
    api.get('/reportes/mensual', { params }),
}

export const archiveService = {
  list: () => api.get<Archive[]>('/archive'),
  generar: (periodo: string) => api.post<Archive>(`/archive/${periodo}/generar`),
  descargar: (periodo: string) => api.get(`/archive/${periodo}/descargar`, { responseType: 'blob' }),
  confirmar: (periodo: string) => api.post(`/archive/${periodo}/confirmar`),
  forzar: (periodo: string) => api.post<Archive>(`/archive/${periodo}/forzar`),
}
