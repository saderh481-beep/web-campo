# Arquitectura Propuesta y Ruta de Migración

Objetivo
- Ganar control, modularidad y escalabilidad para el frontend y BFF, manteniendo un repositorio único y coherente.

Arquitectura objetivo
- Monorepo con workspaces (frontend y BFF) para manejo central de dependencias y scripts.
- BFF modular en capas (controllers/endpoints, use-cases, services, repositories) para orquestación, seguridad y resiliencia.
- Frontend organizado por características (features) con lazy loading y code-splitting.
- Observabilidad y seguridad desde el inicio (logs estructurados, métricas básicas; preparado para tracing; configuración por entorno; validaciones de entrada).

Estructura sugerida
- root/
  - web/            (frontend React + Vite)
  - server/bff/      (BFF basado en Express, con src/ para las capas)
  - docs/           (documentación del proyecto)
- server/bff/
  - src/
    - config.js     (configuración por entorno)
    - api.js        (lógica de proxy hacia API remota)
    - app.js        (creación de la app Express y rutas)
  - index.js          (entrypoint actualizado para arrancar desde src/)

Guía de migración rápida
- Crear monorepo y mover scripts de desarrollo para soportar workspaces.
- Refactor del BFF a capas y migrar lógica de proxy a src/.
- Añadir observabilidad básica (logging + métricas) y resiliencia en llamadas a API remota.
- Reorganizar frontend para estructura por características y preparar code-splitting.
- Implementar configuración por entorno y endurecimiento de seguridad (CORS, validaciones, etc.).

Notas
- Esta arquitectura es incremental; el objetivo es migrar sin romper el flujo existente.
- A medida que la migración avance, se recomienda añadir pruebas unitarias e de integración en cada capa.
