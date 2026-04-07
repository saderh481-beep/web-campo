import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCadenaSchema, updateCadenaSchema } from '../validators/cadena.validator'
import { cadenaRepository } from '../repositories/cadena.repository'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, async (c) => {
  const cadenas = await cadenaRepository.findAll()
  
  return c.json(cadenas.map(c => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    activo: c.activo,
    createdAt: c.createdAt,
  })))
})

app.post('/', authMiddleware, requireAdmin(), zValidator('json', createCadenaSchema), async (c) => {
  const data = c.req.valid('json')
  
  const cadena = await cadenaRepository.create(data)
  
  return c.json({
    id: cadena.id,
    nombre: cadena.nombre,
    descripcion: cadena.descripcion,
    activo: cadena.activo,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateCadenaSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await cadenaRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Cadena no encontrada' }, 404)
  }
  
  const updated = await cadenaRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
    descripcion: updated?.descripcion,
    activo: updated?.activo,
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await cadenaRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Cadena no encontrada' }, 404)
  }
  
  await cadenaRepository.softDelete(id)
  
  return c.json({ message: 'Cadena desactivada' })
})

export default app