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
  created_at?: string
  updated_at?: string
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
  const token = localStorage.getItem('token')
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) throw new Error('Error al descargar PDF')
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

export const bitacorasService = {
  list: (params?: { tecnico_id?: string; mes?: number; anio?: number; estado?: string; tipo?: string }) =>
    api.get<Bitacora[]>('/bitacoras', { params }),
  
  get: (id: string | number) => api.get<Bitacora>(`/bitacoras/${id}`),
  
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
    const url = `${apiUrl}/bitacoras/${id}/pdf/descargar`
    await downloadBlob(url, `bitacora-${id}.pdf`)
  },
  
  listarVersiones: (id: string | number) => api.get<BitacoraVersion[]>(`/bitacoras/${id}/versiones`),
  versiones: (id: string | number) => api.get<BitacoraVersion[]>(`/bitacoras/${id}/versiones`),
}
