export interface Tecnico {
  id: string
  nombre: string
  correo: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  codigo_acceso?: string
  estado_corte?: 'en_servicio' | 'suspendido'
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CreateTecnicoInput {
  nombre: string
  correo: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
}

export interface UpdateTecnicoInput {
  nombre?: string
  correo?: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
}

export interface AsignacionCoordinadorTecnico {
  id: string
  coordinador_id: string
  tecnico_id: string
  fecha_limite?: string
  estado_corte?: 'en_servicio' | 'suspendido'
  activo: boolean
  created_at: string
}