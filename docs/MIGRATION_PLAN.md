# Plan de Migración: Arquitectura Modular y Monorepo

Resumen de fases
- Fase 1: Base de Monorepo
  - Crear pnpm-workspace.yaml y configurar workspaces para web y server/bff.
  - Ajustar scripts para desarrollo y build desde el workspace.
- Fase 2: BFF modular y capas
  - Crear estructura src/ con config, api y app, y migrar rutas a usar estas capas.
  - Mantener index.js como wrapper que arranca la app desde src/. 
- Fase 3: Observabilidad y seguridad básicas
  - Añadir logging estructurado, métricas y manejo central de errores.
- Fase 4: Seguridad y entorno
  - Centralizar configuración por entorno (ENV), endurecer CORS y validaciones de entradas.
- Fase 5: Frontend estructurado
  - Reorganizar frontend por características y preparar para lazy loading.
- Fase 6: Pruebas e CI
  -Introducir pruebas unitarias e de integración y pipeline de CI/CD.

Entregables por fase
- Fase 1: repositorio monorepo funcional; scripts de desarrollo corren desde root.
- Fase 2: BFF modular con capas y rutas funcionando; compatibilidad con el flujo actual.
- Fase 3: Observabilidad inicial (logs + métricas) y retry/circuit-breakers básicos.
- Fase 4: Seguridad y configuración por entorno listas para CI/CD.
- Fase 5: Frontend organizado para expansión y pruebas.
- Fase 6: Pruebas automatizadas y pipelines.

Riesgos y mitigaciones
- Riesgo: ruptura de scripts de construcción. Mitigación: mantener equivalentes de build/dev durante transición.
- Riesgo: migración de TS a BFF. Mitigación: migración incremental con capas JS primero y TS gradual después.

Criterios de finalización
- El monorepo compila y el BFF arranca sin errores en desarrollo y producción simulada.
- Las rutas existentes siguen funcionando durante la migración, o hay un plan de cambio controlado con toggles.
