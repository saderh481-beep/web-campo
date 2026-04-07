import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { tecnicos, usuarios, type Tecnico } from '../db/schema'
import { v4 as uuid } from 'uuid'
import { nanoid } from 'nanoid'

export class TecnicoRepository {
  async findAll(includeInactive = false): Promise<Tecnico[]> {
    const condition = includeInactive 
      ? undefined 
      : eq(tecnicos.activo, true)
    
    if (condition) {
      return db.select().from(tecnicos).where(condition).orderBy(desc(tecnicos.createdAt))
    }
    return db.select().from(tecnicos).orderBy(desc(tecnicos.createdAt))
  }

  async findById(id: string): Promise<Tecnico | undefined> {
    const result = await db.select().from(tecnicos).where(eq(tecnicos.id, id)).limit(1)
    return result[0]
  }

  async findByIdWithInactive(id: string): Promise<Tecnico | undefined> {
    const result = await db.select().from(tecnicos).where(eq(tecnicos.id, id)).limit(1)
    return result[0]
  }

  async findByCoordinador(coordinadorId: string): Promise<Tecnico[]> {
    return db
      .select()
      .from(tecnicos)
      .where(and(eq(tecnicos.coordinadorId, coordinadorId), eq(tecnicos.activo, true)))
      .orderBy(desc(tecnicos.createdAt))
  }

  async create(data: {
    nombre: string
    correo?: string
    telefono?: string
    coordinadorId?: string
    fechaLimite?: string
  }): Promise<Tecnico> {
    const now = new Date().toISOString()
    const id = uuid()
    const codigoAcceso = nanoid(6).replace(/\D/g, '').slice(0, 6)
    
    const [created] = await db
      .insert(tecnicos)
      .values({
        id,
        nombre: data.nombre,
        correo: data.correo?.toLowerCase(),
        telefono: data.telefono,
        coordinadorId: data.coordinadorId,
        fechaLimite: data.fechaLimite,
        codigoAcceso,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async update(id: string, data: Partial<{
    nombre: string
    correo: string | null
    telefono: string | null
    coordinadorId: string | null
    fechaLimite: string | null
    activo: boolean
  }>): Promise<Tecnico | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(tecnicos)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(tecnicos.id, id))
      .returning()
    
    return updated
  }

  async regenerateCodigo(id: string): Promise<string> {
    const codigoAcceso = nanoid(6).replace(/\D/g, '').slice(0, 6)
    const now = new Date().toISOString()
    
    await db
      .update(tecnicos)
      .set({
        codigoAcceso,
        updatedAt: now,
      })
      .where(eq(tecnicos.id, id))
    
    return codigoAcceso
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(tecnicos)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(tecnicos.id, id))
    
    return true
  }

  async getCoordinadorNombre(coordinadorId: string): Promise<string | null> {
    const rows = await db
      .select({ nombre: usuarios.nombre })
      .from(usuarios)
      .where(eq(usuarios.id, coordinatorId))
      .limit(1)
    return rows[0]?.nombre || null
  }

  async findAllWithCoordinador(): Promise<(Tecnico & { coordinadorNombre: string | null })[]> {
    const all = await db.select().from(tecnicos).where(eq(tecnicos.activo, true))
    return all as never
  }

  async findVencidos(fechaCorte: string): Promise<Tecnico[]> {
    return db
      .select()
      .from(tecnicos)
      .where(
        and(
          eq(tecnicos.activo, true)
        )
      )
  }
}

export const tecnicoRepository = new TecnicoRepository()