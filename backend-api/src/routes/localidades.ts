import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createLocalidadSchema, updateLocalidadSchema } from '../validators/localidad.validator'
import { localidadRepository } from '../repositories/localidad.repository'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, async (c) => {
  const localidades = await localidadRepository.findAll()
  
  return c.json(localidades.map(l => ({
    id: l.id,
    municipio: l.municipio,
    nombre: l.nombre,
    cp: l.cp,
    activo: l.activo,
    zonaId: l.zonaId,
  })))
})

app.post('/', authMiddleware, requireAdmin(), zValidator('json', createLocalidadSchema), async (c) => {
  const data = c.req.valid('json')
  
  const localidad = await localidadRepository.create(data)
  
  return c.json({
    id: localidad.id,
    municipio: localidad.municipio,
    nombre: localidad.nombre,
    cp: localidad.cp,
    activo: localidad.activo,
    zonaId: localidad.zonaId,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateLocalidadSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await localidadRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Localidad no encontrada' }, 404)
  }
  
  const updated = await localidadRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await localidadRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Localidad no encontrada' }, 404)
  }
  
  await localidadRepository.softDelete(id)
  
  return c.json({ message: 'Localidad desactivada' })
})

export default app
