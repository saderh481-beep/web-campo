import { eq, and, desc, like, sql } from 'drizzle-orm'
import { db } from '../db'
import { 
  bitacoras,
  usuarios,
  tecnicos,
  beneficiarios,
  cadenasProductivas,
  actividades,
  type Bitacora
} from '../db/schema'
import { v4 as uuid } from 'uuid'

export class BitacoraRepository {
  async findAll(params?: {
    tecnicoId?: string
    mes?: number
    anio?: number
    estado?: string
    tipo?: string
  }): Promise<{
    id: string
    tipo: string
    estado: string
    fechaInicio: string
    fechaFin: string | null
    tecnicoNombre: string
    beneficiarioNombre: string | null
    cadenaNombre: string | null
    actividadNombre: string | null
  }[]> {
    const conditions = []
    
    if (params?.tecnicoId) {
      conditions.push(eq(bitacoras.tecnicoId, params.tecnicoId))
    }
    if (params?.estado) {
      conditions.push(eq(bitacoras.estado, params.estado))
    }
    if (params?.tipo) {
      conditions.push(eq(bitacoras.tipo, params.tipo))
    }
    if (params?.mes && params?.anio) {
      const startDate = `${params.anio}-${String(params.mes).padStart(2, '0')}-01`
      const endDate = params.mes === 12 
        ? `${params.anio + 1}-01-01`
        : `${params.anio}-${String(params.mes + 1).padStart(2, '0')}-01`
      conditions.push(sql`${bitacoras.fechaInicio} >= ${startDate} AND ${bitacoras.fechaInicio} < ${endDate}`)
    }
    
    const where = conditions.length > 1 ? and(...conditions) : conditions[0]
    
    const result = await db
      .select()
      .from(bitacoras)
      .where(where)
      .orderBy(desc(bitacoras.fechaInicio))
    
    const enriched = await Promise.all(
      result.map(async (r) => {
        const [tec, ben, cad, act] = await Promise.all([
          db.select({ nombre: tecnicos.nombre }).from(tecnicos).where(eq(tecnicos.id, r.tecnicoId)).limit(1),
          r.beneficiarioId 
            ? db.select({ nombre: beneficiarios.nombre }).from(beneficiarios).where(eq(beneficiarios.id, r.beneficiarioId)).limit(1)
            : Promise.resolve([]),
          r.cadenaProductivaId
            ? db.select({ nombre: cadenasProductivas.nombre }).from(cadenasProductivas).where(eq(cadenasProductivas.id, r.cadenaProductivaId)).limit(1)
            : Promise.resolve([]),
          r.actividadId
            ? db.select({ nombre: actividades.nombre }).from(actividades).where(eq(actividades.id, r.actividadId)).limit(1)
            : Promise.resolve([]),
        ])
        return {
          id: r.id,
          tipo: r.tipo,
          estado: r.estado,
          fechaInicio: r.fechaInicio,
          fechaFin: r.fechaFin,
          tecnicoNombre: tec[0]?.nombre || '',
          beneficiarioNombre: ben[0]?.nombre || null,
          cadenaNombre: cad[0]?.nombre || null,
          actividadNombre: act[0]?.nombre || null,
        }
      })
    )
    
    return enriched
  }

  async findById(id: string): Promise<Bitacora | undefined> {
    const result = await db.select().from(bitacoras).where(eq(bitacoras.id, id)).limit(1)
    return result[0]
  }

  async create(data: {
    tipo: string
    tecnicoId: string
    beneficiarioId?: string
    cadenaProductivaId?: string
    actividadId?: string
    fechaInicio: string
    fechaFin?: string
    actividadesDesc?: string
    recomendaciones?: string
    comentariosBeneficiario?: string
    coordinacionInterinst?: boolean
  }): Promise<Bitacora> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(bitacoras)
      .values({
        id,
        tipo: data.tipo,
        tecnicoId: data.tecnicoId,
        beneficiarioId: data.beneficiarioId,
        cadenaProductivaId: data.cadenaProductivaId,
        actividadId: data.actividadId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        actividadesDesc: data.actividadesDesc,
        recomendaciones: data.recomendaciones,
        comentariosBeneficiario: data.comentariosBeneficiario,
        coordinacionInterinst: data.coordinacionInterinst ? 1 : 0,
        estado: 'borrador',
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async update(id: string, data: Partial<{
    tipo: string
    beneficiarioId: string | null
    cadenaProductivaId: string | null
    actividadId: string | null
    fechaInicio: string | null
    fechaFin: string | null
    actividadesDesc: string | null
    recomendaciones: string | null
    comentariosBeneficiario: string | null
    coordinacionInterinst: boolean | null
    observacionesCoordinador: string | null
    estado: string
  }>): Promise<Bitacora | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(bitacoras)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(bitacoras.id, id))
      .returning()
    
    return updated
  }
}

export const bitacoraRepository = new BitacoraRepository()