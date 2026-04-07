import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { localidades, type Localidad } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class LocalidadRepository {
  async findAll(includeInactive = false): Promise<Localidad[]> {
    if (includeInactive) {
      return db.select().from(localidades).orderBy(desc(localidades.createdAt))
    }
    return db.select().from(localidades).where(eq(localidades.activo, true)).orderBy(desc(localidades.createdAt))
  }

  async findById(id: string): Promise<Localidad | undefined> {
    const result = await db.select().from(localidades).where(eq(localidades.id, id)).limit(1)
    return result[0]
  }

  async findByZona(zonaId: string): Promise<Localidad[]> {
    return db
      .select()
      .from(localidades)
      .where(and(eq(localidades.zonaId, zonaId), eq(localidades.activo, true)))
      .orderBy(localidades.nombre)
  }

  async create(data: { municipio: string; nombre: string; cp?: string; zonaId?: string }): Promise<Localidad> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(localidades)
      .values({
        id,
        municipio: data.municipio,
        nombre: data.nombre,
        cp: data.cp,
        zonaId: data.zonaId,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async update(id: string, data: Partial<{
    municipio: string
    nombre: string
    cp: string | null
    zonaId: string | null
    activo: boolean
  }>): Promise<Localidad | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(localidades)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(localidades.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(localidades)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(localidades.id, id))
    
    return true
  }
}

export const localidadRepository = new LocalidadRepository()