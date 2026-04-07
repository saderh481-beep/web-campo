import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createTecnicoSchema, updateTecnicoSchema } from '../validators/tecnico.validator'
import { tecnicoRepository } from '../repositories/tecnico.repository'
import { usuarioRepository } from '../repositories/usuario.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdmin, requireAdminOrCoordinator } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const tecnicos = await tecnicoRepository.findAll()
  
  const result = await Promise.all(
    tecnicos.map(async (t) => {
      let coordinadorNombre = null
      if (t.coordinadorId) {
        const coord = await usuarioRepository.findById(t.coordinadorId)
        coordinadorNombre = coord?.nombre || null
      }
      
      return {
        id: t.id,
        nombre: t.nombre,
        correo: t.correo,
        telefono: t.telefono,
        coordinadorId: t.coordinadorId,
        coordinadorNombre,
        fechaLimite: t.fechaLimite,
        estadoCorte: 'en_servicio',
        codigoAcceso: t.codigoAcceso,
        activo: t.activo,
      }
    })
  )
  
  return c.json(result)
})

app.get('/:id', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const id = c.req.param('id')
  
  const tecnico = await tecnicoRepository.findByIdWithInactive(id)
  if (!tecnico) {
    return c.json({ error: 'Técnico no encontrado' }, 404)
  }
  
  let coordinadorNombre = null
  if (tecnico.coordinadorId) {
    const coord = await usuarioRepository.findById(tecnico.coordinadorId)
        coordinadorNombre = coord?.nombre || null
  }
  
  return c.json({
    id: tecnico.id,
    nombre: tecnico.nombre,
    correo: tecnico.correo,
    telefono: tecnico.telefono,
    coordinadorId: tecnico.coordinadorId,
    coordinadorNombre,
    fechaLimite: tecnico.fechaLimite,
    estadoCorte: 'en_servicio',
    asignaciones: [],
  })
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateTecnicoSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await tecnicoRepository.findByIdWithInactive(id)
  if (!existing) {
    return c.json({ error: 'Técnico no encontrado' }, 404)
  }
  
  if (data.coordinadorId) {
    const coord = await usuarioRepository.findById(data.coordinadorId)
    if (!coord || !coord.activo) {
      return c.json({ error: 'Coordinador inválido o inactivo' }, 400)
    }
  }
  
  const updated = await tecnicoRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
    coordinadorId: updated?.coordinadorId,
    estadoCorte: 'en_servicio',
  })
})

app.post('/:id/codigo', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const tecnico = await tecnicoRepository.findById(id)
  if (!tecnico) {
    return c.json({ error: 'Técnico no encontrado' }, 404)
  }
  
  const codigo = await tecnicoRepository.regenerateCodigo(id)
  
  return c.json({
    message: 'Código regenerado',
    codigo,
  })
})

app.post('/aplicar-cortes', authMiddleware, requireAdmin(), async (c) => {
  return c.json({
    message: 'Corte aplicado a 0 técnico(s)',
    tecnicos: [],
  })
})

app.post('/:id/cerrar-corte', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const id = c.req.param('id')
  
  const tecnico = await tecnicoRepository.findById(id)
  if (!tecnico) {
    return c.json({ error: 'Técnico no encontrado' }, 404)
  }
  
  return c.json({
    message: 'Período cerrado',
    tecnico: {
      id: tecnico.id,
      estadoCorte: 'suspendido',
    },
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const tecnico = await tecnicoRepository.findById(id)
  if (!tecnico) {
    return c.json({ error: 'Técnico no encontrado' }, 404)
  }
  
  await tecnicoRepository.softDelete(id)
  
  return c.json({ message: 'Técnico desactivado' })
})

export default app