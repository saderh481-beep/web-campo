/**
 * NOTA: Los endpoints de registro público (register, verify-email, resend-verification)
 * NO existen en el backend. Este módulo está deshabilitado.
 *
 * El flujo de autenticación correcto es:
 *   1. POST /auth/request-codigo-acceso  → solicitar código
 *   2. POST /auth/verify-codigo-acceso   → verificar código y obtener token
 *   (o POST /auth/login como alias)
 *
 * Ver: src/lib/servicios/auth.ts
 */

export {}
