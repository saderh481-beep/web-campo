import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { config } from "./config/env";
import { sql } from "./db";
import { redis } from "./lib/redis";
import { logger, logRequest } from "./lib/logger";
import authRoutes from "@/routes/auth";
import datosRoutes from "@/routes/datos";
import bitacorasRoutes from "@/routes/bitacoras";
import bitacorasExtendedRoutes from "@/routes/bitacoras-extended";
import usuariosRoutes from "@/routes/usuarios";
import syncRoutes from "@/routes/sync";
import notificacionesRoutes from "@/routes/notificaciones";

const app = new Hono();

// Configuración de CORS segura
const getCorsOrigins = (): string[] => {
  if (config.cors.origins.length > 0) {
    return config.cors.origins;
  }
  // En desarrollo, permitir localhost
  if (config.server.isDevelopment) {
    return [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3002",
    ];
  }
  // En producción, sin orígenes por defecto (debe configurarse)
  return [];
};

app.use("*", honoLogger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: getCorsOrigins(),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 horas
  })
);

app.get("/health", async (c) => {
  const health: {
    status: string;
    service: string;
    ts: string;
    checks: {
      database: { status: string; latency?: number; error?: string };
      redis: { status: string; latency?: number; error?: string };
    };
  } = {
    status: "ok",
    service: "api-app",
    ts: new Date().toISOString(),
    checks: {
      database: { status: "unknown" },
      redis: { status: "unknown" },
    },
  };

  // Verificar conexión a base de datos
  try {
    const dbStart = Date.now();
    await sql`SELECT 1`;
    health.checks.database = {
      status: "ok",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.status = "degraded";
    health.checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    logger.error("Health check: Database connection failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Verificar conexión a Redis
  try {
    const redisStart = Date.now();
    await redis.ping();
    health.checks.redis = {
      status: "ok",
      latency: Date.now() - redisStart,
    };
  } catch (error) {
    health.status = "degraded";
    health.checks.redis = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    logger.error("Health check: Redis connection failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return c.json(health, statusCode);
});

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1", datosRoutes);
app.route("/api/v1/bitacoras", bitacorasRoutes);
app.route("/api/v1/bitacoras", bitacorasExtendedRoutes);
app.route("/api/v1/usuarios", usuariosRoutes);
app.route("/api/v1", syncRoutes);
app.route("/api/v1/notificaciones", notificacionesRoutes);

// Ruta para registro de usuarios (para compatibilidad con frontend)
app.route("/api/v1/usuarios", usuariosRoutes);

app.notFound((c) => c.json({ error: "Ruta no encontrada" }, 404));
app.onError((err, c) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });
  return c.json({ error: "Error interno del servidor" }, 500);
});

export default app;
