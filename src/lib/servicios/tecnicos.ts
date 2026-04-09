import { api } from '../axios'

export interface Tecnico {
  id: string
  nombre: string
  correo: string
  telefono?: string
  coordinador_id?: string
  coordinador_nombre?: string
  fecha_limite?: string
  estado_corte?: string
  codigo_acceso?: string
  activo: boolean
  asignaciones?: AsignacionCoordinadorTecnico[]
}

export interface AsignacionCoordinadorTecnico {
  id: string
  coordinador_id: string
  tecnico_id: string
  fecha_limite: string
  estado_corte: string
  activo: boolean
}

export interface CreateTecnicoPayload {
  nombre: string
  correo: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  codigo_acceso?: string
}

export interface UpdateTecnicoPayload {
  nombre?: string
  correo?: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
}

export const tecnicosService = {
  list: () => api.get<Tecnico[]>('/tecnicos'),
  
  get: (id: string | number) => api.get<Tecnico>(`/tecnicos/${id}`),
  
  create: (data: CreateTecnicoPayload) => api.post<Tecnico>('/tecnicos', data),
  
  update: (id: string | number, data: UpdateTecnicoPayload) => api.patch<Tecnico>(`/tecnicos/${id}`, data),
  
  remove: (id: string | number) => api.delete(`/tecnicos/${id}`),
  
  regenerarCodigo: (id: string | number) => api.post<{ message: string; codigo: string }>(`/tecnicos/${id}/codigo`),
  generarCodigoAcceso: (id: string | number) => api.post<{ message: string; codigo: string }>(`/tecnicos/${id}/codigo`),
  
  aplicarCortes: () => api.post<{ message: string; tecnicos: { id: string; nombre: string }[] }>('/tecnicos/aplicar-cortes'),
  
  cerrarCorte: (id: string | number) => api.post<{ message: string; tecnico: { id: string; estado_corte: string } }>(`/tecnicos/${id}/cerrar-corte`),
}
