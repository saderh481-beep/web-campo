import { z } from 'zod'

export const createTecnicoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  correo: z.string().email('Correo inválido').max(255).optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
  coordinadorId: z.string().uuid('ID de coordinador inválido').optional(),
  fechaLimite: z.string().datetime().optional(),
})

export const updateTecnicoSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  correo: z.string().email('Correo inválido').max(255).optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
  coordinadorId: z.string().uuid('ID de coordinador inválido').nullable().optional(),
  fechaLimite: z.string().datetime().nullable().optional(),
  activo: z.boolean().optional(),
})

export type CreateTecnicoInput = z.infer<typeof createTecnicoSchema>
export type UpdateTecnicoInput = z.infer<typeof updateTecnicoSchema>
