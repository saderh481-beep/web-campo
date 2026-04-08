import { api } from '../axios'

export interface Beneficiario {
  id: string
  tecnico_id: string
  nombre: string
  municipio: string
  localidad: string
  localidad_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
  activo: boolean
  created_at?: string
  updated_at?: string
  cadenas?: { id: string; nombre: string }[]
  documentos?: Documento[]
}

export interface Documento {
  id: string
  tipo: string
  nombre_original: string
  r2_key: string
  sha256: string
  bytes: number
  subido_por: string
  created_at: string
}

export interface CreateBeneficiarioPayload {
  nombre: string
  municipio: string
  localidad?: string
  localidad_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
  tecnico_id: string
}

export interface UpdateBeneficiarioPayload {
  nombre?: string
  municipio?: string
  localidad?: string
  localidad_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
  tecnico_id?: string
}

export const beneficiariosService = {
  list: (params?: { page?: number; q?: string; tecnico_id?: string; cadena_id?: string }) =>
    api.get<Beneficiario[]>('/beneficiarios', { params }),
  
  get: (id: string | number) => api.get<Beneficiario>(`/beneficiarios/${id}`),
  
  create: (data: CreateBeneficiarioPayload) => api.post<Beneficiario>('/beneficiarios', data),
  
  update: (id: string | number, data: UpdateBeneficiarioPayload) => api.patch<Beneficiario>(`/beneficiarios/${id}`, data),
  
  remove: (id: string | number) => api.delete(`/beneficiarios/${id}`),
  
  asignarCadenas: (id: string | number, cadena_ids: string[]) =>
    api.post(`/beneficiarios/${id}/cadenas`, { cadena_ids }),
  
  subirDocumento: (id: string | number, formData: FormData) =>
    api.post<Documento>(`/beneficiarios/${id}/documentos`, formData),
  
  getDocumentos: (id: string | number) => api.get<Documento[]>(`/beneficiarios/${id}/documentos`),
}
