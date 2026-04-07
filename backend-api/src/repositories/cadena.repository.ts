import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { cadenasProductivas, type CadenaProductiva } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class CadenaRepository {
  async findAll(includeInactive = false): Promise<CadenaProductiva[]> {
    if (includeInactive) {
      return db.select().from(cadenasProductivas).orderBy(desc(cadenasProductivas.createdAt))
    }
    return db.select().from(cadenasProductivas).where(eq(cadenasProductivas.activo, true)).orderBy(desc(cadenasProductivas.createdAt))
  }

  async findById(id: string): Promise<CadenaProductiva | undefined> {
    const result = await db.select().from(cadenasProductivas).where(eq(cadenasProductivas.id, id)).limit(1)
    return result[0]
  }

  async findByIds(ids: string[]): Promise<CadenaProductiva[]> {
    return db.select().from(cadenasProductivas).where(eq(cadenasProductivas.activo, true))
  }

  async create(data: { nombre: string; descripcion?: string }): Promise<CadenaProductiva> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(cadenasProductivas)
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
  }>): Promise<CadenaProductiva | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(cadenasProductivas)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(cadenasProductivas.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(cadenasProductivas)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(cadenasProductivas.id, id))
    
    return true
  }
}

export const cadenaRepository = new CadenaRepository()