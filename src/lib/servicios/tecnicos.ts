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
  /**
   * GET /tecnicos — List own/team (Admin/Coordinador)
   * @returns Array [{"id", "nombre", "correo", "coordinador_nombre", "codigo_acceso", "activo"}]
   */
  list: () => api.get<Tecnico[]>('/tecnicos'),

  /**
   * GET /tecnicos/:id — Detail + asigns
   */
  get: (id: string | number) => api.get<Tecnico>(`/tecnicos/${id}`),

  /**
   * POST /tecnicos — Create own (Admin/Coordinador)
   * @body {"nombre", "correo", "telefono"?, "coordinador_id", "fecha_limite"?:}
   * @returns 201: {"id", ..., "detalle": {}, "codigo": "5dig"}
   * @error 409: Email dup
   */
  create: (data: CreateTecnicoPayload) => api.post<Tecnico>('/tecnicos', data),

  /**
   * PATCH /tecnicos/:id — Update own
   * @body Same as POST optional
   */
  update: (id: string | number, data: UpdateTecnicoPayload) => api.patch<Tecnico>(`/tecnicos/${id}`, data),

  /**
   * POST /tecnicos/:id/codigo — Regen 5dig (admin)
   * @returns {"message": "Regenerado", "codigo": "54321"}
   */

  generarCodigoAcceso: (id: string | number) => api.post<{ message: string; codigo: string }>(`/tecnicos/${id}/codigo`), // Alias restaurado para TecnicosPage


  /**
   * POST /aplicar-cortes — Bulk suspend expired
   * @returns {"message": "Corte 3 tecnicos", "tecnicos": []}
   */
  aplicarCortes: () => api.post<{ message: string; tecnicos: { id: string; nombre: string }[] }>('/tecnicos/aplicar-cortes'),

  /**
   * POST /tecnicos/:id/cerrar-corte — Suspend specific
   * @returns {"message": "Cerrado", "tecnico": {...}}
   */
  cerrarCorte: (id: string | number) => api.post<{ message: string; tecnico: { id: string; estado_corte: string } }>(`/tecnicos/${id}/cerrar-corte`),

  /**
   * DELETE /tecnicos/:id — Deactivate own
   * @returns {"message": "Desactivado"}
   */
  remove: (id: string | number) => api.delete(`/tecnicos/${id}`),
}

