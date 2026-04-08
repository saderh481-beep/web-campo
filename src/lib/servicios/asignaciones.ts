import { api } from '../axios'
import { actividadesService } from './catalogos'

export { actividadesService }

export interface AsignacionCoordinadorTecnico {
  id: string
  coordinador_id: string
  coordinador_nombre?: string
  tecnico_id: string
  tecnico_nombre?: string
  fecha_limite?: string
  estado_corte?: string
  activo: boolean
}

export interface AsignacionBeneficiario {
  id: string
  tecnico_id: string
  tecnico_nombre?: string
  beneficiario_id: string
  beneficiario_nombre?: string
  asignado_por?: string
  asignado_en?: string
  activo: boolean
}

export interface AsignacionActividad {
  id: string
  tecnico_id: string
  tecnico_nombre?: string
  actividad_id: string
  actividad_nombre?: string
  asignado_por?: string
  asignado_en?: string
  activo: boolean
}

export const asignacionesService = {
  // ─── Coordinador -> Técnico ───────────────────────────────────────────────

  /** GET /asignaciones/coordinador-tecnico */
  listarCoordinadorTecnico: (tecnico_id?: string) =>
    api.get<AsignacionCoordinadorTecnico[]>('/asignaciones/coordinador-tecnico', { params: { tecnico_id } }),

  /** GET /asignaciones/coordinador-tecnico/lista */
  listaAlternativaCoordinadorTecnico: () =>
    api.get<AsignacionCoordinadorTecnico[]>('/asignaciones/coordinador-tecnico/lista'),

  /** GET /asignaciones/coordinador-tecnico/:tecnico_id */
  obtenerCoordinadorTecnico: (tecnico_id: string) =>
    api.get<AsignacionCoordinadorTecnico>(`/asignaciones/coordinador-tecnico/${tecnico_id}`),

  /** POST /asignaciones/coordinador-tecnico */
  crearCoordinadorTecnico: (data: { tecnico_id: string; coordinador_id: string; fecha_limite: string }) =>
    api.post<AsignacionCoordinadorTecnico>('/asignaciones/coordinador-tecnico', data),
  asignarCoordinadorTecnico: (data: { tecnico_id: string; coordinador_id: string; fecha_limite: string }) =>
    api.post<AsignacionCoordinadorTecnico>('/asignaciones/coordinador-tecnico', data),

  /** PATCH /asignaciones/coordinador-tecnico/:tecnico_id */
  actualizarCoordinadorTecnico: (tecnico_id: string, data: { coordinador_id?: string; fecha_limite?: string; activo?: boolean }) =>
    api.patch<AsignacionCoordinadorTecnico>(`/asignaciones/coordinador-tecnico/${tecnico_id}`, data),

  /** DELETE /asignaciones/coordinador-tecnico/:tecnico_id */
  eliminarCoordinadorTecnico: (tecnico_id: string) =>
    api.delete(`/asignaciones/coordinador-tecnico/${tecnico_id}`),
  quitarCoordinadorTecnico: (tecnico_id: string) =>
    api.delete(`/asignaciones/coordinador-tecnico/${tecnico_id}`),

  // ─── Técnico -> Beneficiario ──────────────────────────────────────────────

  /** GET /asignaciones/beneficiario */
  listarBeneficiario: (params?: { tecnico_id?: string; beneficiario_id?: string; activo?: boolean }) =>
    api.get<AsignacionBeneficiario[]>('/asignaciones/beneficiario', { params }),

  /** GET /asignaciones/beneficiario/:id */
  obtenerBeneficiario: (id: string | number) =>
    api.get<AsignacionBeneficiario>(`/asignaciones/beneficiario/${id}`),

  /** POST /asignaciones/beneficiario */
  crearBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post<AsignacionBeneficiario>('/asignaciones/beneficiario', data),
  asignarBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post<AsignacionBeneficiario>('/asignaciones/beneficiario', data),

  /** PATCH /asignaciones/beneficiario/:id */
  actualizarBeneficiario: (id: string | number, data: { tecnico_id?: string; beneficiario_id?: string; activo?: boolean }) =>
    api.patch<AsignacionBeneficiario>(`/asignaciones/beneficiario/${id}`, data),

  /** DELETE /asignaciones/beneficiario/:id */
  eliminarBeneficiario: (id: string | number) =>
    api.delete(`/asignaciones/beneficiario/${id}`),
  quitarBeneficiario: (id: string | number) =>
    api.delete(`/asignaciones/beneficiario/${id}`),

  // ─── Técnico -> Actividad ─────────────────────────────────────────────────

  /** GET /asignaciones/actividad */
  listarActividad: (params?: { tecnico_id?: string; actividad_id?: string; activo?: boolean }) =>
    api.get<AsignacionActividad[]>('/asignaciones/actividad', { params }),

  /** GET /asignaciones/actividad/:id */
  obtenerActividad: (id: string | number) =>
    api.get<AsignacionActividad>(`/asignaciones/actividad/${id}`),

  /** POST /asignaciones/actividad */
  crearActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post<AsignacionActividad>('/asignaciones/actividad', data),
  asignarActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post<AsignacionActividad>('/asignaciones/actividad', data),

  /** PATCH /asignaciones/actividad/:id */
  actualizarActividad: (id: string | number, data: { tecnico_id?: string; actividad_id?: string; activo?: boolean }) =>
    api.patch<AsignacionActividad>(`/asignaciones/actividad/${id}`, data),

  /** DELETE /asignaciones/actividad/:id */
  eliminarActividad: (id: string | number) =>
    api.delete(`/asignaciones/actividad/${id}`),
  quitarActividad: (id: string | number) =>
    api.delete(`/asignaciones/actividad/${id}`),
}
