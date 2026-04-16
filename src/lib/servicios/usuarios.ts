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
  /**
   * GET /usuarios — List all users (Admin)
   * @returns Array<Usuario> [{"id", "nombre", "correo", "rol", "activo", "codigo_acceso"}]
   */
  list: () => api.get<Usuario[]>('/usuarios'),

  /**
   * POST /usuarios — Create user (Admin)
   * @body {"correo", "nombre", "rol": "admin|coordinador|tecnico"}
   * @returns 201: {"id", "nombre", "rol", "activo", "codigo_acceso"}
   * @error 409: {"error": "Correo registrado"}
   */
  create: (data: UsuarioPayload) => api.post<Usuario>('/usuarios', data),

  /**
   * PATCH /usuarios/:id — Update user (Admin)
   * @body {"nombre"?, "correo"?, "rol"?, "codigo_acceso"?, "activo"?}
   * @returns Updated user
   * @error 400: {"error": "Código debe 5/6 dig rol"}, 409 dup
   */
  update: (id: string | number, data: UsuarioPayload) => api.patch<Usuario>(`/usuarios/${id}`, data),

  /**
   * DELETE /usuarios/:id — Soft deactivate
   * @returns {"message": "Usuario desactivado"}
   */
  remove: (id: string | number) => api.delete(`/usuarios/${id}`),

  /**
   * DELETE /usuarios/:id/force — Hard + cascade
   * @returns {"message": "Usuario eliminado permanentemente"}
   */
  forceRemove: (id: string | number) => api.delete(`/usuarios/${id}/force`),

  me: () => api.get<Usuario>('/usuarios/me'), // Extra
  hardRemove: (id: string | number) => api.delete(`/usuarios/${id}/force`), // Alias
}

