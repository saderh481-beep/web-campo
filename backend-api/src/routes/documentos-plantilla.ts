import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createDocumentoPlantillaSchema, updateDocumentoPlantillaSchema } from '../validators/documento-plantilla.validator'
import { documentoPlantillaRepository } from '../repositories/documento-plantilla.repository'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, async (c) => {
  const documentos = await documentoPlantillaRepository.findAll()
  
  return c.json(documentos.map(d => ({
    id: d.id,
    nombre: d.nombre,
    descripcion: d.descripcion,
    obligatorio: d.obligatorio,
    orden: d.orden,
    activo: d.activo,
  })))
})

app.get('/activos', authMiddleware, async (c) => {
  const documentos = await documentoPlantillaRepository.findActivos()
  
  return c.json(documentos.map(d => ({
    id: d.id,
    nombre: d.nombre,
    descripcion: d.descripcion,
    obligatorio: d.obligatorio,
    orden: d.orden,
    activo: d.activo,
  })))
})

app.post('/', authMiddleware, requireAdmin(), zValidator('json', createDocumentoPlantillaSchema), async (c) => {
  const data = c.req.valid('json')
  
  const documento = await documentoPlantillaRepository.create(data)
  
  return c.json({
    id: documento.id,
    nombre: documento.nombre,
    descripcion: documento.descripcion,
    tipo: documento.tipo,
    obligatorio: documento.obligatorio,
    orden: documento.orden,
    activo: documento.activo,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateDocumentoPlantillaSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await documentoPlantillaRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Documento no encontrado' }, 404)
  }
  
  const updated = await documentoPlantillaRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
    obligatorio: updated?.obligatorio,
    orden: updated?.orden,
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await documentoPlantillaRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Documento no encontrado' }, 404)
  }
  
  await documentoPlantillaRepository.softDelete(id)
  
  return c.json({ message: 'Documento plantilla desactivado' })
})

export default app