import { api } from '../axios'

export interface Administrador {
  id: string
  correo: string
  nombre: string
  telefono?: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateAdministradorPayload {
  correo: string
  nombre: string
  telefono?: string
}

export interface UpdateAdministradorPayload {
  nombre?: string
  correo?: string
  telefono?: string
  activo?: boolean
}

export const administradoresService = {
  list: () => api.get<Administrador[]>('/administradores'),
  get: (id: string | number) => api.get<Administrador>(`/administradores/${id}`),
  create: (data: CreateAdministradorPayload) => api.post<Administrador>('/administradores', data),
  update: (id: string | number, data: UpdateAdministradorPayload) => api.patch<Administrador>(`/administradores/${id}`, data),
  remove: (id: string | number) => api.delete(`/administradores/${id}`),
}