import { z } from 'zod'

const coordParcelaRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/

export const createBeneficiarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  municipio: z.string().max(100).optional(),
  localidad: z.string().max(100).optional(),
  localidadId: z.string().uuid('ID de localidad inválido').optional(),
  direccion: z.string().max(500).optional(),
  cp: z.string().max(10).optional(),
  telefonoPrincipal: z.string().max(20).optional(),
  telefonoSecundario: z.string().max(20).optional(),
  coordParcela: z.string().regex(coordParcelaRegex, 'Coordenadas deben tener formato "x,y"').optional(),
  tecnicoId: z.string().uuid('ID de técnico inválido'),
})

export const updateBeneficiarioSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  municipio: z.string().max(100).optional(),
  localidad: z.string().max(100).optional(),
  localidadId: z.string().uuid('ID de localidad inválido').nullable().optional(),
  direccion: z.string().max(500).optional(),
  cp: z.string().max(10).optional(),
  telefonoPrincipal: z.string().max(20).optional(),
  telefonoSecundario: z.string().max(20).optional(),
  coordParcela: z.string().regex(coordParcelaRegex, 'Coordenadas deben tener formato "x,y"').nullable().optional(),
  tecnicoId: z.string().uuid('ID de técnico inválido').nullable().optional(),
  activo: z.boolean().optional(),
})

export const asignarCadenasSchema = z.object({
  cadenaIds: z.array(z.string().uuid('ID de cadena inválido')).min(1, 'Debe seleccionar al menos una cadena'),
})

export const documentoSchema = z.object({
  tipo: z.string().min(1, 'Tipo requerido').max(50),
})

export type CreateBeneficiarioInput = z.infer<typeof createBeneficiarioSchema>
export type UpdateBeneficiarioInput = z.infer<typeof updateBeneficiarioSchema>
export type AsignarCadenasInput = z.infer<typeof asignarCadenasSchema>
export type DocumentoInput = z.infer<typeof documentoSchema>