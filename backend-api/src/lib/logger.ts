/**
 * Módulo de Logging
 * 
 * Este módulo proporciona un sistema de logging estructurado para la aplicación.
 * En desarrollo, los logs se muestran en formato legible.
 * En producción, los logs se muestran en formato JSON para facilitar su procesamiento.
 */

import { config } from "../config/env";

// Niveles de logging
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// Mapeo de niveles a números para comparación
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

// Nivel de logging configurado
const configuredLevel = config.logging.level as LogLevel;
const configuredPriority = LOG_LEVEL_PRIORITY[configuredLevel] ?? LOG_LEVEL_PRIORITY[LogLevel.INFO];

// Colores para desarrollo
const COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "\x1b[36m", // Cyan
  [LogLevel.INFO]: "\x1b[32m",  // Green
  [LogLevel.WARN]: "\x1b[33m",  // Yellow
  [LogLevel.ERROR]: "\x1b[31m", // Red
};

const RESET_COLOR = "\x1b[0m";

// Función para formatear timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// Función para verificar si un nivel debe ser loggeado
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= configuredPriority;
}

// Función para loggear en formato JSON (producción)
function logJson(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

// Función para loggear en formato legible (desarrollo)
function logPretty(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const color = COLORS[level];
  const timestamp = getTimestamp();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${RESET_COLOR}${dataStr}`);
}

// Función principal de logging
function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) {
    return;
  }

  if (config.server.isProduction) {
    logJson(level, message, data);
  } else {
    logPretty(level, message, data);
  }
}

// Funciones de logging por nivel
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log(LogLevel.DEBUG, message, data),
  info: (message: string, data?: Record<string, unknown>) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: Record<string, unknown>) => log(LogLevel.WARN, message, data),
  error: (message: string, data?: Record<string, unknown>) => log(LogLevel.ERROR, message, data),
};

// Función para loggear requests HTTP
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
  
  log(level, `${method} ${path} ${statusCode} - ${responseTime}ms`, {
    method,
    path,
    statusCode,
    responseTime,
    userId,
  });
}

// Función para loggear errores
export function logError(error: Error, context?: Record<string, unknown>): void {
  log(LogLevel.ERROR, error.message, {
    error: error.name,
    stack: error.stack,
    ...context,
  });
}
