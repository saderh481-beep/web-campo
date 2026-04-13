import { api, apiUrl } from '../axios'

export interface Bitacora {
  id: string
  tipo: string
  estado: string
  tecnico_id?: string
  tecnico_nombre?: string
  tecnico?: string
  usuario_nombre?: string
  usuario?: string
  beneficiario_id?: string
  beneficiario_nombre?: string
  beneficiario?: string
  cadena_productiva_id?: string
  cadena_nombre?: string
  cadena?: string
  actividad_id?: string
  actividad_nombre?: string
  actividad?: string
  fecha_inicio?: string
  fecha_fin?: string
  actividades_desc?: string
  actividades_realizadas?: string
  recomendaciones?: string
  comentarios_beneficiario?: string
  notas?: string
  observaciones?: string
  observaciones_coordinador?: string
  coordinacion_interinst?: boolean
  pdf_edicion?: { encabezado?: string; pie?: string }
  foto_rostro_url?: string
  firma_url?: string
  fotos_campo?: unknown[]
  fotos_campo_urls?: string[]
  pdf_actividades_url?: string
  created_at?: string
  updated_at?: string
  calificaciones?: string
}

export interface PdfEdicion {
  encabezado?: string
  pie?: string
}

export interface BitacoraVersion {
  id: string
  version: number
  r2_key: string
  sha256: string
  inmutable: boolean
  generado_por: string
  created_at: string
}

async function downloadBlob(url: string, filename: string): Promise<void> {
  try {
    const response = await api.get(`/bitacoras/${url}/pdf/descargar`, {
      responseType: 'blob'
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch { throw new Error('Error al descargar PDF') }
}

export const bitacorasService = {
  list: (params?: { tecnico_id?: string; mes?: number; anio?: number; estado?: string; tipo?: string }) =>
    api.get<Bitacora[]>('/bitacoras', { params }),
  
  get: (id: string | number) => api.get<Bitacora>(`/bitacoras/${id}`),
  
  create: (data: Partial<Bitacora>) => api.post<Bitacora>('/bitacoras', data),
  
  update: (id: string | number, data: { observaciones?: string; actividades_realizadas?: string }) =>
    api.patch<Bitacora>(`/bitacoras/${id}`, data),
  
  updatePdfConfig: (id: string | number, pdf_edicion: PdfEdicion) =>
    api.patch<Bitacora>(`/bitacoras/${id}/pdf-config`, { pdf_edicion }),
  
  getPdfUrl: (id: string | number) => `${apiUrl}/bitacoras/${id}/pdf`,
  pdfUrl: (id: string | number) => `${apiUrl}/bitacoras/${id}/pdf`,
  
  getPdfDownloadUrl: (id: string | number) => `${apiUrl}/bitacoras/${id}/pdf/descargar`,
  pdfDownloadUrl: (id: string | number) => `${apiUrl}/bitacoras/${id}/pdf/descargar`,
  
  imprimirPdf: (id: string | number) => api.post(`/bitacoras/${id}/pdf/imprimir`),
  
  downloadPdf: async (id: string | number) => {
    await downloadBlob(String(id), `bitacora-${id}.pdf`)
  },
  
  listarVersiones: (id: string | number) => api.get<BitacoraVersion[]>(`/bitacoras/${id}/versiones`),
  versiones: (id: string | number) => api.get<BitacoraVersion[]>(`/bitacoras/${id}/versiones`),
  
  subirFotoRostro: (id: string | number, file: File) => {
    const formData = new FormData()
    formData.append('archivo', file)
    return api.post(`/bitacoras/${id}/foto-rostro`, formData)
  },
  
  getFotoRostro: (id: string | number) => api.get(`/bitacoras/${id}/foto-rostro`),
  
  subirFirma: (id: string | number, file: File) => {
    const formData = new FormData()
    formData.append('archivo', file)
    return api.post(`/bitacoras/${id}/firma`, formData)
  },
  
  getFirma: (id: string | number) => api.get(`/bitacoras/${id}/firma`),
  
  subirFotosCampo: (id: string | number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('archivos', file))
    return api.post(`/bitacoras/${id}/fotos-campo`, formData)
  },
  
  getFotosCampo: (id: string | number) => api.get<{ url: string; label: string }[]>(`/bitacoras/${id}/fotos-campo`),
  
  eliminarFotoCampo: (id: string | number, idx: number) => api.delete(`/bitacoras/${id}/fotos-campo/${idx}`),
  
  subirPdfActividades: (id: string | number, file: File) => {
    const formData = new FormData()
    formData.append('archivo', file)
    return api.post(`/bitacoras/${id}/pdf-actividades`, formData)
  },
  
  getPdfActividades: (id: string | number) => api.get(`/bitacoras/${id}/pdf-actividades`),
  
  eliminarPdfActividades: (id: string | number) => api.delete(`/bitacoras/${id}/pdf-actividades`),
}
