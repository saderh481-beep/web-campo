import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createBitacoraSchema, updateBitacoraSchema, updatePdfConfigSchema } from '../validators/bitacora.validator'
import { bitacoraRepository } from '../repositories/bitacora.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdmin, requireAdminOrCoordinator } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const { tecnico_id, mes, anio, estado, tipo } = c.req.query()
  
  const bitacoras = await bitacoraRepository.findAll({
    tecnicoId: tecnico_id,
    mes: mes ? parseInt(mes) : undefined,
    anio: anio ? parseInt(anio) : undefined,
    estado: estado || undefined,
    tipo: tipo || undefined,
  })
  
  return c.json(bitacoras)
})

app.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  
  const bitacora = await bitacoraRepository.findById(id)
  if (!bitacora) {
    return c.json({ error: 'Bitácora no encontrada' }, 404)
  }
  
  return c.json({
    id: bitacora.id,
    tipo: bitacora.tipo,
    tecnicoId: bitacora.tecnicoId,
    beneficiarioId: bitacora.beneficiarioId,
    cadenaProductivaId: bitacora.cadenaProductivaId,
    actividadId: bitacora.actividadId,
    fechaInicio: bitacora.fechaInicio,
    fechaFin: bitacora.fechaFin,
    actividadesDesc: bitacora.actividadesDesc,
    recomendaciones: bitacora.recomendaciones,
    comentariosBeneficiario: bitacora.comentariosBeneficiario,
    coordinacionInterinst: bitacora.coordinacionInterinst,
    observacionesCoordinador: bitacora.observacionesCoordinador,
    estado: bitacora.estado,
  })
})

app.patch('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await bitacoraRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Bitácora no encontrada' }, 404)
  }
  
  const updated = await bitacoraRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    observacionesCoordinador: updated?.observacionesCoordinador,
    actividadesDesc: updated?.actividadesDesc,
    updatedAt: updated?.updatedAt,
  })
})

app.patch('/:id/pdf-config', authMiddleware, zValidator('json', updatePdfConfigSchema), async (c) => {
  const id = c.req.param('id')
  const { pdfEdicion } = c.req.valid('json')
  
  const existing = await bitacoraRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Bitácora no encontrada' }, 404)
  }
  
  const updated = await bitacoraRepository.update(id, {
    pdfEdicion: pdfEdicion ? JSON.stringify(pdfEdicion) : null,
  })
  
  return c.json({
    id: updated?.id,
    pdfEdicion: pdfEdicion,
    updatedAt: updated?.updatedAt,
  })
})

app.get('/:id/versiones', authMiddleware, async (c) => {
  return c.json([])
})

export default app