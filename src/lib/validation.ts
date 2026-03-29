/**
 * Validación de códigos de acceso según rol
 */

export type Rol = 'administrador' | 'coordinador' | 'tecnico'

export interface ValidationResponse {
  isValid: boolean
  message?: string
}

/**
 * Obtiene la longitud requerida para el código de acceso según el rol
 */
export function getRequiredIdLength(role: Rol): number {
  return role === 'tecnico' ? 5 : 6
}

/**
 * Obtiene el mensaje de longitud requerida según el rol
 */
export function getIdLengthMessage(role: Rol): string {
  return role === 'tecnico' ? 'El ID debe tener 5 dígitos' : 'El ID debe tener 6 dígitos'
}

/**
 * Valida un código de acceso según el rol
 * 
 * @param codigo - El código a validar
 * @param role - El rol del usuario
 * @returns Objeto con isValid y mensaje de error opcional
 */
export function validateCodigoAcceso(codigo: string, role: Rol): ValidationResponse {
  // Validar que sea solo números
  if (!/^\d+$/.test(codigo)) {
    return { 
      isValid: false, 
      message: 'El ID debe contener solo números (0-9)' 
    }
  }
  
  // Validar longitud exacta según rol
  const requiredLength = getRequiredIdLength(role)
  if (codigo.length !== requiredLength) {
    return { 
      isValid: false, 
      message: getIdLengthMessage(role) 
    }
  }
  
  return { isValid: true }
}

/**
 * Valida que un código de acceso sea único en una lista de usuarios
 * 
 * @param codigo - El código a validar
 * @param usuarios - Lista de usuarios para verificar unicidad
 * @param excludeId - ID del usuario a excluir de la validación (para ediciones)
 * @returns Objeto con isValid y mensaje de error opcional
 */
export function validateCodigoAccesoUnico(
  codigo: string, 
  usuarios: Array<{ id: string | number; codigo_acceso?: string }>, 
  excludeId?: string | number
): ValidationResponse {
  const duplicated = usuarios.some((usuario) =>
    String(usuario.id) !== String(excludeId) && 
    usuario.codigo_acceso?.trim() === codigo
  )
  
  if (duplicated) {
    return {
      isValid: false,
      message: 'El ID ya está en uso'
    }
  }
  
  return { isValid: true }
}

/**
 * Valida todos los requisitos para un código de acceso
 * 
 * @param codigo - El código a validar
 * @param role - El rol del usuario
 * @param usuarios - Lista de usuarios para verificar unicidad
 * @param excludeId - ID del usuario a excluir de la validación (para ediciones)
 * @returns Objeto con isValid y mensaje de error opcional
 */
export function validateCodigoAccesoCompleto(
  codigo: string, 
  role: Rol, 
  usuarios: Array<{ id: string | number; codigo_acceso?: string }>, 
  excludeId?: string | number
): ValidationResponse {
  // Validar formato y longitud
  const formatValidation = validateCodigoAcceso(codigo, role)
  if (!formatValidation.isValid) {
    return formatValidation
  }
  
  // Validar unicidad
  const uniqueValidation = validateCodigoAccesoUnico(codigo, usuarios, excludeId)
  if (!uniqueValidation.isValid) {
    return uniqueValidation
  }
  
  return { isValid: true }
}

/**
 * Enmascara un código de acceso para mostrar solo los últimos 2 dígitos
 */
export function maskAccessCode(value?: string): string {
  if (!value) return '—'
  return `${'•'.repeat(Math.max(0, value.length - 2))}${value.slice(-2)}`
}

/**
 * Formateador de códigos de acceso para mostrar en inputs
 */
export function formatAccessCodeInput(value: string, role: Rol): string {
  // Eliminar caracteres no numéricos
  const numericValue = value.replace(/\D/g, '')
  
  // Limitar a la longitud requerida según el rol
  const maxLength = getRequiredIdLength(role)
  return numericValue.slice(0, maxLength)
}