import { api } from '../axios'

export interface Beneficiario {
  id: string
  tecnico_id: string
  nombre: string
  curp?: string
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
  curp?: string
  municipio: string
  localidad?: string
  localidad_id?: string
  direccion?: string
  cp?: string
  telefono_principal?: string
  telefono_secundario?: string
  coord_parcela?: string
  tecnico_id?: string
}

export interface UpdateBeneficiarioPayload {
  nombre?: string
  curp?: string
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
  /**
   * GET /beneficiarios — List own (All roles own tecnico)
   * @returns Array full fields
   */
  list: (params?: { page?: number; q?: string; tecnico_id?: string; cadena_id?: string }) =>
    api.get<Beneficiario[]>('/beneficiarios', { params }),

  /**
   * GET /beneficiarios/:id — Detail + relaciones (cadenas, documentos)
   */
  get: (id: string | number) => api.get<Beneficiario>(`/beneficiarios/${id}`),

  /**
   * POST /beneficiarios — Create
   * @body {"nombre", "municipio", "curp"?, "localidad_id"?, "direccion"?, "cp"?, "telefonos"?, "coord_parcela": "x,y", "tecnico_id"?:}
   * @error 400: Coord/local invalid
   */
  create: (data: CreateBeneficiarioPayload) => api.post<Beneficiario>('/beneficiarios', data),

  /**
   * PATCH /beneficiarios/:id — Update/reasign
   */
  update: (id: string | number, data: UpdateBeneficiarioPayload) => api.patch<Beneficiario>(`/beneficiarios/${id}`, data),

  /**
   * DELETE /beneficiarios/:id — Soft
   */
  remove: (id: string | number) => api.delete(`/beneficiarios/${id}`),

  /**
   * POST /beneficiarios/:id/cadenas (admin)
   * @body {"cadena_ids": []}
   */
  asignarCadenas: (id: string | number, cadena_ids: string[]) =>
    api.post(`/beneficiarios/${id}/cadenas`, { cadena_ids }),

  /**
   * POST /beneficiarios/:id/documentos — Upload
   * @multipart archivo, tipo
   */
  subirDocumento: (id: string | number, formData: FormData) =>
    api.post<Documento>(`/beneficiarios/${id}/documentos`, formData),

  /**
   * GET /beneficiarios/:id/documentos
   */
  getDocumentos: (id: string | number) => api.get<Documento[]>(`/beneficiarios/${id}/documentos`),
  
  // Fotos/firma: ver bitacorasService (funcional match)
}

