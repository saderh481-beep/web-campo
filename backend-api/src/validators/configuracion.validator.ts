import { z } from 'zod'

export const updateConfiguracionSchema = z.object({
  valor: z.unknown(),
})

export type UpdateConfiguracionInput = z.infer<typeof updateConfiguracionSchema>
