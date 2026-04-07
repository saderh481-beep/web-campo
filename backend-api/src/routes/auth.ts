import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { sign } from 'hono/jwt'
import { loginSchema } from '../validators/usuario.validator'
import { env } from '../config/env'
import { usuarioRepository } from '../repositories/usuario.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.options('*', async (c) => {
  return c.text('', 204)
})

app.use('*', jwt({ secret: env.JWT_SECRET, cookie: 'token' }))

app.post('/verify-codigo-acceso', zValidator('json', loginSchema), async (c) => {
  const { correo, codigoAcceso } = c.req.valid('json')
  
  const usuario = await usuarioRepository.findByCorreoWithInactive(correo)
  
  if (!usuario || !usuario.activo) {
    return c.json({ error: 'Credenciales inválidas' }, 401)
  }
  
  if (usuario.codigoAcceso !== codigoAcceso) {
    return c.json({ error: 'Credenciales inválidas' }, 401)
  }
  
  const payload = {
    sub: usuario.id,
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol: usuario.rol,
  }
  
  const token = await sign(payload, env.JWT_SECRET, { expiresIn: '24h' })
  
  return c.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  })
})

app.post('/logout', authMiddleware, async (c) => {
  return c.json({ message: 'Sesión cerrada' })
})

app.get('/me', authMiddleware, async (c) => {
  const user = getUserFromContext(c)
  if (!user) {
    return c.json({ error: 'No autorizado' }, 401)
  }
  
  const usuario = await usuarioRepository.findById(user.id)
  if (!usuario) {
    return c.json({ error: 'Usuario no encontrado' }, 404)
  }
  
  return c.json({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  })
})

export default app