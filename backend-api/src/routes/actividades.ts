import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createActividadSchema, updateActividadSchema } from '../validators/actividad.validator'
import { actividadRepository } from '../repositories/actividad.repository'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, async (c) => {
  const actividades = await actividadRepository.findAll()
  
  return c.json(actividades.map(a => ({
    id: a.id,
    nombre: a.nombre,
    descripcion: a.descripcion,
    activo: a.activo,
  })))
})

app.post('/', authMiddleware, requireAdmin(), zValidator('json', createActividadSchema), async (c) => {
  const data = c.req.valid('json')
  
  const actividad = await actividadRepository.create(data)
  
  return c.json({
    id: actividad.id,
    nombre: actividad.nombre,
    descripcion: actividad.descripcion,
    activo: actividad.activo,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateActividadSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await actividadRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Actividad no encontrada' }, 404)
  }
  
  const updated = await actividadRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
    descripcion: updated?.descripcion,
    activo: updated?.activo,
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await actividadRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Actividad no encontrada' }, 404)
  }
  
  await actividadRepository.softDelete(id)
  
  return c.json({ message: 'Actividad desactivada' })
})

export default app