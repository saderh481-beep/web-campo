export interface Beneficiario {
  id: string
  nombre: string
  municipio?: string
  localidad?: string
  localidad_id?: string
  tecnico_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CreateBeneficiarioInput {
  nombre: string
  municipio?: string
  localidad?: string
  localidad_id?: string
  tecnico_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
}

export interface UpdateBeneficiarioInput {
  nombre?: string
  municipio?: string
  localidad?: string
  localidad_id?: string
  tecnico_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
}

export interface BeneficiarioConCadenas extends Beneficiario {
  cadenas?: { id: string; nombre: string }[]
}
