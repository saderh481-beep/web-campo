import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { sql } from "@/db";
import { signJwt } from "@/lib/jwt";
import { rateLimitMiddleware } from "@/middleware/ratelimit";
import { authMiddleware } from "@/middleware/auth";
import { createHash } from "crypto";

const app = new Hono();
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

app.post(
  "/tecnico",
  rateLimitMiddleware(10, 60),
  zValidator("json", z.object({ codigo: z.string().regex(/^\d{5}$/) })),
  async (c) => {
    const { codigo } = c.req.valid("json");

    const [tecnico] = await sql`
      SELECT id, nombre, correo, activo, fecha_limite, estado_corte
      FROM usuarios
      WHERE codigo_acceso = ${codigo} AND activo = true
      LIMIT 1
    `;

    if (!tecnico) {
      return c.json({ error: "Código inválido o expirado" }, 401);
    }

    const fechaLimiteVencida = tecnico.fecha_limite
      ? new Date(tecnico.fecha_limite).getTime() < Date.now()
      : false;
    const corteAplicado = tecnico.estado_corte && tecnico.estado_corte !== "en_servicio";

    if (fechaLimiteVencida || corteAplicado) {
      return c.json({ error: "periodo_vencido" }, 401);
    }

    const token = await signJwt({ sub: tecnico.id, nombre: tecnico.nombre, rol: "tecnico" });

    await redis.setex(
      `session:${token}`,
      SESSION_TTL_SECONDS,
      JSON.stringify({
        sub: tecnico.id,
        nombre: tecnico.nombre,
        rol: "tecnico",
      })
    );

    return c.json({
      token,
      tecnico: { id: tecnico.id, nombre: tecnico.nombre },
    });
  }
);

// Obtener información del usuario actual (para compatibilidad con frontend)
app.get("/me", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return c.json({ error: "Token no proporcionado" }, 401);
  }

  try {
    // Verificar si el token está en Redis (sesión activa)
    const sessionData = await redis.get(`session:${token}`);
    if (!sessionData) {
      return c.json({ error: "Sesión no válida o expirada" }, 401);
    }

    const payload = JSON.parse(sessionData);
    
    // Obtener información completa del usuario desde la base de datos
    const [usuario] = await sql`
      SELECT id, nombre, correo, rol, telefono, coordinador_id, 
             fecha_limite, activo, created_at, updated_at
      FROM usuarios
      WHERE id = ${payload.sub}
    `;

    if (!usuario) {
      return c.json({ error: "Usuario no encontrado" }, 404);
    }

    return c.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        telefono: usuario.telefono,
        coordinador_id: usuario.coordinador_id,
        fecha_limite: usuario.fecha_limite,
        activo: usuario.activo,
        created_at: usuario.created_at,
        updated_at: usuario.updated_at
      }
    });
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    return c.json({ error: "Error al obtener información del usuario" }, 500);
  }
});

// Registro de usuarios (solo para administradores)
app.post(
  "/registro",
  authMiddleware,
  zValidator("json", z.object({
    nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
    correo: z.string().email("Correo inválido"),
    rol: z.enum(["administrador", "coordinador", "tecnico"]),
    telefono: z.string().optional(),
    coordinador_id: z.string().uuid().optional(),
    fecha_limite: z.string().datetime().optional(),
    codigo_acceso: z.string().optional(),
    activo: z.boolean().default(true)
  })),
  async (c) => {
    const tecnico = c.get("tecnico");
    
    // Solo administradores pueden registrar usuarios
    if (tecnico.rol !== "administrador") {
      return c.json({ error: "No tienes permisos para registrar usuarios" }, 403);
    }

    const body = c.req.valid("json");

    // Validar que el correo no exista
    const [existe] = await sql`
      SELECT id FROM usuarios WHERE correo = ${body.correo}
    `;
    if (existe) {
      return c.json({ error: "Ya existe un usuario con este correo" }, 400);
    }

    // Validar que el coordinador_id exista si se proporciona
    if (body.coordinador_id) {
      const [coordinador] = await sql`
        SELECT id FROM usuarios WHERE id = ${body.coordinador_id} AND rol = 'coordinador'
      `;
      if (!coordinador) {
        return c.json({ error: "Coordinador no encontrado" }, 400);
      }
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
  }
);

// Login para administradores y coordinadores (con correo y contraseña)
app.post(
  "/login",
  rateLimitMiddleware(5, 60),
  zValidator("json", z.object({
    correo: z.string().email("Correo inválido"),
    clave: z.string().min(1, "Contraseña requerida")
  })),
  async (c) => {
    const { correo, clave } = c.req.valid("json");

    // Buscar usuario por correo
    const [usuario] = await sql`
      SELECT id, nombre, correo, rol, activo, fecha_limite, estado_corte, codigo_acceso
      FROM usuarios
      WHERE correo = ${correo} AND activo = true
      LIMIT 1
    `;

    if (!usuario) {
      return c.json({ error: "Credenciales inválidas" }, 401);
    }

    // Validar que el usuario tenga rol permitido para login web
    if (usuario.rol === "tecnico") {
      return c.json({ error: "Los técnicos deben usar el código de acceso" }, 401);
    }

    // Validar contraseña (comparar con codigo_acceso encriptado)
    const hashClave = createHash("sha256").update(clave).digest("hex");
    if (hashClave !== usuario.codigo_acceso) {
      return c.json({ error: "Credenciales inválidas" }, 401);
    }

    const fechaLimiteVencida = usuario.fecha_limite
      ? new Date(usuario.fecha_limite).getTime() < Date.now()
      : false;
    const corteAplicado = usuario.estado_corte && usuario.estado_corte !== "en_servicio";

    if (fechaLimiteVencida || corteAplicado) {
      return c.json({ error: "periodo_vencido" }, 401);
    }

    const token = await signJwt({ sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol });

    await redis.setex(
      `session:${token}`,
      SESSION_TTL_SECONDS,
      JSON.stringify({
        sub: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
      })
    );

    return c.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    });
  }
);

// Logout
app.post(
  "/logout",
  authMiddleware,
  async (c) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    
    if (token) {
      await redis.del(`session:${token}`);
    }
    
    return c.json({ message: "Sesión cerrada exitosamente" });
  }
);

export default app;
