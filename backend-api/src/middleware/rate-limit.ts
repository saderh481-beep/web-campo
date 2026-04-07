import type { Context, Next } from 'hono'
import { env } from '../config/env'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

setInterval(cleanupExpiredEntries, 60000)

function getClientKey(c: Context): string {
  const user = c.get('user')
  if (user && 'id' in user) {
    return `user:${(user as { id: string }).id}`
  }
  
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() 
    || c.req.header('x-real-ip') 
    || 'unknown'
  
  return `ip:${ip}`
}

export function rateLimiter(options?: {
  windowMs?: number
  maxRequests?: number
}) {
  const windowMs = options?.windowMs || env.RATE_LIMIT_WINDOW
  const maxRequests = options?.maxRequests || env.RATE_LIMIT_MAX

  return async (c: Context, next: Next) => {
    const key = getClientKey(c)
    const now = Date.now()
    
    let entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      rateLimitStore.set(key, entry)
    }
    
    entry.count++
    
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      return c.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.', retryAfter },
        429,
        {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(entry.resetTime),
        }
      )
    }
    
    c.res.headers.set('X-RateLimit-Limit', String(maxRequests))
    c.res.headers.set('X-RateLimit-Remaining', String(maxRequests - entry.count))
    c.res.headers.set('X-RateLimit-Reset', String(entry.resetTime))
    
    await next()
  }
}
