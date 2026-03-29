import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sql } from "@/db";
import { authMiddleware } from "@/middleware/auth";
import { createHash } from "crypto";
import type { JwtPayload } from "@/lib/jwt";

const app = new Hono<{
  Variables: {
    tecnico: JwtPayload
  }
}>();

// Validación para creación de usuarios
const schemaCrearUsuario = z.object({
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  correo: z.string().email("Correo inválido"),
  rol: z.enum(["administrador", "coordinador", "tecnico"]).catch("administrador"),
  telefono: z.string().optional(),
  coordinador_id: z.string().uuid().optional(),
  fecha_limite: z.string().datetime().optional(),
  codigo_acceso: z.string().optional(),
  activo: z.boolean().default(true)
});

// Validación para actualización de usuarios
const schemaActualizarUsuario = z.object({
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres").optional(),
  correo: z.string().email("Correo inválido").optional(),
  rol: z.enum(["administrador", "coordinador", "tecnico"]).optional(),
  telefono: z.string().optional(),
  coordinador_id: z.string().uuid().optional(),
  fecha_limite: z.string().datetime().optional(),
  activo: z.boolean().optional()
});

// Validación para eliminación
const schemaEliminarUsuario = z.object({
  permanent: z.boolean().default(false),
  force: z.boolean().default(false),
  hard: z.boolean().default(false)
});

app.use("*", authMiddleware);

// Obtener perfil del usuario actual
app.get("/me", async (c) => {
  const tecnico = c.get("tecnico");
  
  const [usuario] = await sql`
    SELECT id, nombre, correo, rol, telefono, coordinador_id, 
           fecha_limite, activo, created_at, updated_at
    FROM usuarios
    WHERE id = ${tecnico.sub}
  `;
  
  if (!usuario) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }
  
  return c.json(usuario);
});

// Listar usuarios (solo administradores pueden ver todos)
app.get("/", async (c) => {
  const tecnico = c.get("tecnico");
  
  // Si es administrador, puede ver todos los usuarios
  if (tecnico.rol === "administrador") {
    const usuarios = await sql`
      SELECT id, nombre, correo, rol, telefono, coordinador_id, 
             fecha_limite, activo, created_at, updated_at
      FROM usuarios
      ORDER BY created_at DESC
    `;
    return c.json(usuarios);
  }
  
  // Si es coordinador, solo puede ver a sus técnicos
  if (tecnico.rol === "coordinador") {
    const usuarios = await sql`
      SELECT id, nombre, correo, rol, telefono, coordinador_id, 
             fecha_limite, activo, created_at, updated_at
      FROM usuarios
      WHERE coordinador_id = ${tecnico.sub} OR id = ${tecnico.sub}
      ORDER BY created_at DESC
    `;
    return c.json(usuarios);
  }
  
  // Si es técnico, solo puede ver su propio perfil
  const [usuario] = await sql`
    SELECT id, nombre, correo, rol, telefono, coordinador_id, 
           fecha_limite, activo, created_at, updated_at
    FROM usuarios
    WHERE id = ${tecnico.sub}
  `;
  
  return c.json(usuario ? [usuario] : []);
});

// Crear usuario
app.post("/", zValidator("json", schemaCrearUsuario), async (c) => {
  const tecnico = c.get("tecnico");
  const body = c.req.valid("json");
  
  // Validar permisos
  if (tecnico.rol === "tecnico") {
    return c.json({ error: "No tienes permisos para crear usuarios" }, 403);
  }
  
  // Validar que el correo no exista
  const [existe] = await sql`
    SELECT id FROM usuarios WHERE correo = ${body.correo}
  `;
  if (existe) {
    return c.json({ error: "Ya existe un usuario con este correo" }, 400);
  }
  
  // Generar código de acceso si no se proporciona
  const codigoAcceso = body.codigo_acceso || Math.random().toString(36).slice(2, 8).toUpperCase();
  
  // Encriptar código de acceso
  const hashCodigo = createHash("sha256").update(codigoAcceso).digest("hex");
  
  const [nuevo] = await sql`
    INSERT INTO usuarios (
      nombre, correo, rol, telefono, coordinador_id, 
      fecha_limite, codigo_acceso, activo
    ) VALUES (
      ${body.nombre}, ${body.correo}, ${body.rol}, ${body.telefono || null},
      ${body.coordinador_id || null}, ${body.fecha_limite || null},
      ${hashCodigo}, ${body.activo ?? true}
    )
    RETURNING id, nombre, correo, rol, telefono, coordinador_id, 
              fecha_limite, activo, created_at, updated_at
  `;
  
  // Devolver el código de acceso sin encriptar para que el administrador lo proporcione
  return c.json({
    ...nuevo,
    codigo_acceso: codigoAcceso
  }, 201);
});

// Obtener usuario por ID
app.get("/:id", async (c) => {
  const tecnico = c.get("tecnico");
  const { id } = c.req.param();
  
  // Validar permisos
  if (tecnico.rol === "tecnico" && tecnico.sub !== id) {
    return c.json({ error: "No tienes permisos para ver este usuario" }, 403);
  }
  
  if (tecnico.rol === "coordinador") {
    const [usuario] = await sql`
      SELECT id, nombre, correo, rol, telefono, coordinador_id, 
             fecha_limite, activo, created_at, updated_at
      FROM usuarios
      WHERE id = ${id} AND (coordinador_id = ${tecnico.sub} OR id = ${tecnico.sub})
    `;
    if (!usuario) {
      return c.json({ error: "Usuario no encontrado o no tienes permisos" }, 404);
    }
    return c.json(usuario);
  }
  
  const [usuario] = await sql`
    SELECT id, nombre, correo, rol, telefono, coordinador_id, 
           fecha_limite, activo, created_at, updated_at
    FROM usuarios
    WHERE id = ${id}
  `;
  
  if (!usuario) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }
  
  return c.json(usuario);
});

// Actualizar usuario
app.patch("/:id", zValidator("json", schemaActualizarUsuario), async (c) => {
  const tecnico = c.get("tecnico");
  const { id } = c.req.param();
  const body = c.req.valid("json");
  
  // Validar permisos
  if (tecnico.rol === "tecnico" && tecnico.sub !== id) {
    return c.json({ error: "No tienes permisos para actualizar este usuario" }, 403);
  }
  
  if (tecnico.rol === "coordinador" && tecnico.sub !== id) {
    const [usuario] = await sql`
      SELECT id FROM usuarios 
      WHERE id = ${id} AND coordinador_id = ${tecnico.sub}
    `;
    if (!usuario) {
      return c.json({ error: "No tienes permisos para actualizar este usuario" }, 403);
    }
  }
  
  // Validar que el correo no exista en otro usuario
  if (body.correo) {
    const [existe] = await sql`
      SELECT id FROM usuarios WHERE correo = ${body.correo} AND id != ${id}
    `;
    if (existe) {
      return c.json({ error: "Ya existe un usuario con este correo" }, 400);
    }
  }
  
  const [actualizado] = await sql`
    UPDATE usuarios SET
      nombre = COALESCE(${body.nombre ?? null}, nombre),
      correo = COALESCE(${body.correo ?? null}, correo),
      rol = COALESCE(${body.rol ?? null}, rol),
      telefono = COALESCE(${body.telefono ?? null}, telefono),
      coordinador_id = COALESCE(${body.coordinador_id ?? null}, coordinador_id),
      fecha_limite = COALESCE(${body.fecha_limite ?? null}, fecha_limite),
      activo = COALESCE(${body.activo ?? null}, activo),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, nombre, correo, rol, telefono, coordinador_id, 
              fecha_limite, activo, created_at, updated_at
  `;
  
  if (!actualizado) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }
  
  return c.json(actualizado);
});

// Eliminar usuario (soft delete)
app.delete("/:id", zValidator("query", schemaEliminarUsuario), async (c) => {
  const tecnico = c.get("tecnico");
  const { id } = c.req.param();
  const { permanent, force, hard } = c.req.valid("query");
  
  // Validar permisos
  if (tecnico.rol === "tecnico") {
    return c.json({ error: "No tienes permisos para eliminar usuarios" }, 403);
  }
  
  if (tecnico.rol === "coordinador" && tecnico.sub !== id) {
    const [usuario] = await sql`
      SELECT id, rol FROM usuarios 
      WHERE id = ${id} AND coordinador_id = ${tecnico.sub}
    `;
    if (!usuario) {
      return c.json({ error: "No tienes permisos para eliminar este usuario" }, 403);
    }
    // Coordinadores no pueden eliminar administradores
    if (usuario.rol === "administrador") {
      return c.json({ error: "No puedes eliminar a un administrador" }, 403);
    }
  }
  
  // Validar que no se elimine a sí mismo
  if (tecnico.sub === id && !force) {
    return c.json({ error: "No puedes eliminarte a ti mismo sin forzar" }, 400);
  }
  
  if (permanent || hard) {
    // Hard delete (eliminación permanente)
    const [eliminado] = await sql`
      DELETE FROM usuarios WHERE id = ${id} RETURNING id
    `;
    
    if (!eliminado) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }
    
    return c.json({ message: "Usuario eliminado permanentemente" });
  } else {
    // Soft delete (desactivar)
    const [actualizado] = await sql`
      UPDATE usuarios SET activo = false, updated_at = NOW() 
      WHERE id = ${id} 
      RETURNING id, nombre, activo
    `;
    
    if (!actualizado) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }
    
    return c.json({ message: "Usuario desactivado", usuario: actualizado });
  }
});

export default app;