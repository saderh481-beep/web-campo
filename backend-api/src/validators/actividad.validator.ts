import { z } from 'zod'

export const createActividadSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  descripcion: z.string().max(1000).optional(),
})

export const updateActividadSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  activo: z.boolean().optional(),
})

export type CreateActividadInput = z.infer<typeof createActividadSchema>
export type UpdateActividadInput = z.infer<typeof updateActividadSchema>
