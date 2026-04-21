# Plan de reestructuración de la API y organización de código

- Objetivo: estructurar la capa de acceso a la API y la documentación para facilitar la escalabilidad, la mantenibilidad y la migración futura a una arquitectura orientada a microservicios.
- Alcance: mover hacia una arquitectura con una capa de BFF que centralice la orquestación, estandarizar contratos de API y proveer documentación clara (OpenAPI) para todos los endpoints.
- Entregables iniciales:
  - BFF existente ya implementada para desarrollo; extender con endpoints necesarios y añadir caching/observabilidad.
  - Documento OpenAPI (comienzo) y una página docs estática para explorarlo rápidamente.
  - Estructura de código para un cliente API con contratos y validaciones en el cliente.

## Fase 1: Estabilización de la BFF y contratos (2–4 semanas)
- Centralizar más endpoints en la BFF (usuarios, técnicos, beneficiarios, bitácoras) para que el frontend hable a una única fuente de verdad.
- Introducir validación de contratos en BFF y frontend (Zod o similares) para mensajes de API consistentes.
- Añadir caching básico en BFF (Redis) para lecturas frecuentes y coherencia en respuestas.
- Generar OpenAPI básico para endpoints cubiertos y crear doc viewer estático (public/docs).

## Fase 2: Observabilidad y seguridad (4–6 semanas)
- Instrumentar trazas y métricas: OpenTelemetry, Prometheus/Grafana, logs estructurados.
- Fortalecer seguridad entre cliente y BFF: políticas de CSRF, expiración de tokens y una estrategia de renovación.
- Pruebas automatizadas: unitarias, de integración y E2E para flujos clave (login, asignaciones, bitácoras).

## Fase 3: Preparación para microservicios (1–3 meses, opcional)
- Mantener BFF como capa de orquestación; exponer servicios desacoplados detrás de un API Gateway.
- Introducir services por dominio (autenticación, usuarios, técnicos, beneficiarios) y arquitectura de eventos cuando aplique.
- Infraestructura: Kubernetes, CI/CD, despliegues canary/blue-green, y caching distribuido.

## Preguntas de alineación
- ¿Quieres que conversemos el backlog en un conjunto de épicas e historias de usuario con criterios de aceptación y estimaciones?
- ¿Prefieres que el OpenAPI cubra ya todos los endpoints listados o que prioricemos primero los más usados (usuarios, beneficiarios, bitácoras) y luego completemos?
- ¿Qué nivel de observabilidad quieres desde ya? (logs simples vs. trazas + dashboards)
- ¿Tienes restricciones de infraestructura en producción (Cloud, Kubernetes, Redis, API Gateway)? ¿O quieres mantener la BFF como capa principal por ahora?
- ¿Quieres que prepare un plan de migración detallado a Opción B (microservicios) con hitos y criterios de éxito?
- ¿Prefieres avanzar ya con la Opción A (BFF central) o empezar a diseñar la migración a Opción B (microservicios) desde ahora?
- ¿Qué recursos de infraestructura están disponibles (Cloud, Kubernetes, Redis, etc.)?
- ¿Qué endpoints deben priorizarse en la migración a BFF para empezar a migrar contratos y validaciones?
