import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { tecnicos, beneficiarios, bitacoras, usuarios } from '../db/schema'
import { authMiddleware, getUserFromContext } from '../middleware/auth'
import { requireAdmin, requireAdminOrCoordinator } from '../middleware/rbac'
import { securityHeaders, corsMiddleware } from '../middleware/security'
import { rateLimiter } from '../middleware/rate-limit'

const app = new Hono()

app.use('*', securityHeaders())
app.use('*', corsMiddleware(['*']))
app.use('*', rateLimiter())

app.get('/', authMiddleware, requireAdminOrCoordinator(), async (c) => {
  const user = getUserFromContext(c)
  
  const [totalTecnicos, tecnicosActivos, tecnicosSuspendidos, totalBeneficiarios, beneficiariosActivos] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(tecnicos),
    db.select({ count: sql<number>`COUNT(*)` }).from(tecnicos).where(eq(tecnicos.activo, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(tecnicos).where(eq(tecnicos.activo, false)),
    db.select({ count: sql<number>`COUNT(*)` }).from(beneficiarios),
    db.select({ count: sql<number>`COUNT(*)` }).from(beneficiarios).where(eq(beneficiarios.activo, true)),
  ])
  
  const currentMonth = new Date()
  const mes = currentMonth.getMonth() + 1
  const anio = currentMonth.getFullYear()
  const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`
  const endDate = mes === 12 
    ? `${anio + 1}-01-01`
    : `${anio}-${String(mes + 1).padStart(2, '0')}-01`
  
  const [bitacorasMes, bitacorasPendientes] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bitacoras)
      .where(sql`${bitacoras.fechaInicio} >= ${startDate} AND ${bitacoras.fechaInicio} < ${endDate}`),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bitacoras)
      .where(eq(bitacoras.estado, 'borrador')),
  ])
  
  return c.json({
    totalTecnicos: totalTecnicos[0]?.count || 0,
    tecnicosActivos: tecnicosActivos[0]?.count || 0,
    tecnicosSuspendidos: tecnicosSuspendidos[0]?.count || 0,
    totalBeneficiarios: totalBeneficiarios[0]?.count || 0,
    beneficiariosActivos: beneficiariosActivos[0]?.count || 0,
    bitacorasMes: bitacorasMes[0]?.count || 0,
    bitacorasPendientes: bitacorasPendientes[0]?.count || 0,
  })
})

export default app