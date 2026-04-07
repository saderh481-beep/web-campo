import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { 
  createAsignacionCoordinadorTecnicoSchema, 
  updateAsignacionCoordinadorTecnicoSchema,
  createAsignacionBeneficiarioSchema,
  createAsignacionActividadSchema
} from '../validators/asignacion.validator'
import { asignacionRepository } from '../repositories/asignacion.repository'
import { tecnicoRepository } from '../repositories/tecnico.repository'
import { beneficiarioRepository } from '../repositories/beneficiario.repository'
import { actividadRepository } from '../repositories/actividad.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdmin, requireAdminOrCoordinator } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

const coordinadorTecnicoApp = new Hono()

coordinadorTecnicoApp.get('/', authMiddleware, requireAdmin(), async (c) => {
  const { tecnico_id } = c.req.query()
  
  const asignaciones = await asignacionRepository.findCoordinadorTecnico({
    tecnicoId: tecnico_id,
    activo: true,
  })
  
  return c.json(asignaciones)
})

coordinadorTecnicoApp.get('/:tecnico_id', authMiddleware, async (c) => {
  const tecnicoId = c.req.param('tecnico_id')
  
  const asignaciones = await asignacionRepository.findCoordinadorTecnico({
    tecnicoId,
    activo: true,
  })
  
  if (asignaciones.length === 0) {
    return c.json({ error: 'Asignación no encontrada' }, 404)
  }
  
  return c.json(asignaciones[0])
})

coordinadorTecnicoApp.post('/', authMiddleware, requireAdmin(), zValidator('json', createAsignacionCoordinadorTecnicoSchema), async (c) => {
  const data = c.req.valid('json')
  
  const tecnico = await tecnicoRepository.findById(data.tecnicoId)
  if (!tecnico) {
    return c.json({ error: 'Técnico no encontrado' }, 404)
  }
  
  const asignacion = await asignacionRepository.createCoordinadorTecnico(data)
  
  return c.json({
    id: asignacion.id,
    tecnicoId: asignacion.tecnicoId,
    coordinadorId: asignacion.coordinadorId,
    fechaLimite: asignacion.fechaLimite,
    estadoCorte: asignacion.estadoCorte,
    activo: asignacion.activo,
  }, 201)
})

coordinadorTecnicoApp.patch('/:tecnico_id', authMiddleware, requireAdmin(), zValidator('json', updateAsignacionCoordinadorTecnicoSchema), async (c) => {
  const tecnicoId = c.req.param('tecnico_id')
  const data = c.req.valid('json')
  
  const updated = await asignacionRepository.updateCoordinadorTecnico(tecnicoId, data)
  
  if (!updated) {
    return c.json({ error: 'Asignación no encontrada' }, 404)
  }
  
  return c.json({
    id: updated.id,
    tecnicoId: updated.tecnicoId,
    coordinadorId: updated.coordinadorId,
    activo: updated.activo,
  })
})

coordinadorTecnicoApp.delete('/:tecnico_id', authMiddleware, requireAdmin(), async (c) => {
  const tecnicoId = c.req.param('tecnico_id')
  
  await asignacionRepository.deleteCoordinadorTecnico(tecnicoId)
  
  return c.json({ message: 'Asignación eliminada' })
})

const beneficiarioApp = new Hono()

beneficiarioApp.get('/', authMiddleware, requireAdmin(), async (c) => {
  const { tecnico_id, beneficiario_id, activo } = c.req.query()
  
  const asignaciones = await asignacionRepository.findBeneficiario({
    tecnicoId: tecnico_id,
    beneficiarioId: beneficiario_id,
    activo: activo === 'true' ? true : undefined,
  })
  
  return c.json(asignaciones)
})

beneficiarioApp.post('/', authMiddleware, requireAdmin(), zValidator('json', createAsignacionBeneficiarioSchema), async (c) => {
  const user = getUserFromContext(c)
  const data = c.req.valid('json')
  
  const tecnico = await tecnicoRepository.findById(data.tecnicoId)
  if (!tecnico) {
    return c.json({ error: 'Técnico inválido' }, 400)
  }
  
  const beneficiario = await beneficiarioRepository.findById(data.beneficiarioId)
  if (!beneficiario) {
    return c.json({ error: 'Beneficiario no encontrado' }, 404)
  }
  
  const asignacion = await asignacionRepository.createBeneficiario({
    ...data,
    asignadoPor: user?.id || '',
  })
  
  return c.json({
    id: asignacion.id,
    tecnicoId: asignacion.tecnicoId,
    beneficiarioId: asignacion.beneficiarioId,
    asignadoPor: asignacion.asignadoPor,
    asignadoEn: asignacion.asignadoEn,
    activo: asignacion.activo,
  }, 201)
})

beneficiarioApp.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  await asignacionRepository.deleteBeneficiario(id)
  
  return c.json({ message: 'Asignación eliminada' })
})

const actividadApp = new Hono()

actividadApp.get('/', authMiddleware, requireAdmin(), async (c) => {
  const { tecnico_id, actividad_id, activo } = c.req.query()
  
  const asignaciones = await asignacionRepository.findActividad({
    tecnicoId: tecnico_id,
    actividadId: actividad_id,
    activo: activo === 'true' ? true : undefined,
  })
  
  return c.json(asignaciones)
})

actividadApp.post('/', authMiddleware, requireAdmin(), zValidator('json', createAsignacionActividadSchema), async (c) => {
  const user = getUserFromContext(c)
  const data = c.req.valid('json')
  
  const actividad = await actividadRepository.findById(data.actividadId)
  if (!actividad) {
    return c.json({ error: 'Actividad no encontrada' }, 404)
  }
  
  const asignacion = await asignacionRepository.createActividad({
    ...data,
    asignadoPor: user?.id || '',
  })
  
  return c.json({
    id: asignacion.id,
    tecnicoId: asignacion.tecnicoId,
    actividadId: asignacion.actividadId,
    asignadoPor: asignacion.asignadoPor,
    asignadoEn: asignacion.asignadoEn,
    activo: asignacion.activo,
  }, 201)
})

actividadApp.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  await asignacionRepository.deleteActividad(id)
  
  return c.json({ message: 'Asignación eliminada' })
})

app.route('/coordinador-tecnico', coordinadorTecnicoApp)
app.route('/beneficiario', beneficiarioApp)
app.route('/actividad', actividadApp)

export default app