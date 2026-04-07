import { z } from 'zod'

export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

export const emailSchema = z.string().email('Correo electrónico inválido')

export const passwordSchema = z
  .string()
  .min(5, 'La contraseña debe tener al menos 5 caracteres')
  .max(20, 'La contraseña no puede exceder 20 caracteres')

export const telefonoSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Teléfono inválido')
  .max(20)

export const nombreSchema = z
  .string()
  .min(1, 'El nombre es requerido')
  .max(200, 'El nombre no puede exceder 200 caracteres')
  .transform(sanitizeString)

export const uuidSchema = z.string().uuid('ID inválido')

export const coordenadasSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, 'Coordenadas inválidas')

export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.issues.map((issue) => issue.message)
  return { success: false, errors }
}

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): Partial<T> => {
  const sanitized: Partial<T> = {}
  
  for (const field of fields) {
    const value = obj[field]
    if (typeof value === 'string') {
      sanitized[field] = sanitizeString(value) as T[keyof T]
    } else {
      sanitized[field] = value
    }
  }
  
  return sanitized
}