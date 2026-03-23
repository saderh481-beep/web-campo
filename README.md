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
