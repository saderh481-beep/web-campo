import { api } from '../axios'

export interface Usuario {
  id: string
  correo: string
  nombre: string
  rol: 'admin' | 'coordinador' | 'tecnico' | 'administrador'
  activo: boolean
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  created_at?: string
  updated_at?: string
}

export interface CreateUsuarioPayload {
  correo: string
  nombre: string
  rol: 'administrador' | 'coordinador' | 'tecnico'
  codigo_acceso?: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
}

export interface UpdateUsuarioPayload {
  nombre?: string
  correo?: string
  rol?: 'administrador' | 'coordinador' | 'tecnico'
  codigo_acceso?: string
  activo?: boolean
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
}

export type UsuarioPayload = CreateUsuarioPayload | UpdateUsuarioPayload

export const usuariosService = {
  /** GET /usuarios/me — Obtener usuario actual autenticado */
  me: () => api.get<Usuario>('/usuarios/me'),

  /** GET /usuarios — Listar usuarios (admin) */
  list: () => api.get<Usuario[]>('/usuarios'),

  /** POST /usuarios — Crear usuario (admin) */
  create: (data: UsuarioPayload) => api.post<Usuario>('/usuarios', data),

  /** PATCH /usuarios/:id — Actualizar usuario (admin) */
  update: (id: string | number, data: UsuarioPayload) => api.patch<Usuario>(`/usuarios/${id}`, data),

  /** DELETE /usuarios/:id — Desactivar usuario (soft delete) */
  remove: (id: string | number) => api.delete(`/usuarios/${id}`),

  /** DELETE /usuarios/:id/force — Eliminar permanentemente (hard delete) */
  forceRemove: (id: string | number) => api.delete(`/usuarios/${id}/force`),
  hardRemove: (id: string | number) => api.delete(`/usuarios/${id}/force`),
}
