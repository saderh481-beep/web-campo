import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { 
  asignacionesCoordinadorTecnico,
  asignacionesBeneficiario,
  asignacionesActividad,
  usuarios,
  tecnicos,
  beneficiarios,
  actividades,
  type AsignacionCoordinadorTecnico,
  type AsignacionBeneficiario,
  type AsignacionActividad
} from '../db/schema'
import { v4 as uuid } from 'uuid'

export class AsignacionRepository {
  async findCoordinadorTecnico(params?: { tecnicoId?: string; activo?: boolean }): Promise<{
    id: string
    coordinadorId: string
    coordinadorNombre: string
    tecnicoId: string
    tecnicoNombre: string
    fechaLimite: string | null
    estadoCorte: string
    activo: boolean
  }[]> {
    const conditions = []
    
    if (params?.tecnicoId) {
      conditions.push(eq(asignacionesCoordinadorTecnico.tecnicoId, params.tecnicoId))
    }
    if (params?.activo !== undefined) {
      conditions.push(eq(asignacionesCoordinadorTecnico.activo, params.activo))
    }
    
    const where = conditions.length > 1 ? and(...conditions) : conditions[0]
    
    const result = await db
      .select()
      .from(asignacionesCoordinadorTecnico)
      .where(where)
      .orderBy(desc(asignacionesCoordinadorTecnico.createdAt))
    
    const enriched = await Promise.all(
      result.map(async (r) => {
        const [coord, tec] = await Promise.all([
          db.select({ nombre: usuarios.nombre }).from(usuarios).where(eq(usuarios.id, r.coordinadorId)).limit(1),
          db.select({ nombre: tecnicos.nombre }).from(tecnicos).where(eq(tecnicos.id, r.tecnicoId)).limit(1),
        ])
        return {
          id: r.id,
          coordinadorId: r.coordinadorId,
          coordinadorNombre: coord[0]?.nombre || '',
          tecnicoId: r.tecnicoId,
          tecnicoNombre: tec[0]?.nombre || '',
          fechaLimite: r.fechaLimite,
          estadoCorte: r.estadoCorte,
          activo: r.activo,
        }
      })
    )
    
    return enriched
  }

  async createCoordinadorTecnico(data: {
    tecnicoId: string
    coordinadorId: string
    fechaLimite?: string
  }): Promise<AsignacionCoordinadorTecnico> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(asignacionesCoordinadorTecnico)
      .values({
        id,
        tecnicoId: data.tecnicoId,
        coordinadorId: data.coordinadorId,
        fechaLimite: data.fechaLimite,
        estadoCorte: 'en_servicio',
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async updateCoordinadorTecnico(tecnicoId: string, data: Partial<{
    coordinadorId: string | null
    fechaLimite: string | null
    activo: boolean
  }>): Promise<AsignacionCoordinadorTecnico | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(asignacionesCoordinadorTecnico)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(asignacionesCoordinadorTecnico.tecnicoId, tecnicoId))
      .returning()
    
    return updated
  }

  async deleteCoordinadorTecnico(tecnicoId: string): Promise<boolean> {
    await db
      .delete(asignacionesCoordinadorTecnico)
      .where(eq(asignacionesCoordinadorTecnico.tecnicoId, tecnicoId))
    
    return true
  }

  async findBeneficiario(params?: { tecnicoId?: string; beneficiarioId?: string; activo?: boolean }): Promise<{
    id: string
    tecnicoId: string
    tecnicoNombre: string
    beneficiarioId: string
    beneficiarioNombre: string
    asignadoPor: string
    asignadoEn: string
    activo: boolean
  }[]> {
    const conditions = []
    
    if (params?.tecnicoId) {
      conditions.push(eq(asignacionesBeneficiario.tecnicoId, params.tecnicoId))
    }
    if (params?.beneficiarioId) {
      conditions.push(eq(asignacionesBeneficiario.beneficiarioId, params.beneficiarioId))
    }
    if (params?.activo !== undefined) {
      conditions.push(eq(asignacionesBeneficiario.activo, params.activo))
    }
    
    const where = conditions.length > 1 ? and(...conditions) : conditions[0]
    
    const result = await db
      .select()
      .from(asignacionesBeneficiario)
      .where(where)
      .orderBy(desc(asignacionesBeneficiario.createdAt))
    
    const enriched = await Promise.all(
      result.map(async (r) => {
        const [tec, ben] = await Promise.all([
          db.select({ nombre: tecnicos.nombre }).from(tecnicos).where(eq(tecnicos.id, r.tecnicoId)).limit(1),
          db.select({ nombre: beneficiarios.nombre }).from(beneficiarios).where(eq(beneficiarios.id, r.beneficiarioId)).limit(1),
        ])
        return {
          id: r.id,
          tecnicoId: r.tecnicoId,
          tecnicoNombre: tec[0]?.nombre || '',
          beneficiarioId: r.beneficiarioId,
          beneficiarioNombre: ben[0]?.nombre || '',
          asignadoPor: r.asignadoPor,
          asignadoEn: r.asignadoEn,
          activo: r.activo,
        }
      })
    )
    
    return enriched
  }

  async createBeneficiario(data: {
    tecnicoId: string
    beneficiarioId: string
    asignadoPor: string
  }): Promise<AsignacionBeneficiario> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(asignacionesBeneficiario)
      .values({
        id,
        tecnicoId: data.tecnicoId,
        beneficiarioId: data.beneficiarioId,
        asignadoPor: data.asignadoPor,
        asignadoEn: now,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async updateBeneficiario(id: string, data: Partial<{
    tecnicoId: string | null
    beneficiarioId: string | null
    activo: boolean
  }>): Promise<AsignacionBeneficiario | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(asignacionesBeneficiario)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(asignacionesBeneficiario.id, id))
      .returning()
    
    return updated
  }

  async deleteBeneficiario(id: string): Promise<boolean> {
    await db
      .delete(asignacionesBeneficiario)
      .where(eq(asignacionesBeneficiario.id, id))
    
    return true
  }

  async findActividad(params?: { tecnicoId?: string; actividadId?: string; activo?: boolean }): Promise<{
    id: string
    tecnicoId: string
    tecnicoNombre: string
    actividadId: string
    actividadNombre: string
    asignadoPor: string
    asignadoEn: string
    activo: boolean
  }[]> {
    const conditions = []
    
    if (params?.tecnicoId) {
      conditions.push(eq(asignacionesActividad.tecnicoId, params.tecnicoId))
    }
    if (params?.actividadId) {
      conditions.push(eq(asignacionesActividad.actividadId, params.actividadId))
    }
    if (params?.activo !== undefined) {
      conditions.push(eq(asignacionesActividad.activo, params.activo))
    }
    
    const where = conditions.length > 1 ? and(...conditions) : conditions[0]
    
    const result = await db
      .select()
      .from(asignacionesActividad)
      .where(where)
      .orderBy(desc(asignacionesActividad.createdAt))
    
    const enriched = await Promise.all(
      result.map(async (r) => {
        const [tec, act] = await Promise.all([
          db.select({ nombre: tecnicos.nombre }).from(tecnicos).where(eq(tecnicos.id, r.tecnicoId)).limit(1),
          db.select({ nombre: actividades.nombre }).from(actividades).where(eq(actividades.id, r.actividadId)).limit(1),
        ])
        return {
          id: r.id,
          tecnicoId: r.tecnicoId,
          tecnicoNombre: tec[0]?.nombre || '',
          actividadId: r.actividadId,
          actividadNombre: act[0]?.nombre || '',
          asignadoPor: r.asignadoPor,
          asignadoEn: r.asignadoEn,
          activo: r.activo,
        }
      })
    )
    
    return enriched
  }

  async createActividad(data: {
    tecnicoId: string
    actividadId: string
    asignadoPor: string
  }): Promise<AsignacionActividad> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(asignacionesActividad)
      .values({
        id,
        tecnicoId: data.tecnicoId,
        actividadId: data.actividadId,
        asignadoPor: data.asignadoPor,
        asignadoEn: now,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async updateActividad(id: string, data: Partial<{
    tecnicoId: string | null
    actividadId: string | null
    activo: boolean
  }>): Promise<AsignacionActividad | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(asignacionesActividad)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(asignacionesActividad.id, id))
      .returning()
    
    return updated
  }

  async deleteActividad(id: string): Promise<boolean> {
    await db
      .delete(asignacionesActividad)
      .where(eq(asignacionesActividad.id, id))
    
    return true
  }
}

export const asignacionRepository = new AsignacionRepository()