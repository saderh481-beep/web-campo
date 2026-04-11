import { api } from '../axios'

export interface Coordinador {
  id: string
  correo: string
  nombre: string
  telefono?: string
  activo: boolean
  rol?: string
  created_at?: string
  updated_at?: string
}

export interface CreateCoordinadorPayload {
  correo: string
  nombre: string
  telefono?: string
}

export interface UpdateCoordinadorPayload {
  nombre?: string
  correo?: string
  telefono?: string
  activo?: boolean
}

export const coordinadoresService = {
  list: () => api.get<Coordinador[]>('/coordinadores'),
  get: (id: string | number) => api.get<Coordinador>(`/coordinadores/${id}`),
  create: (data: CreateCoordinadorPayload) => api.post<Coordinador>('/coordinadores', data),
  update: (id: string | number, data: UpdateCoordinadorPayload) => api.patch<Coordinador>(`/coordinadores/${id}`, data),
  remove: (id: string | number) => api.delete(`/coordinadores/${id}`),
}