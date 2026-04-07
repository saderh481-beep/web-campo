export interface CadenaProductiva {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CreateCadenaInput {
  nombre: string
  descripcion?: string
}

export interface UpdateCadenaInput {
  nombre?: string
  descripcion?: string
}