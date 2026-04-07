import { eq, and, desc, like, sql } from 'drizzle-orm'
import { db } from '../db'
import { 
  beneficiarios, 
  beneficiarioCadenas, 
  documentos,
  type Beneficiario 
} from '../db/schema'
import { v4 as uuid } from 'uuid'

export class BeneficiarioRepository {
  async findAll(params?: {
    tecnicoId?: string
    q?: string
    page?: number
    limit?: number
  }): Promise<{ data: Beneficiario[]; total: number }> {
    const conditions = [eq(beneficiarios.activo, true)]
    
    if (params?.tecnicoId) {
      conditions.push(eq(beneficiarios.tecnicoId, params.tecnicoId))
    }
    
    if (params?.q) {
      conditions.push(
        sql`(${beneficiarios.nombre} LIKE ${'%' + params.q + '%'} OR ${beneficiarios.municipio} LIKE ${'%' + params.q + '%'})`
      )
    }
    
    const where = conditions.length > 1 ? and(...conditions) : conditions[0]
    
    const limit = params?.limit || 50
    const offset = ((params?.page || 1) - 1) * limit
    
    const data = await db
      .select()
      .from(beneficiarios)
      .where(where)
      .orderBy(desc(beneficiarios.createdAt))
      .limit(limit)
      .offset(offset)
    
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(beneficiarios)
      .where(where)
    
    return {
      data,
      total: countResult[0]?.count || 0,
    }
  }

  async findById(id: string): Promise<Beneficiario | undefined> {
    const result = await db.select().from(beneficiarios).where(eq(beneficiarios.id, id)).limit(1)
    return result[0]
  }

  async findByIdWithRelations(id: string): Promise<(Beneficiario & {
    cadenas: { id: string; nombre: string }[]
    documentos: typeof documentos.$inferSelect[]
  }) | undefined> {
    const beneficiario = await db.select().from(beneficiarios).where(eq(beneficiarios.id, id)).limit(1)
    if (!beneficiario[0]) return undefined
    
    const cadenas = await db
      .select({ id: beneficiarioCadenas.cadenaId })
      .from(beneficiarioCadenas)
      .where(eq(beneficiarioCadenas.beneficiarioId, id))
    
    const docs = await db
      .select()
      .from(documentos)
      .where(eq(documentos.beneficiarioId, id))
    
    return {
      ...beneficiario[0],
      cadenas: cadenas as { id: string; nombre: string }[],
      documentos: docs,
    }
  }

  async create(data: {
    nombre: string
    municipio?: string
    localidad?: string
    localidadId?: string
    direccion?: string
    cp?: string
    telefonoPrincipal?: string
    telefonoSecundario?: string
    coordParcela?: string
    tecnicoId: string
  }): Promise<Beneficiario> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(beneficiarios)
      .values({
        id,
        nombre: data.nombre,
        municipio: data.municipio,
        localidad: data.localidad,
        localidadId: data.localidadId,
        direccion: data.direccion,
        cp: data.cp,
        telefonoPrincipal: data.telefonoPrincipal,
        telefonoSecundario: data.telefonoSecundario,
        coordParcela: data.coordParcela,
        tecnicoId: data.tecnicoId,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async update(id: string, data: Partial<{
    nombre: string
    municipio: string | null
    localidad: string | null
    localidadId: string | null
    direccion: string | null
    cp: string | null
    telefonoPrincipal: string | null
    telefonoSecundario: string | null
    coordParcela: string | null
    tecnicoId: string | null
    activo: boolean
  }>): Promise<Beneficiario | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(beneficiarios)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(beneficiarios.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db
      .update(beneficiarios)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(beneficiarios.id, id))
    
    return true
  }

  async asignarCadenas(beneficiarioId: string, cadenaIds: string[]): Promise<boolean> {
    const now = new Date().toISOString()
    
    await db.delete(beneficiarioCadenas).where(eq(beneficiarioCadenas.beneficiarioId, beneficiarioId))
    
    for (const cadenaId of cadenaIds) {
      await db.insert(beneficiarioCadenas).values({
        id: uuid(),
        beneficiarioId,
        cadenaId,
        createdAt: now,
      })
    }
    
    return true
  }

  async getCadenas(beneficiarioId: string): Promise<{ id: string; nombre: string }[]> {
    const result = await db
      .select()
      .from(beneficiarioCadenas)
      .where(eq(beneficiarioCadenas.beneficiarioId, beneficiarioId))
    return result as { id: string; nombre: string }[]
  }
}

export const beneficiarioRepository = new BeneficiarioRepository()