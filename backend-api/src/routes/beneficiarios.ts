import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createBeneficiarioSchema, updateBeneficiarioSchema, asignarCadenasSchema } from '../validators/beneficiario.validator'
import { beneficiarioRepository } from '../repositories/beneficiario.repository'
import { cadenaRepository } from '../repositories/cadena.repository'
import { tecnicoRepository } from '../repositories/tecnico.repository'
import { localidadRepository } from '../repositories/localidad.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdminOrCoordinator } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const { page, q, tecnico_id, limit } = c.req.query()
  
  const { data, total } = await beneficiarioRepository.findAll({
    page: page ? parseInt(page) : undefined,
    q: q || undefined,
    tecnicoId: tecnico_id,
    limit: limit ? parseInt(limit) : undefined,
  })
  
  return c.json(data.map(b => ({
    id: b.id,
    tecnicoId: b.tecnicoId,
    nombre: b.nombre,
    municipio: b.municipio,
    localidad: b.localidad,
    localidadId: b.localidadId,
    direccion: b.direccion,
    cp: b.cp,
    telefonoPrincipal: b.telefonoPrincipal,
    telefonoSecundario: b.telefonoSecundario,
    coordParcela: b.coordParcela,
    activo: b.activo,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  })))
})

app.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  
  const beneficiario = await beneficiarioRepository.findByIdWithRelations(id)
  if (!beneficiario) {
    return c.json({ error: 'Beneficiario no encontrado' }, 404)
  }
  
  return c.json({
    id: beneficiario.id,
    tecnicoId: beneficiario.tecnicoId,
    nombre: beneficiario.nombre,
    municipio: beneficiario.municipio,
    localidad: beneficiario.localidad,
    localidadId: beneficiario.localidadId,
    direccion: beneficiario.direccion,
    cp: beneficiario.cp,
    telefonoPrincipal: beneficiario.telefonoPrincipal,
    telefonoSecundario: beneficiario.telefonoSecundario,
    coordParcela: beneficiario.coordParcela,
    activo: beneficiario.activo,
    cadenas: beneficiario.cadenas,
    documentos: beneficiario.documentos,
  })
})

app.post('/', authMiddleware, requireAdminOrCoordinator(), zValidator('json', createBeneficiarioSchema), async (c) => {
  const data = c.req.valid('json')
  
  if (data.localidadId) {
    const localidad = await localidadRepository.findById(data.localidadId)
    if (!localidad || !localidad.activo) {
      return c.json({ error: 'Localidad no encontrada o inactiva' }, 400)
    }
  }
  
  const tecnico = await tecnicoRepository.findById(data.tecnicoId)
  if (!tecnico || !tecnico.activo) {
    return c.json({ error: 'Técnico no encontrado o inactivo' }, 400)
  }
  
  const user = getUserFromContext(c)
  if (user?.rol === 'coordinador' && tecnico.coordinadorId !== user.id) {
    return c.json({ error: 'Sin permisos para asignar este técnico' }, 403)
  }
  
  const beneficiario = await beneficiarioRepository.create(data)
  
  return c.json({
    id: beneficiario.id,
    tecnicoId: beneficiario.tecnicoId,
    nombre: beneficiario.nombre,
    municipio: beneficiario.municipio,
    localidad: beneficiario.localidad,
    localidadId: beneficiario.localidadId,
    activo: beneficiario.activo,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdminOrCoordinator(), zValidator('json', updateBeneficiarioSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await beneficiarioRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Beneficiario no encontrado' }, 404)
  }
  
  const updated = await beneficiarioRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    nombre: updated?.nombre,
  })
})

app.delete('/:id', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await beneficiarioRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Beneficiario no encontrado' }, 404)
  }
  
  await beneficiarioRepository.softDelete(id)
  
  return c.json({ message: 'Beneficiario desactivado' })
})

app.post('/:id/cadenas', authMiddleware, requireAdmin(), zValidator('json', asignarCadenasSchema), async (c) => {
  const id = c.req.param('id')
  const { cadenaIds } = c.req.valid('json')
  
  const beneficiario = await beneficiarioRepository.findById(id)
  if (!beneficiario) {
    return c.json({ error: 'Beneficiario no encontrado' }, 404)
  }
  
  for (const cadenaId of cadenaIds) {
    const cadena = await cadenaRepository.findById(cadenaId)
    if (!cadena || !cadena.activo) {
      return c.json({ error: 'Una o más cadenas no existen o están inactivas' }, 400)
    }
  }
  
  await beneficiarioRepository.asignarCadenas(id, cadenaIds)
  
  return c.json({ message: 'Cadenas actualizadas' })
})

app.get('/:id/documentos', authMiddleware, async (c) => {
  const id = c.req.param('id')
  
  const beneficiario = await beneficiarioRepository.findByIdWithRelations(id)
  if (!beneficiario) {
    return c.json({ error: 'Beneficiario no encontrado' }, 404)
  }
  
  return c.json(beneficiario.documentos)
})

export default app