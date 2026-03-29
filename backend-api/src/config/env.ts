/**
 * Configuración de variables de entorno
 * 
 * Este módulo valida y exporta todas las variables de entorno requeridas
 * para el funcionamiento del backend. Si alguna variable requerida falta,
 * la aplicación no iniciará y mostrará un error claro.
 */

import { z } from "zod";

// Esquema de validación para las variables de entorno
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),

  // Redis
  REDIS_URL: z.string().url("REDIS_URL debe ser una URL válida"),
  REDIS_PUBLIC_URL: z.string().url("REDIS_PUBLIC_URL debe ser una URL válida").optional(),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME es requerido"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY es requerido"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET es requerido"),
  CLOUDINARY_PRESET_IMAGENES: z.string().min(1, "CLOUDINARY_PRESET_IMAGENES es requerido"),
  CLOUDINARY_PRESET_DOCS: z.string().min(1, "CLOUDINARY_PRESET_DOCS es requerido"),

  // Servidor
  PORT: z.string().default("3002").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // CORS (opcional)
  CORS_ORIGINS: z.string().optional(),

  // Rate Limiting (opcional)
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),

  // Logging (opcional)
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

// Tipo de las variables de entorno validadas
export type Env = z.infer<typeof envSchema>;

// Validar variables de entorno
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
      console.error("\n❌ Error en la configuración de variables de entorno:\n");
      console.error(missingVars.join("\n"));
      console.error("\n💡 Revisa el archivo .env.example para ver las variables requeridas.\n");
      process.exit(1);
    }
    throw error;
  }
}

// Exportar variables de entorno validadas
export const env = validateEnv();

// Exportar configuraciones derivadas
export const config = {
  // Configuración del servidor
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
  },

  // Configuración de base de datos
  database: {
    url: env.DATABASE_URL,
  },

  // Configuración de Redis
  redis: {
    url: env.REDIS_URL,
    publicUrl: env.REDIS_PUBLIC_URL ?? env.REDIS_URL,
  },

  // Configuración de JWT
  jwt: {
    secret: env.JWT_SECRET,
  },

  // Configuración de Cloudinary
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    presetImagenes: env.CLOUDINARY_PRESET_IMAGENES,
    presetDocs: env.CLOUDINARY_PRESET_DOCS,
  },

  // Configuración de CORS
  cors: {
    origins: env.CORS_ORIGINS?.split(",").map((o) => o.trim()) ?? [],
  },

  // Configuración de Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Configuración de Logging
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;
