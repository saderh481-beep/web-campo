import { z } from 'zod'

export const createDocumentoPlantillaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  descripcion: z.string().max(1000).optional(),
  tipo: z.string().min(1, 'Tipo requerido').max(50),
  obligatorio: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
  configuracion: z.record(z.unknown()).optional(),
})

export const updateDocumentoPlantillaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  tipo: z.string().min(1).max(50).optional(),
  obligatorio: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
  configuracion: z.record(z.unknown()).nullable().optional(),
  activo: z.boolean().optional(),
})

export type CreateDocumentoPlantillaInput = z.infer<typeof createDocumentoPlantillaSchema>
export type UpdateDocumentoPlantillaInput = z.infer<typeof updateDocumentoPlantillaSchema>
