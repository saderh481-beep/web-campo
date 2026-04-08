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
  listarCoordinadorTecnico: (tecnico_id?: string) =>
    api.get<AsignacionCoordinadorTecnico[]>('/asignaciones/coordinador-tecnico', { params: { tecnico_id } }),
  
  obtenerCoordinadorTecnico: (tecnico_id: string) =>
    api.get<AsignacionCoordinadorTecnico>(`/asignaciones/coordinador-tecnico/${tecnico_id}`),
  
  crearCoordinadorTecnico: (data: { tecnico_id: string; coordinador_id: string; fecha_limite: string }) =>
    api.post<AsignacionCoordinadorTecnico>('/asignaciones/coordinador-tecnico', data),
  asignarCoordinadorTecnico: (data: { tecnico_id: string; coordinador_id: string; fecha_limite: string }) =>
    api.post<AsignacionCoordinadorTecnico>('/asignaciones/coordinador-tecnico', data),
  
  actualizarCoordinadorTecnico: (tecnico_id: string, data: { coordinador_id?: string; fecha_limite?: string; activo?: boolean }) =>
    api.patch<AsignacionCoordinadorTecnico>(`/asignaciones/coordinador-tecnico/${tecnico_id}`, data),
  
  eliminarCoordinadorTecnico: (tecnico_id: string) =>
    api.delete(`/asignaciones/coordinador-tecnico/${tecnico_id}`),
  quitarCoordinadorTecnico: (tecnico_id: string) =>
    api.delete(`/asignaciones/coordinador-tecnico/${tecnico_id}`),
  
  listarBeneficiario: (params?: { tecnico_id?: string; beneficiario_id?: string; activo?: boolean }) =>
    api.get<AsignacionBeneficiario[]>('/asignaciones/beneficiario', { params }),
  
  crearBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post<AsignacionBeneficiario>('/asignaciones/beneficiario', data),
  
  asignarBeneficiario: (data: { tecnico_id: string; beneficiario_id: string }) =>
    api.post<AsignacionBeneficiario>('/asignaciones/beneficiario', data),
  
  actualizarBeneficiario: (id: string | number, data: { tecnico_id?: string; beneficiario_id?: string; activo?: boolean }) =>
    api.patch<AsignacionBeneficiario>(`/asignaciones/beneficiario/${id}`, data),
  
  eliminarBeneficiario: (id: string) =>
    api.delete(`/asignaciones/beneficiario/${id}`),
  quitarBeneficiario: (id: string | number) =>
    api.delete(`/asignaciones/beneficiario/${id}`),
  
  listarActividad: (params?: { tecnico_id?: string; actividad_id?: string; activo?: boolean }) =>
    api.get<AsignacionActividad[]>('/asignaciones/actividad', { params }),
  
  crearActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post<AsignacionActividad>('/asignaciones/actividad', data),
  
  asignarActividad: (data: { tecnico_id: string; actividad_id: string }) =>
    api.post<AsignacionActividad>('/asignaciones/actividad', data),
  
  actualizarActividad: (id: string | number, data: { tecnico_id?: string; actividad_id?: string; activo?: boolean }) =>
    api.patch<AsignacionActividad>(`/asignaciones/actividad/${id}`, data),
  
  eliminarActividad: (id: string) =>
    api.delete(`/asignaciones/actividad/${id}`),
  quitarActividad: (id: string | number) =>
    api.delete(`/asignaciones/actividad/${id}`),
}
