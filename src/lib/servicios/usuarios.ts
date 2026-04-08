import { api } from '../axios'

export interface Usuario {
  id: string
  correo: string
  nombre: string
  rol: 'admin' | 'coordinador' | 'tecnico'
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateUsuarioPayload {
  correo: string
  nombre: string
  rol: 'admin' | 'coordinador' | 'tecnico'
  codigo_acceso?: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
}

export interface UpdateUsuarioPayload {
  nombre?: string
  correo?: string
  rol?: 'admin' | 'coordinador' | 'tecnico'
  codigo_acceso?: string
  activo?: boolean
  telefono?: string
  coordinator_id?: string
  fecha_limite?: string
}

export type UsuarioPayload = CreateUsuarioPayload | UpdateUsuarioPayload

export const usuariosService = {
  list: () => api.get<Usuario[]>('/usuarios'),
  
  create: (data: UsuarioPayload) => api.post<Usuario>('/usuarios', data),
  
  update: (id: string | number, data: UsuarioPayload) => api.patch<Usuario>(`/usuarios/${id}`, data),
  
  remove: (id: string | number) => api.delete(`/usuarios/${id}`),
  
  forceRemove: (id: string | number) => api.delete(`/usuarios/${id}/force`),
  hardRemove: (id: string | number) => api.delete(`/usuarios/${id}/force`),
}
