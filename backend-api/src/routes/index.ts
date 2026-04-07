import { Hono } from 'hono'
import authRoutes from './auth'
import usuariosRoutes from './usuarios'
import tecnicosRoutes from './tecnicos'
import beneficiariosRoutes from './beneficiarios'
import cadenasRoutes from './cadenas'
import actividadesRoutes from './actividades'
import localidadesRoutes from './localidades'
import zonasRoutes from './zonas'
import asignacionesRoutes from './asignaciones'
import bitacorasRoutes from './bitacoras'
import configuracionesRoutes from './configuraciones'
import documentosPlantillaRoutes from './documentos-plantilla'
import dashboardRoutes from './dashboard'

const app = new Hono()

app.route('/auth', authRoutes)
app.route('/usuarios', usuariosRoutes)
app.route('/tecnicos', tecnicosRoutes)
app.route('/beneficiarios', beneficiariosRoutes)
app.route('/cadenas-productivas', cadenasRoutes)
app.route('/actividades', actividadesRoutes)
app.route('/localidades', localidadesRoutes)
app.route('/zonas', zonasRoutes)
app.route('/asignaciones', asignacionesRoutes)
app.route('/bitacoras', bitacorasRoutes)
app.route('/configuraciones', configuracionesRoutes)
app.route('/documentos-plantilla', documentosPlantillaRoutes)
app.route('/dashboard', dashboardRoutes)

app.get('/', (c) => {
  return c.json({ message: 'Campo API v1', status: 'running' })
})

export default app