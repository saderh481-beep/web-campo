import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { actividades, type Actividad } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class ActividadRepository {
  async findAll(includeInactive = false): Promise<Actividad[]> {
    if (includeInactive) {
      return db.select().from(actividades).orderBy(desc(actividades.createdAt))
    }
    return db.select().from(actividades).where(eq(actividades.activo, true)).orderBy(desc(actividades.createdAt))
  }

  async findById(id: string): Promise<Actividad | undefined> {
    const result = await db.select().from(actividades).where(eq(actividades.id, id)).limit(1)
    return result[0]
  }

  async create(data: { nombre: string; descripcion?: string }): Promise<Actividad> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(actividades)
      .values({
        id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async update(id: string, data: Partial<{
    nombre: string
    descripcion: string | null
    activo: boolean
  }>): Promise<Actividad | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(actividades)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(actividades.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(actividades)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(actividades.id, id))
    
    return true
  }
}

export const actividadRepository = new ActividadRepository()