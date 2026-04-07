import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { zonas, type Zona } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class ZonaRepository {
  async findAll(includeInactive = false): Promise<Zona[]> {
    if (includeInactive) {
      return db.select().from(zonas).orderBy(desc(zonas.createdAt))
    }
    return db.select().from(zonas).where(eq(zonas.activo, true)).orderBy(desc(zonas.createdAt))
  }

  async findById(id: string): Promise<Zona | undefined> {
    const result = await db.select().from(zonas).where(eq(zonas.id, id)).limit(1)
    return result[0]
  }

  async create(data: { nombre: string; descripcion?: string }): Promise<Zona> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(zonas)
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
  }>): Promise<Zona | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(zonas)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(zonas.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(zonas)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(zonas.id, id))
    
    return true
  }
}

export const zonaRepository = new ZonaRepository()