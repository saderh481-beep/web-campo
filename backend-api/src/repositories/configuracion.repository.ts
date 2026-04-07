import { eq } from 'drizzle-orm'
import { db } from '../db'
import { configuraciones, type Configuracion } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class ConfiguracionRepository {
  async findAll(): Promise<Configuracion[]> {
    return db.select().from(configuraciones)
  }

  async findByClave(clave: string): Promise<Configuracion | undefined> {
    const result = await db.select().from(configuraciones).where(eq(configuraciones.clave, clave)).limit(1)
    return result[0]
  }

  async upsert(clave: string, valor: string, descripcion?: string, updatedBy?: string): Promise<Configuracion> {
    const now = new Date().toISOString()
    
    const existing = await this.findByClave(clave)
    
    if (existing) {
      const [updated] = await db
        .update(configuraciones)
        .set({
          valor,
          descripcion: descripcion || existing.descripcion,
          updatedBy,
          updatedAt: now,
        })
        .where(eq(configuraciones.clave, clave))
        .returning()
      
      return updated
    }
    
    const [created] = await db
      .insert(configuraciones)
      .values({
        id: uuid(),
        clave,
        valor,
        descripcion,
        updatedBy,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async getFechaCorteGlobal(): Promise<string | null> {
    const config = await this.findByClave('fecha_corte_global')
    if (!config) return null
    
    try {
      const parsed = JSON.parse(config.valor)
      return parsed.fecha || null
    } catch {
      return null
    }
  }
}

export const configuracionRepository = new ConfiguracionRepository()