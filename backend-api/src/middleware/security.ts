import type { Context, Next } from 'hono'

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    c.res.headers.set('X-Content-Type-Options', 'nosniff')
    c.res.headers.set('X-Frame-Options', 'DENY')
    c.res.headers.set('X-XSS-Protection', '1; mode=block')
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:;"
    )
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    
    await next()
  }
}

export function corsMiddleware(allowedOrigins: string[] = ['*']) {
  return async (c: Context, next: Next) => {
    const origin = c.req.header('origin')
    
    if (allowedOrigins.includes('*')) {
      c.res.headers.set('Access-Control-Allow-Origin', '*')
    } else if (origin && allowedOrigins.includes(origin)) {
      c.res.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    c.res.headers.set('Access-Control-Max-Age', '86400')
    c.res.headers.set('Access-Control-Allow-Credentials', 'true')
    
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204)
    }
    
    await next()
  }
}
