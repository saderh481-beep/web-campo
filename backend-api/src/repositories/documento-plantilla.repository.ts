import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { documentosPlantilla, type DocumentoPlantilla } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class DocumentoPlantillaRepository {
  async findAll(includeInactive = false): Promise<DocumentoPlantilla[]> {
    if (includeInactive) {
      return db.select().from(documentosPlantilla).orderBy(documentosPlantilla.orden)
    }
    return db.select().from(documentosPlantilla).where(eq(documentosPlantilla.activo, true)).orderBy(documentosPlantilla.orden)
  }

  async findActivos(): Promise<DocumentoPlantilla[]> {
    return db.select().from(documentosPlantilla).where(eq(documentosPlantilla.activo, true)).orderBy(documentosPlantilla.orden)
  }

  async findById(id: string): Promise<DocumentoPlantilla | undefined> {
    const result = await db.select().from(documentosPlantilla).where(eq(documentosPlantilla.id, id)).limit(1)
    return result[0]
  }

  async create(data: {
    nombre: string
    descripcion?: string
    tipo: string
    obligatorio?: boolean
    orden?: number
    configuracion?: Record<string, unknown>
  }): Promise<DocumentoPlantilla> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(documentosPlantilla)
      .values({
        id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        obligatorio: data.obligatorio || false,
        orden: data.orden || 0,
        configuracion: data.configuracion ? JSON.stringify(data.configuracion) : null,
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
    tipo: string
    obligatorio: boolean
    orden: number
    configuracion: Record<string, unknown> | null
    activo: boolean
  }>): Promise<DocumentoPlantilla | undefined> {
    const now = new Date().toISOString()
    
    const updateData: Record<string, unknown> = { ...data, updatedAt: now }
    if (data.configuracion) {
      updateData.configuracion = JSON.stringify(data.configuracion)
    }
    
    const [updated] = await db
      .update(documentosPlantilla)
      .set(updateData)
      .where(eq(documentosPlantilla.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(documentosPlantilla)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(documentosPlantilla.id, id))
    
    return true
  }
}

export const documentoPlantillaRepository = new DocumentoPlantillaRepository()