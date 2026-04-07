export type Rol = 'administrador' | 'coordinador' | 'tecnico'

export interface Usuario {
  id: string
  correo: string
  nombre: string
  rol: Rol
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  codigo_acceso?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CreateUsuarioInput {
  correo: string
  nombre: string
  rol: Rol
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  codigo_acceso?: string
}

export interface UpdateUsuarioInput {
  correo?: string
  nombre?: string
  rol?: Rol
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  codigo_acceso?: string
  activo?: boolean
}

export interface UsuarioResponse extends Omit<Usuario, 'codigo_acceso'> {
  codigo?: string
}
