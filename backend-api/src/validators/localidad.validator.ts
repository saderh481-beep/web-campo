import { z } from 'zod'

export const createLocalidadSchema = z.object({
  municipio: z.string().min(1, 'Municipio requerido').max(100),
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  cp: z.string().max(10).optional(),
  zonaId: z.string().uuid('ID de zona inválido').optional(),
})

export const updateLocalidadSchema = z.object({
  municipio: z.string().min(1).max(100).optional(),
  nombre: z.string().min(1).max(100).optional(),
  cp: z.string().max(10).optional(),
  zonaId: z.string().uuid('ID de zona inválido').nullable().optional(),
  activo: z.boolean().optional(),
})

export type CreateLocalidadInput = z.infer<typeof createLocalidadSchema>
export type UpdateLocalidadInput = z.infer<typeof updateLocalidadSchema>
