import { z } from 'zod'

export const rolSchema = z.enum(['administrador', 'coordinador', 'tecnico'])

export const createUsuarioSchema = z.object({
  correo: z.string().email('Correo inválido').max(255),
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  rol: rolSchema,
  telefono: z.string().max(20).optional(),
  coordinadorId: z.string().uuid('ID de coordinador inválido').optional(),
  fechaLimite: z.string().datetime().optional(),
})

export const updateUsuarioSchema = z.object({
  correo: z.string().email('Correo inválido').max(255).optional(),
  nombre: z.string().min(1).max(100).optional(),
  rol: rolSchema.optional(),
  telefono: z.string().max(20).optional(),
  coordinadorId: z.string().uuid('ID de coordinador inválido').nullable().optional(),
  fechaLimite: z.string().datetime().nullable().optional(),
  activo: z.boolean().optional(),
  codigoAcceso: z.string().min(5).max(6).optional(),
})

export const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  codigoAcceso: z.string().min(5, 'Código de acceso debe tener al menos 5 dígitos').max(6, 'Máximo 6 dígitos'),
})

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>
export type LoginInput = z.infer<typeof loginSchema>
