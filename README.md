# Campo Web

Aplicación web construida con React, TypeScript y Vite para operar el sistema CAMPO.

## Requisitos

- Node.js 22+
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Smoke test de API

```bash
npm run smoke:api
```

## API Web - Endpoints

La documentación detallada de endpoints se encuentra en [API-ENDPOINTS.md](API-ENDPOINTS.md).

La propuesta de cambios backend para cubrir validaciones de usuarios, control de acceso, bitácoras y exportación PDF está en [BACKEND-IMPLEMENTATION.md](BACKEND-IMPLEMENTATION.md).

Incluye:

- Prefijos y base de rutas
- Autenticación Bearer y sesiones Redis
- Roles y permisos por endpoint
- Tabla rápida por módulo
- Referencia detallada con body, query, respuestas y errores
- Convenciones de soft delete y sincronización de datos

## Stack

- React 19
- TypeScript 5
- Vite 8
- React Router 7
- TanStack Query 5
- Axios

## Arquitectura objetivo
- Monorepo con workspaces para frontend y BFF (gateway modular).
- BFF en capas (controllers/use-cases/services/repositories) para mejor separación de responsabilidades.
- Frontend organizado por características con lazy loading y code-splitting.
- Observabilidad básica (logs estructurados y métricas) desde el inicio, con preparaciones para tracing.
- Configuración por entorno y seguridad (env vars, CORS, validaciones).
