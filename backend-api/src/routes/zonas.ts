import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createZonaSchema, updateZonaSchema } from '../validators/zona.validator'
import { zonaRepository } from '../repositories/zona.repository'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, async (c) => {
  const zonas = await zonaRepository.findAll()
  
  return c.json(zonas.map(z => ({
    id: z.id,
    nombre: z.nombre,
    descripcion: z.descripcion,
    activo: z.activo,
  })))
})

app.post('/', authMiddleware, requireAdmin(), zValidator('json', createZonaSchema), async (c) => {
  const data = c.req.valid('json')
  
  const zona = await zonaRepository.create(data)
  
  return c.json({
    id: zona.id,
    nombre: zona.nombre,
    descripcion: zona.descripcion,
    activo: zona.activo,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateZonaSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await zonaRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Zona no encontrada' }, 404)
  }
  
  const updated = await zonaRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
    descripcion: updated?.descripcion,
    activo: updated?.activo,
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await zonaRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Zona no encontrada' }, 404)
  }
  
  await zonaRepository.softDelete(id)
  
  return c.json({ message: 'Zona desactivada' })
})

export default app