import { z } from 'zod'

export const createCadenaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  descripcion: z.string().max(1000).optional(),
})

export const updateCadenaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  activo: z.boolean().optional(),
})

export type CreateCadenaInput = z.infer<typeof createCadenaSchema>
export type UpdateCadenaInput = z.infer<typeof updateCadenaSchema>
