import type { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'
import { env } from '../config/env'

const SECRET = env.JWT_SECRET

export interface JwtPayload {
  sub: string
  id: string
  correo: string
  nombre: string
  rol: 'administrador' | 'coordinador' | 'tecnico'
  iat: number
  exp: number
}

export const jwtMiddleware = jwt({
  secret: SECRET,
  header: 'authorization',
  cookie: 'token',
})

export async function authMiddleware(c: Context, next: Next) {
  try {
    const payload = await jwtMiddleware(c, async () => {})
    if (!payload) {
      return c.json({ error: 'No autorizado' }, 401)
    }
    c.set('user', payload as unknown as JwtPayload)
    await next()
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 401)
  }
}

export function getUserFromContext(c: Context): JwtPayload | null {
  return c.get('user') || null
}