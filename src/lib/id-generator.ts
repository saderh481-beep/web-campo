/**
 * Generador de identificadores únicos según rol
 * Implementa las reglas de negocio para la generación de IDs
 */

import { type Rol } from './validation'

/**
 * Genera un identificador numérico aleatorio según el rol
 * @param role - Rol del usuario (administrador, coordinador, tecnico)
 * @returns Identificador numérico como string
 */
export function generateId(role: Rol): string {
  const length = role === 'tecnico' ? 5 : 6
  
  // Generar número aleatorio con la longitud requerida
  const min = Math.pow(10, length - 1) // 10000 para 5 dígitos, 100000 para 6 dígitos
  const max = Math.pow(10, length) - 1 // 99999 para 5 dígitos, 999999 para 6 dígitos
  
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min
  return randomNum.toString()
}

/**
 * Genera un identificador único verificando contra una lista existente
 * @param role - Rol del usuario
 * @param existingIds - Lista de IDs existentes para verificar unicidad
 * @param maxAttempts - Número máximo de intentos para generar un ID único
 * @returns Identificador único o null si no se puede generar
 */
export function generateUniqueId(
  role: Rol, 
  existingIds: string[], 
  maxAttempts: number = 1000
): string | null {
  const attempts = new Set<string>()
  
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateId(role)
    
    // Evitar ciclos infinitos verificando intentos previos
    if (attempts.has(candidate)) continue
    attempts.add(candidate)
    
    // Verificar unicidad
    if (!existingIds.includes(candidate)) {
      return candidate
    }
  }
  
  // Si no se puede generar un ID único después de maxAttempts
  throw new Error(`No se pudo generar un ID único después de ${maxAttempts} intentos`)
}

/**
 * Verifica si un ID cumple con las reglas de longitud según el rol
 * @param id - Identificador a validar
 * @param role - Rol del usuario
 * @returns true si el ID es válido para el rol
 */
export function isValidIdForRole(id: string, role: Rol): boolean {
  const length = role === 'tecnico' ? 5 : 6
  return /^\d+$/.test(id) && id.length === length
}

/**
 * Obtiene la longitud requerida para un rol específico
 * @param role - Rol del usuario
 * @returns Longitud requerida del ID
 */
export function getRequiredIdLength(role: Rol): number {
  return role === 'tecnico' ? 5 : 6
}

/**
 * Formatea un ID para mostrarlo en la interfaz
 * @param id - Identificador a formatear
 * @returns ID formateado con ceros a la izquierda si es necesario
 */
export function formatId(id: string): string {
  // Asegurar que el ID tenga al menos 5 dígitos
  const numId = parseInt(id, 10)
  if (isNaN(numId)) return id
  
  // Determinar longitud mínima (asumimos 6 dígitos como estándar)
  const minLength = 6
  return numId.toString().padStart(minLength, '0')
}