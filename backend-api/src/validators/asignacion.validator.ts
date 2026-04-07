import { z } from 'zod'

export const createAsignacionCoordinadorTecnicoSchema = z.object({
  tecnicoId: z.string().uuid('ID de técnico inválido'),
  coordinadorId: z.string().uuid('ID de coordinador inválido'),
  fechaLimite: z.string().datetime().optional(),
})

export const updateAsignacionCoordinadorTecnicoSchema = z.object({
  coordinadorId: z.string().uuid('ID de coordinador inválido').nullable().optional(),
  fechaLimite: z.string().datetime().nullable().optional(),
  activo: z.boolean().optional(),
})

export const createAsignacionBeneficiarioSchema = z.object({
  tecnicoId: z.string().uuid('ID de técnico inválido'),
  beneficiarioId: z.string().uuid('ID de beneficiario inválido'),
})

export const updateAsignacionBeneficiarioSchema = z.object({
  tecnicoId: z.string().uuid('ID de técnico inválido').nullable().optional(),
  beneficiarioId: z.string().uuid('ID de beneficiario inválido').nullable().optional(),
  activo: z.boolean().optional(),
})

export const createAsignacionActividadSchema = z.object({
  tecnicoId: z.string().uuid('ID de técnico inválido'),
  actividadId: z.string().uuid('ID de actividad inválida'),
})

export const updateAsignacionActividadSchema = z.object({
  tecnicoId: z.string().uuid('ID de técnico inválido').nullable().optional(),
  actividadId: z.string().uuid('ID de actividad inválida').nullable().optional(),
  activo: z.boolean().optional(),
})

export type CreateAsignacionCoordinadorTecnicoInput = z.infer<typeof createAsignacionCoordinadorTecnicoSchema>
export type UpdateAsignacionCoordinadorTecnicoInput = z.infer<typeof updateAsignacionCoordinadorTecnicoSchema>
export type CreateAsignacionBeneficiarioInput = z.infer<typeof createAsignacionBeneficiarioSchema>
export type UpdateAsignacionBeneficiarioInput = z.infer<typeof updateAsignacionBeneficiarioSchema>
export type CreateAsignacionActividadInput = z.infer<typeof createAsignacionActividadSchema>
export type UpdateAsignacionActividadInput = z.infer<typeof updateAsignacionActividadSchema>