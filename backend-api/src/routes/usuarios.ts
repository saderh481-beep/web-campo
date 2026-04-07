import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createUsuarioSchema, updateUsuarioSchema } from '../validators/usuario.validator'
import { usuarioRepository } from '../repositories/usuario.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'
import { nanoid } from 'nanoid'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, async (c) => {
  const usuarios = await usuarioRepository.findAll()
  
  return c.json(usuarios.map(u => ({
    id: u.id,
    correo: u.correo,
    nombre: u.nombre,
    rol: u.rol,
    ativo: u.activo,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  })))
})

app.post('/', authMiddleware, requireAdmin(), zValidator('json', createUsuarioSchema), async (c) => {
  const data = c.req.valid('json')
  
  const existing = await usuarioRepository.findByCorreo(data.correo)
  if (existing) {
    return c.json({ error: 'El correo ya está registrado' }, 409)
  }
  
  const codigo = nanoid(6).replace(/\D/g, '').slice(0, 6)
  
  const usuario = await usuarioRepository.create({
    ...data,
    codigoAcceso: codigo,
  })
  
  return c.json({
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol: usuario.rol,
    activo: usuario.activo,
    codigo,
  }, 201)
})

app.patch('/:id', authMiddleware, requireAdmin(), zValidator('json', updateUsuarioSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  
  const existing = await usuarioRepository.findByIdWithInactive(id)
  if (!existing) {
    return c.json({ error: 'Usuario no encontrado' }, 404)
  }
  
  if (data.correo && data.correo !== existing.correo) {
    const existingCorreo = await usuarioRepository.findByCorreo(data.correo)
    if (existingCorreo) {
      return c.json({ error: 'El correo ya está registrado' }, 409)
    }
  }
  
  const updated = await usuarioRepository.update(id, data)
  
  return c.json({
    id: updated?.id,
    correo: updated?.correo,
    nombre: updated?.nombre,
    rol: updated?.rol,
    activo: updated?.activo,
  })
})

app.delete('/:id', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await usuarioRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Usuario no encontrado' }, 404)
  }
  
  await usuarioRepository.softDelete(id)
  
  return c.json({ message: 'Usuario desactivado' })
})

app.delete('/:id/force', authMiddleware, requireAdmin(), async (c) => {
  const id = c.req.param('id')
  
  const existing = await usuarioRepository.findById(id)
  if (!existing) {
    return c.json({ error: 'Usuario no encontrado' }, 404)
  }
  
  await usuarioRepository.hardDelete(id)
  
  return c.json({ message: 'Usuario eliminado' })
})

export default app