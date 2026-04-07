import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { usuarios, type Usuario } from '../db/schema'
import { v4 as uuid } from 'uuid'

export class UsuarioRepository {
  async findAll(): Promise<Usuario[]> {
    return db.select().from(usuarios).where(eq(usuarios.activo, true)).orderBy(desc(usuarios.createdAt))
  }

  async findById(id: string): Promise<Usuario | undefined> {
    const result = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1)
    return result[0]
  }

  async findByIdWithInactive(id: string): Promise<Usuario | undefined> {
    const result = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1)
    return result[0]
  }

  async findByCorreo(correo: string): Promise<Usuario | undefined> {
    const result = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.correo, correo.toLowerCase()))
      .limit(1)
    return result[0]
  }

  async findByCorreoWithInactive(correo: string): Promise<Usuario | undefined> {
    const result = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.correo, correo.toLowerCase()))
      .limit(1)
    return result[0]
  }

  async create(data: {
    correo: string
    nombre: string
    rol: string
    telefono?: string
    coordinadorId?: string
    fechaLimite?: string
    codigoAcceso?: string
  }): Promise<Usuario> {
    const now = new Date().toISOString()
    const id = uuid()
    
    const [created] = await db
      .insert(usuarios)
      .values({
        id,
        correo: data.correo.toLowerCase(),
        nombre: data.nombre,
        rol: data.rol,
        telefono: data.telefono,
        coordinadorId: data.coordinadorId,
        fechaLimite: data.fechaLimite,
        codigoAcceso: data.codigoAcceso,
        activo: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    
    return created
  }

  async update(id: string, data: Partial<{
    correo: string
    nombre: string
    rol: string
    telefono: string | null
    coordinadorId: string | null
    fechaLimite: string | null
    codigoAcceso: string | null
    activo: boolean
  }>): Promise<Usuario | undefined> {
    const now = new Date().toISOString()
    
    const [updated] = await db
      .update(usuarios)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(usuarios.id, id))
      .returning()
    
    return updated
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date().toISOString()
    
    const result = await db
      .update(usuarios)
      .set({
        activo: false,
        updatedAt: now,
      })
      .where(eq(usuarios.id, id))
    
    return true
  }

  async hardDelete(id: string): Promise<boolean> {
    await db.delete(usuarios).where(eq(usuarios.id, id))
    return true
  }
}

export const usuarioRepository = new UsuarioRepository()