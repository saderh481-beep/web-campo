# Backend Implementation Guide

Guía de cambios recomendados para alinear la API de CAMPO con los requerimientos funcionales solicitados el 27 de marzo de 2026.

## Objetivo

Cerrar en backend estos puntos:

1. Crear usuarios con ID manual por rol.
2. Restringir acceso web a administrador y coordinador.
3. Fortalecer bitácoras con metadatos de auditoría.
4. Exportar bitácoras a PDF individual y por filtros.
5. Endurecer validaciones, respuestas HTTP, logs y seguridad para producción.

## Hallazgo clave

La documentación actual en [API-ENDPOINTS.md](./API-ENDPOINTS.md) describe que `POST /usuarios` genera automáticamente `codigo_acceso`:

- técnico: 5 dígitos
- administrador/coordinador: 6 dígitos

El requerimiento nuevo cambia ese contrato:

- el usuario debe capturar un ID manual
- ese ID debe ser numérico
- debe tener longitud exacta por rol
- debe ser único en base de datos

Recomendación:

- usar `codigo_acceso` como el ID/código oficial para no romper login existente
- dejar de autogenerarlo en `POST /usuarios`
- exigirlo explícitamente en `POST /usuarios`

## Modelo de datos

## Tabla `usuarios`

Campos relevantes esperados:

- `id UUID PK`
- `nombre TEXT NOT NULL`
- `correo TEXT NOT NULL`
- `rol TEXT NOT NULL CHECK rol IN ('administrador', 'coordinador', 'tecnico')`
- `codigo_acceso TEXT NOT NULL`
- `hash_codigo_acceso TEXT NOT NULL`
- `activo BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Cambios recomendados:

1. Crear índice único parcial para evitar duplicados en usuarios activos:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_activo_unique
ON usuarios (LOWER(correo))
WHERE activo = true;
```

2. Crear índice único global para `codigo_acceso` si el ID debe ser irrepetible en toda la base:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_acceso_unique
ON usuarios (codigo_acceso);
```

Si se desea permitir reutilización de IDs en usuarios inactivos, usar índice parcial:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_acceso_activo_unique
ON usuarios (codigo_acceso)
WHERE activo = true;
```

3. Agregar `CHECK` para asegurar contenido numérico:

```sql
ALTER TABLE usuarios
ADD CONSTRAINT usuarios_codigo_acceso_numerico_chk
CHECK (codigo_acceso ~ '^[0-9]+$');
```

4. Si el rol puede cambiar, la longitud exacta debe validarse en servicio, no solo con `CHECK`, porque depende del valor de `rol`.

## Tabla `bitacoras`

Asegurar existencia o equivalentes de:

- `id UUID PK`
- `beneficiario_id UUID NOT NULL`
- `tecnico_id UUID NOT NULL`
- `registrado_por UUID NOT NULL`
- `fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `latitud NUMERIC(10, 7) NULL`
- `longitud NUMERIC(10, 7) NULL`
- `ubicacion_texto TEXT NULL`
- `observaciones_coordinador TEXT NULL`
- `actividades_desc TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Si aún no existen, agregar:

```sql
ALTER TABLE bitacoras
ADD COLUMN IF NOT EXISTS registrado_por UUID NULL,
ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS latitud NUMERIC(10, 7) NULL,
ADD COLUMN IF NOT EXISTS longitud NUMERIC(10, 7) NULL,
ADD COLUMN IF NOT EXISTS ubicacion_texto TEXT NULL;
```

Luego backfill:

- `registrado_por` desde `tecnico_id` o usuario creador histórico
- `fecha_inicio` desde `created_at`

Después endurecer:

```sql
UPDATE bitacoras
SET fecha_inicio = COALESCE(fecha_inicio, created_at)
WHERE fecha_inicio IS NULL;
```

## Contrato propuesto de usuarios

## POST `/api/v1/usuarios`

Rol: `administrador`

Body:

```json
{
  "correo": "persona@hidalgo.gob.mx",
  "nombre": "Nombre Apellido",
  "rol": "coordinador",
  "codigo_acceso": "123456",
  "telefono": "7710000000",
  "coordinador_id": "uuid-opcional-si-es-tecnico",
  "fecha_limite": "2026-04-30T00:00:00.000Z"
}
```

Reglas:

- `codigo_acceso` requerido.
- Solo números.
- Longitud exacta:
  - administrador: 6
  - coordinador: 6
  - tecnico: 5
- Debe ser único.
- `correo` único entre activos.
- Si `rol = tecnico`:
  - `coordinador_id` requerido
  - `fecha_limite` requerida
  - `coordinador_id` debe existir, estar activo y tener rol `coordinador`

Respuestas:

- `201 Created`
- `400 Bad Request` para validaciones
- `409 Conflict` opcional para duplicados, si el equipo prefiere distinguirlos
- `403 Forbidden` si no es administrador
- `500 Internal Server Error`

Respuesta sugerida:

```json
{
  "message": "Usuario creado correctamente",
  "usuario": {
    "id": "uuid",
    "nombre": "Nombre Apellido",
    "correo": "persona@hidalgo.gob.mx",
    "rol": "coordinador",
    "codigo_acceso": "123456",
    "activo": true
  }
}
```

## PATCH `/api/v1/usuarios/:id`

Rol: `administrador`

Body parcial:

```json
{
  "nombre": "Nuevo nombre",
  "correo": "nuevo@hidalgo.gob.mx",
  "rol": "tecnico",
  "codigo_acceso": "12345",
  "telefono": "7710000000",
  "coordinador_id": "uuid",
  "fecha_limite": "2026-04-30T00:00:00.000Z",
  "activo": true
}
```

Reglas:

- Si llega `codigo_acceso`, revalidar:
  - numérico
  - longitud exacta según `rol` final
  - único
- Si llega `rol = tecnico`, exigir `coordinador_id` y `fecha_limite`.
- Si un técnico cambia a otro rol:
  - desactivar o limpiar `tecnico_detalles` según diseño actual
- Si cambia `codigo_acceso`, recalcular `hash_codigo_acceso`.

Mensajes requeridos:

- `El ID debe tener 6 dígitos`
- `El ID debe tener 5 dígitos`
- `El ID ya está en uso`

Mensaje adicional recomendado:

- `El ID debe contener solo números`

## Servicio de validación de usuarios

Centralizar esta lógica en una función reusable:

```ts
function validateCodigoAcceso(input: { rol: string; codigo_acceso: string }) {
  if (!/^[0-9]+$/.test(input.codigo_acceso)) {
    throw httpError(400, 'El ID debe contener solo números')
  }

  const expectedLength = input.rol === 'tecnico' ? 5 : 6
  if (input.codigo_acceso.length !== expectedLength) {
    throw httpError(
      400,
      input.rol === 'tecnico' ? 'El ID debe tener 5 dígitos' : 'El ID debe tener 6 dígitos'
    )
  }
}
```

Validación de duplicado:

```ts
const existing = await db.usuario.findFirst({
  where: {
    codigo_acceso,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    activo: true,
  },
})

if (existing) {
  throw httpError(400, 'El ID ya está en uso')
}
```

## Acceso web

## Login `/api/v1/auth/login`

Mantener autenticación con:

```json
{
  "correo": "persona@hidalgo.gob.mx",
  "codigo_acceso": "123456"
}
```

Pero bloquear acceso web para rol `tecnico`.

Recomendación:

- permitir autenticación de técnico solo si existe app móvil o flujo aparte
- si este login es exclusivo para web, responder `403`

Respuesta sugerida:

```json
{
  "error": "web_access_denied",
  "message": "El rol tecnico no tiene acceso a la aplicación web"
}
```

## Middleware de autorización

Crear helpers declarativos:

- `requireAuth`
- `requireRoles(['administrador', 'coordinador'])`
- `requireAdmin`

Cambios solicitados:

- solo administrador y coordinador pueden entrar al frontend web
- ambos pueden crear, editar y eliminar:
  - beneficiarios
  - técnicos
  - tareas/actividades
  - asignaciones

## Ajustes de permisos por endpoint

Actualizar a:

- `POST /actividades`: administrador, coordinador
- `PATCH /actividades/:id`: administrador, coordinador
- `DELETE /actividades/:id`: administrador, coordinador
- `POST /asignaciones/coordinador-tecnico`: administrador, coordinador
- `PATCH /asignaciones/coordinador-tecnico/:tecnico_id`: administrador, coordinador
- `DELETE /asignaciones/coordinador-tecnico/:tecnico_id`: administrador, coordinador
- `POST /asignaciones/beneficiario`: administrador, coordinador
- `PATCH /asignaciones/beneficiario/:id`: administrador, coordinador
- `DELETE /asignaciones/beneficiario/:id`: administrador, coordinador
- `POST /asignaciones/actividad`: administrador, coordinador
- `PATCH /asignaciones/actividad/:id`: administrador, coordinador
- `DELETE /asignaciones/actividad/:id`: administrador, coordinador

Regla de alcance para coordinador:

- solo puede operar sobre técnicos bajo su coordinación
- solo puede operar beneficiarios asignados a esos técnicos
- solo puede operar bitácoras de esos técnicos

## Bitácoras mejoradas

Cada bitácora debe persistir:

- `fecha_inicio`
- `registrado_por`
- `beneficiario_id`
- datos denormalizados de beneficiario si ayudan al PDF:
  - `beneficiario_nombre`
  - `beneficiario_municipio`
  - `beneficiario_localidad`
- `latitud`
- `longitud`
- `ubicacion_texto`

Respuesta mínima de `GET /bitacoras` y `GET /bitacoras/:id`:

```json
{
  "id": "uuid",
  "fecha_inicio": "2026-03-27T14:35:00.000Z",
  "usuario_nombre": "Juan Pérez",
  "beneficiario_nombre": "María López",
  "beneficiario_municipio": "Actopan",
  "beneficiario_localidad": "Boxtha",
  "latitud": 20.1234567,
  "longitud": -98.1234567,
  "ubicacion_texto": "Parcela 3, sector norte"
}
```

## PDF de bitácoras

## Situación actual

Ya existen:

- `GET /bitacoras/:id/pdf`
- `GET /bitacoras/:id/pdf/descargar`
- `POST /bitacoras/:id/pdf/imprimir`

## Faltante para cubrir requerimiento

Agregar exportación múltiple:

### Opción A: endpoint de exportación directa

`GET /api/v1/bitacoras/pdf/exportar`

Query params:

- `desde=2026-03-01`
- `hasta=2026-03-31`
- `usuario_id=uuid`
- `beneficiario_id=uuid`

Comportamiento:

- busca registros por filtros
- genera un PDF consolidado
- responde inline o como attachment

### Opción B: endpoint de generación asíncrona

`POST /api/v1/bitacoras/pdf/exportar`

Body:

```json
{
  "desde": "2026-03-01",
  "hasta": "2026-03-31",
  "usuario_id": "uuid",
  "beneficiario_id": "uuid",
  "download": true
}
```

Respuesta:

```json
{
  "message": "PDF generado correctamente",
  "url": "https://.../exports/bitacoras-2026-03.pdf"
}
```

Recomendación:

- para lotes pequeños: `pdfkit`
- para diseño más pulido estilo plantilla HTML: `puppeteer`

Si la API ya usa Bun/Node, mi recomendación es:

- `puppeteer` para lotes y formato profesional
- `pdfkit` solo si se busca liviandad y control programático

## Contenido del PDF

Debe incluir:

- encabezado con nombre del sistema
- fecha y hora de emisión
- datos del registro
- usuario que capturó
- datos del beneficiario
- ubicación, si existe
- observaciones
- bloque visual limpio para impresión

## Endpoint de impresión

`POST /bitacoras/:id/pdf/imprimir`

Comportamiento recomendado:

1. genera PDF
2. guarda versión en almacenamiento
3. inserta fila en `pdf_versiones`
4. registra auditoría
5. retorna:

```json
{
  "message": "PDF generado e impreso correctamente",
  "version_id": "uuid",
  "url": "https://..."
}
```

## Respuestas HTTP

Convención recomendada:

- `400 Bad Request`: formato inválido, longitud, campos requeridos
- `401 Unauthorized`: sin token o token inválido
- `403 Forbidden`: autenticado sin permiso
- `404 Not Found`: recurso inexistente o fuera de alcance
- `409 Conflict`: duplicados si se quiere distinguir semánticamente
- `500 Internal Server Error`: error inesperado

Formato uniforme:

```json
{
  "error": "validation_error",
  "message": "El ID debe tener 6 dígitos",
  "details": {
    "field": "codigo_acceso"
  }
}
```

## Logs de errores

Registrar en servidor:

- request id
- usuario autenticado
- endpoint
- método HTTP
- status code
- stack trace
- payload sanitizado

Nunca loggear:

- `codigo_acceso` en texto plano
- tokens JWT
- archivos o binarios completos

Ejemplo de sanitización:

```ts
function sanitizeBody(body: Record<string, unknown>) {
  const copy = { ...body }
  if ('codigo_acceso' in copy) copy.codigo_acceso = '[REDACTED]'
  if ('token' in copy) copy.token = '[REDACTED]'
  return copy
}
```

## Seguridad

Checklist mínimo:

- sanitizar payloads de entrada
- validar tipos y longitud con Zod o equivalente
- usar consultas parametrizadas u ORM
- recalcular `hash_codigo_acceso` con bcrypt
- no devolver `hash_codigo_acceso` en respuestas
- proteger duplicados con índice único, no solo con validación previa
- validar alcance por coordinador en cada operación
- usar JWT o sesión con expiración y revocación
- invalidar sesiones de usuarios desactivados

## Esquema sugerido con Zod

```ts
const usuarioSchema = z.object({
  nombre: z.string().trim().min(1),
  correo: z.string().trim().email(),
  rol: z.enum(['administrador', 'coordinador', 'tecnico']),
  codigo_acceso: z.string().trim().regex(/^[0-9]+$/, 'El ID debe contener solo números'),
  telefono: z.string().trim().optional(),
  coordinador_id: z.string().uuid().optional(),
  fecha_limite: z.string().datetime().optional(),
}).superRefine((value, ctx) => {
  const expected = value.rol === 'tecnico' ? 5 : 6
  if (value.codigo_acceso.length !== expected) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['codigo_acceso'],
      message: value.rol === 'tecnico'
        ? 'El ID debe tener 5 dígitos'
        : 'El ID debe tener 6 dígitos',
    })
  }

  if (value.rol === 'tecnico' && !value.coordinador_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['coordinador_id'],
      message: 'El coordinador es obligatorio para técnicos',
    })
  }
})
```

## Plan de implementación sugerido

1. Migración SQL para índices y columnas faltantes.
2. Actualizar esquema/ORM.
3. Refactor de servicio `usuarios`:
   - exigir `codigo_acceso`
   - eliminar autogeneración
   - revalidar por rol
4. Refactor de login y autorización web.
5. Extender `bitacoras` para metadatos.
6. Implementar exportación PDF múltiple.
7. Estandarizar middleware de errores.
8. Agregar pruebas.

## Pruebas mínimas

Usuarios:

- crea administrador con 6 dígitos
- rechaza administrador con 5 dígitos
- crea técnico con 5 dígitos
- rechaza técnico con letras
- rechaza ID duplicado
- rechaza técnico sin coordinador

Auth:

- técnico autenticado recibe `403` en web si ese login es solo web
- administrador y coordinador acceden correctamente

Bitácoras:

- persiste `fecha_inicio`
- persiste `registrado_por`
- persiste ubicación si existe
- exporta PDF individual
- exporta PDF por rango de fechas
- exporta PDF por usuario
- exporta PDF por beneficiario

Permisos:

- coordinador puede crear/editar/eliminar beneficiarios
- coordinador puede crear/editar/eliminar actividades
- coordinador puede crear/editar/eliminar asignaciones dentro de su alcance
- coordinador no puede operar recursos fuera de su alcance

## Compatibilidad con el frontend actual

El frontend de este repo ya quedó preparado para enviar `codigo_acceso` como ID manual en creación/edición de usuarios y para consumir mejor metadatos de bitácoras.

Para que quede totalmente funcional en producción, el backend debe:

- aceptar `codigo_acceso` en `POST /usuarios`
- dejar de generarlo automáticamente
- devolver mensajes de validación consistentes
- exponer en bitácoras `fecha_inicio`, `usuario_nombre` y ubicación
- agregar exportación PDF por filtros si se requiere desde web
