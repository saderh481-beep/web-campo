import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateConfiguracionSchema } from '../validators/configuracion.validator'
import { configuracionRepository } from '../repositories/configuracion.repository'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, requireAdmin(), async (c) => {
  const configuraciones = await configuracionRepository.findAll()
  
  return c.json(configuraciones.map(config => ({
    id: config.id,
    clave: config.clave,
    valor: JSON.parse(config.valor),
    descripcion: config.descripcion,
  })))
})

app.get('/:clave', authMiddleware, requireAdmin(), async (c) => {
  const clave = c.req.param('clave')
  
  const config = await configuracionRepository.findByClave(clave)
  if (!config) {
    return c.json({ error: 'Configuración no encontrada' }, 404)
  }
  
  return c.json({
    clave: config.clave,
    valor: JSON.parse(config.valor),
  })
})

app.put('/:clave', authMiddleware, requireAdmin(), zValidator('json', updateConfiguracionSchema), async (c) => {
  const clave = c.req.param('clave')
  const { valor } = c.req.valid('json')
  const user = getUserFromContext(c)
  
  const config = await configuracionRepository.upsert(
    clave,
    JSON.stringify(valor),
    undefined,
    user?.id
  )
  
  return c.json({
    clave: config.clave,
    valor: JSON.parse(config.valor),
    updatedBy: config.updatedBy,
  })
})

export default app