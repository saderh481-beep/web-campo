import { api } from '../axios'

/**
 * Servicio para Gestión de Usuarios (Admin/Coordinadores)
 * Endpoints con autenticación requerida
 */

export interface Usuario {
  usuario_id: string
  nombre: string
  correo: string
  rol: 'administrador' | 'coordinador' | 'tecnico'
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateUsuarioPayload {
  nombre: string
  correo: string
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

export const gestionUsuariosService = {
  /**
   * Listar todos los usuarios del sistema
   * GET /api/usuarios
   * Requiere: Autenticación (Admin/Coordinador)
   */
  list: () => api.get<Usuario[]>('/usuarios'),

  /**
   * Crear nuevo usuario en el sistema
   * POST /api/usuarios
   * Requiere: Autenticación (Admin/Coordinador)
   */
  create: (data: CreateUsuarioPayload) => 
    api.post<Usuario>('/usuarios', data),

  /**
   * Actualizar usuario existente
   * PATCH /api/usuarios/{id}
   * Requiere: Autenticación (Admin/Coordinador)
   */
  update: (id: string | number, data: UpdateUsuarioPayload) => 
    api.patch<Usuario>(`/usuarios/${id}`, data),

  /**
   * Eliminar usuario (soft delete)
   * DELETE /api/usuarios/{id}
   * Requiere: Autenticación (Admin)
   */
  remove: (id: string | number) => 
    api.delete(`/usuarios/${id}`),

  /**
   * Eliminar usuario permanentemente (hard delete)
   * DELETE /api/usuarios/{id}/force
   * Requiere: Autenticación (Admin)
   */
  hardRemove: (id: string | number) => 
    api.delete(`/usuarios/${id}/force`),
}
