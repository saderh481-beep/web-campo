import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import routes from './routes'
import { env } from './config/env'
import { securityHeaders } from './middleware/security'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.route('/api/v1', routes)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.notFound((c) => {
  return c.json({ error: 'Endpoint no encontrado' }, 404)
})

app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Error interno del servidor' }, 500)
})

const port = env.PORT

console.log(`🚀 Servidor corriendo en http://localhost:${port}`)
console.log(`📡 API disponible en http://localhost:${port}/api/v1`)

serve({
  fetch: app.fetch,
  port,
})

export default app