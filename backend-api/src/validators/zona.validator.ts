import { z } from 'zod'

export const createZonaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  descripcion: z.string().max(1000).optional(),
})

export const updateZonaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  activo: z.boolean().optional(),
})

export type CreateZonaInput = z.infer<typeof createZonaSchema>
export type UpdateZonaInput = z.infer<typeof updateZonaSchema>
