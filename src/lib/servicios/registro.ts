import { api } from '../axios'

/**
 * Servicio para Registro Público de Usuarios
 * Endpoints sin autenticación requerida
 */

export interface RegisterPayload {
  nombre: string
  correo: string
  password: string
  telefono?: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  usuario: {
    usuario_id: string
    nombre: string
    correo: string
    rol: 'tecnico'
    activo: boolean
    created_at: string
  }
}

export interface VerifyEmailPayload {
  token: string
}

export interface ResendVerificationPayload {
  correo: string
}

export const registroService = {
  /**
   * Registrar nuevo usuario sin autenticación
   * POST /api/auth/register
   */
  register: (data: RegisterPayload) => 
    api.post<RegisterResponse>('/auth/register', data),

  /**
   * Verificar email del usuario registrado
   * POST /api/auth/verify-email
   */
  verifyEmail: (data: VerifyEmailPayload) =>
    api.post('/auth/verify-email', data),

  /**
   * Reenviar correo de verificación
   * POST /api/auth/resend-verification
   */
  resendVerification: (data: ResendVerificationPayload) =>
    api.post('/auth/resend-verification', data),
}
