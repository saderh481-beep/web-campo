import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { sql } from "@/db";
import { signJwt } from "@/lib/jwt";
import { rateLimitMiddleware } from "@/middleware/ratelimit";

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

export default app;
