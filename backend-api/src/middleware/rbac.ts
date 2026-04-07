import type { Context, Next } from 'hono'
import { getUserFromContext } from './auth'

export type Role = 'administrador' | 'coordinador' | 'tecnico'

export function requireRole(...roles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = getUserFromContext(c)
    
    if (!user) {
      return c.json({ error: 'No autorizado' }, 401)
    }

    if (!roles.includes(user.rol)) {
      return c.json({ error: 'Sin permisos suficientes' }, 403)
    }

    await next()
  }
}

export function requireAdmin() {
  return requireRole('administrador')
}

export function requireAdminOrCoordinator() {
  return requireRole('administrador', 'coordinador')
}

export function requireAdminOrTecnico() {
  return requireRole('administrador', 'tecnico')
}

export function requireAnyRole() {
  return requireRole('administrador', 'coordinador', 'tecnico')
}
