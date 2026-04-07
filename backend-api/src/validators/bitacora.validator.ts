import { z } from 'zod'

export const bitacoraTipoSchema = z.enum(['visita', 'asesoria', 'seguimiento'])
export const bitacoraEstadoSchema = z.enum(['borrador', 'enviado', 'revisado', 'aprobado'])

export const createBitacoraSchema = z.object({
  tipo: bitacoraTipoSchema,
  tecnicoId: z.string().uuid('ID de técnico inválido'),
  beneficiarioId: z.string().uuid('ID de beneficiario inválido').optional(),
  cadenaProductivaId: z.string().uuid('ID de cadena productiva inválido').optional(),
  actividadId: z.string().uuid('ID de actividad inválida').optional(),
  fechaInicio: z.string().datetime('Fecha de inicio inválida'),
  fechaFin: z.string().datetime().optional(),
  actividadesDesc: z.string().max(5000).optional(),
  recomendaciones: z.string().max(2000).optional(),
  comentariosBeneficiario: z.string().max(2000).optional(),
  coordinacionInterinst: z.boolean().optional(),
})

export const updateBitacoraSchema = z.object({
  tipo: bitacoraTipoSchema.optional(),
  beneficiarioId: z.string().uuid('ID de beneficiario inválido').nullable().optional(),
  cadenaProductivaId: z.string().uuid('ID de cadena productiva inválido').nullable().optional(),
  actividadId: z.string().uuid('ID de actividad inválida').nullable().optional(),
  fechaInicio: z.string().datetime().nullable().optional(),
  fechaFin: z.string().datetime().nullable().optional(),
  actividadesDesc: z.string().max(5000).nullable().optional(),
  recomendaciones: z.string().max(2000).nullable().optional(),
  comentariosBeneficiario: z.string().max(2000).nullable().optional(),
  coordinacionInterinst: z.boolean().nullable().optional(),
  observacionesCoordinador: z.string().max(2000).nullable().optional(),
  estado: bitacoraEstadoSchema.optional(),
})

export const pdfEdicionSchema = z.object({
  encabezado: z.string().max(500).optional(),
  pie: z.string().max(500).optional(),
})

export const updatePdfConfigSchema = z.object({
  pdfEdicion: pdfEdicionSchema.optional(),
})

export type CreateBitacoraInput = z.infer<typeof createBitacoraSchema>
export type UpdateBitacoraInput = z.infer<typeof updateBitacoraSchema>
export type PdfEdicionInput = z.infer<typeof pdfEdicionSchema>
export type UpdatePdfConfigInput = z.infer<typeof updatePdfConfigSchema>
