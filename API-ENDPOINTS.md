# API Web - Documentación de Endpoints

Documentación actualizada de endpoints expuestos por la API.

## Base

- **Health**: `GET /health`
- **Prefijos montados**:
  - `/auth`
  - `/usuarios`
  - `/tecnicos`
  - `/actividades`
  - `/cadenas-productivas`
  - `/beneficiarios`
  - `/asignaciones`
  - `/bitacoras`
  - `/reportes`
  - `/archive`
  - `/notificaciones`

## Autenticación

Todas las rutas protegidas usan header `Authorization` con esquema Bearer:

```
Authorization: Bearer <token>
```

**Almacenamiento de credenciales:**
- **Tokens de sesión**: Se validan contra Redis en la clave `session:{token}` (sesiones web)
- **Códigos de acceso**: Se guardan en base de datos con:
  - `usuarios.codigo_acceso` (texto plano)
  - `usuarios.hash_codigo_acceso` (bcrypt, costo 12)

## Roles

Roles disponibles en el backend:
- `administrador`
- `coordinador`
- `tecnico`

---

## Tabla Rápida

### Auth

| Método | Ruta | Autenticación | Body Mínimo |
|--------|------|---------------|------------|
| POST | `/auth/request-codigo-acceso` | Público | `{ correo }` |
| POST | `/auth/verify-codigo-acceso` | Público | `{ correo, codigo_acceso }` |
| POST | `/auth/login` | Público | `{ correo, codigo_acceso }` |
| POST | `/auth/request-otp` | Público | `{ correo }` |
| POST | `/auth/verify-otp` | Público | `{ correo, codigo_acceso }` |
| POST | `/auth/logout` | Bearer | — |

### Usuarios

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| GET | `/usuarios` | administrador | — |
| POST | `/usuarios` | administrador | `{ correo, nombre, rol, telefono?, coordinador_id?, fecha_limite? }` |
| PATCH | `/usuarios/:id` | administrador | `{ nombre?, correo?, rol?, codigo_acceso?, telefono?, coordinador_id?, fecha_limite? }` |
| DELETE | `/usuarios/:id` | administrador | — |

### Técnicos

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| GET | `/tecnicos` | administrador, coordinador | — |
| GET | `/tecnicos/:id` | administrador, coordinador | — |
| POST | `/tecnicos` | administrador | No disponible (usar `/usuarios` con rol=tecnico) |
| PATCH | `/tecnicos/:id` | administrador | `{ nombre?, correo?, telefono?, coordinador_id?, fecha_limite? }` |
| POST | `/tecnicos/:id/codigo` | administrador | — |
| DELETE | `/tecnicos/:id` | administrador | — |

### Actividades

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| GET | `/actividades` | administrador, coordinador | — |
| POST | `/actividades` | administrador | `{ nombre, descripcion? }` |
| PATCH | `/actividades/:id` | administrador | `{ nombre?, descripcion?, created_by? }` |
| DELETE | `/actividades/:id` | administrador | — |

### Cadenas Productivas

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| GET | `/cadenas-productivas` | administrador, coordinador | — |
| POST | `/cadenas-productivas` | administrador | `{ nombre, descripcion? }` |
| PATCH | `/cadenas-productivas/:id` | administrador | `{ nombre?, descripcion? }` |
| DELETE | `/cadenas-productivas/:id` | administrador | — |

### Beneficiarios

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| GET | `/beneficiarios` | administrador, coordinador | — |
| GET | `/beneficiarios/:id` | administrador, coordinador | — |
| POST | `/beneficiarios` | administrador, coordinador | `{ nombre, municipio, tecnico_id }` |
| PATCH | `/beneficiarios/:id` | administrador, coordinador | `{ nombre?, municipio?, localidad?, direccion?, cp?, telefono_principal?, telefono_secundario?, coord_parcela?, tecnico_id? }` |
| POST | `/beneficiarios/:id/cadenas` | administrador | `{ cadena_ids: uuid[] }` |
| POST | `/beneficiarios/:id/documentos` | administrador, coordinador | `FormData(archivo, tipo)` |
| GET | `/beneficiarios/:id/documentos` | administrador, coordinador | — |

### Asignaciones

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| POST | `/asignaciones/beneficiario` | administrador | `{ tecnico_id, beneficiario_id }` |
| DELETE | `/asignaciones/beneficiario/:id` | administrador | — |
| POST | `/asignaciones/actividad` | administrador | `{ tecnico_id, actividad_id }` |
| DELETE | `/asignaciones/actividad/:id` | administrador | — |

### Bitácoras

| Método | Ruta | Rol | Query Opcional |
|--------|------|-----|----------------|
| GET | `/bitacoras` | administrador, coordinador | `tecnico_id, mes, anio, estado, tipo` |
| GET | `/bitacoras/:id` | administrador, coordinador | — |
| PATCH | `/bitacoras/:id` | administrador, coordinador | — |
| GET | `/bitacoras/:id/pdf` | administrador, coordinador | — |
| GET | `/bitacoras/:id/pdf/descargar` | administrador, coordinador | — |
| POST | `/bitacoras/:id/pdf/imprimir` | administrador, coordinador | — |
| GET | `/bitacoras/:id/versiones` | administrador, coordinador | — |

### Reportes

| Método | Ruta | Rol | Query Opcional |
|--------|------|-----|----------------|
| GET | `/reportes/mensual` | administrador, coordinador | `mes, anio` |
| GET | `/reportes/tecnico/:id` | administrador, coordinador | `desde, hasta` |

### Notificaciones

| Método | Ruta | Rol | Body |
|--------|------|-----|------|
| GET | `/notificaciones` | administrador, coordinador | — |
| PATCH | `/notificaciones/:id/leer` | administrador, coordinador | — |
| PATCH | `/notificaciones/leer-todas` | administrador, coordinador | — |

### Archive

| Método | Ruta | Rol | Body Mínimo |
|--------|------|-----|------------|
| GET | `/archive` | administrador | — |
| GET | `/archive/:periodo/descargar` | administrador | — |
| POST | `/archive/:periodo/confirmar` | administrador | `{ confirmar: true }` |
| POST | `/archive/:periodo/forzar` | administrador | — |

---

## Referencia Detallada

### Auth (`/auth`)

#### POST `/request-codigo-acceso`
- **Autenticación**: Pública
- **Body**: `{ correo: string }`
- **Respuesta**: `200 OK`
- **Nota**: Endpoint informativo/compatibilidad; ya no genera código por correo

#### POST `/verify-codigo-acceso`
- **Autenticación**: Pública
- **Body**: `{ correo: string, codigo_acceso: string }`
- **Respuesta**: `200 OK` → `{ token, usuario: { id, nombre, correo, rol } }`
- **Errores**: `400` (validación), `401` (credenciales inválidas)
- **Nota**: Login por compatibilidad

#### POST `/login`
- **Autenticación**: Pública
- **Body**: `{ correo: string, codigo_acceso: string }`
- **Respuesta**: `200 OK` → `{ token, usuario: { id, nombre, correo, rol } }`
- **Errores**: `400` (validación), `401` (credenciales inválidas), `404` (usuario no encontrado)
- **Lógica**:
  1. Busca usuario activo por correo
  2. Compara `codigo_acceso` contra `hash_codigo_acceso` (bcrypt)
  3. Crea token UUID
  4. Guarda sesión en Redis con clave `session:{token}`
  5. Registra evento en `auth_logs` (login)

#### POST `/request-otp`
- **Autenticación**: Pública
- **Body**: `{ correo: string }`
- **Respuesta**: `200 OK`
- **Nota**: Compatibilidad temporal (comportamiento idéntico a `/request-codigo-acceso`)

#### POST `/verify-otp`
- **Autenticación**: Pública
- **Body**: `{ correo: string, codigo_acceso: string }`
- **Respuesta**: `200 OK` → `{ token, usuario: { id, nombre, correo, rol } }`
- **Errores**: `400` (validación), `401` (credenciales inválidas)
- **Nota**: Compatibilidad temporal (comportamiento idéntico a `/login`)

#### POST `/logout`
- **Autenticación**: Bearer token (requerido)
- **Body**: — (vacío)
- **Respuesta**: `200 OK`
- **Errores**: `401` (sin autenticación)
- **Lógica**:
  1. Elimina `session:{token}` en Redis
  2. Registra evento en `auth_logs` (logout)

---

### Usuarios (`/usuarios`)

**Autenticación**: Todas requieren rol `administrador`

#### GET `/`
- **Respuesta**: `200 OK` → `[ { id, nombre, correo, rol, codigo_acceso, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Nota**: Incluye `codigo_acceso` en texto plano

#### POST `/`
- **Body**:
  - `correo` (string, requerido): Email del usuario
  - `nombre` (string, requerido)
  - `rol` (enum: `tecnico | coordinador | administrador`, requerido)
  - `telefono` (string, opcional): Solo para rol=tecnico
  - `coordinador_id` (uuid, requerido si rol=tecnico)
  - `fecha_limite` (date, requerido si rol=tecnico)
- **Respuesta**: `201 Created` → `{ id, nombre, correo, rol, codigo_acceso, ... }`
- **Errores**: `400` (validación), `409` (correo duplicado), `404` (coordinador no encontrado para tecnico)
- **Lógica**:
  1. Valida correo único entre usuarios activos
  2. Genera `codigo_acceso`:
     - `tecnico`: 5 dígitos
     - `coordinador/administrador`: 6 dígitos
  3. Calcula `hash_codigo_acceso` (bcrypt, costo 12)
  4. Si `rol=tecnico`, replica registro en tabla `tecnicos` con `activo=true`
  5. La respuesta incluye el `codigo_acceso` generado

#### PATCH `/:id`
- **Body** (todos opcionales):
  - `nombre`, `correo`, `rol`, `telefono`, `coordinador_id`, `fecha_limite`
  - `codigo_acceso`: Si se actualiza, también regenera `hash_codigo_acceso`
- **Respuesta**: `200 OK` → `{ id, nombre, correo, rol, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (usuario no encontrado), `409` (correo duplicado o coordinador inactivo)
- **Lógica**:
  1. Valida correo único entre usuarios activos
  2. Si `rol=tecnico` y se envía `coordinador_id`, valida que coordinador exista y esté activo
  3. Sincroniza datos en tabla `tecnicos` si el usuario es tecnico

#### DELETE `/:id`
- **Body**: — (vacío)
- **Respuesta**: `204 No Content` o `200 OK`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (usuario no encontrado)
- **Lógica**:
  1. Soft delete: `activo=false`, `updated_at=NOW()`
  2. Si `rol=tecnico`, también desactiva registro en tabla `tecnicos`

---

### Técnicos (`/tecnicos`)

**Autenticación**: Todas requieren Bearer token

#### GET `/`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `[ { id, nombre, correo, telefono, coordinador_id, codigo_acceso, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Nota**: 
  - Admin: Ve todos los técnicos activos
  - Coordinador: Solo ve técnicos bajo su coordinación

#### GET `/:id`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `{ id, nombre, correo, telefono, coordinador_id, codigo_acceso, ... }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (técnico no encontrado)
- **Nota**: Coordinador solo puede ver técnicos bajo su coordinación

#### POST `/`
- **Roles autorizados**: `administrador`
- **Respuesta**: `405 Method Not Allowed` o `400 Bad Request`
- **Nota**: La alta de técnicos se realiza mediante `POST /usuarios` con `rol=tecnico`

#### PATCH `/:id`
- **Roles autorizados**: `administrador`
- **Body** (todos opcionales):
  - `nombre`, `correo`, `telefono`, `coordinador_id`, `fecha_limite`
- **Respuesta**: `200 OK` → `{ id, nombre, correo, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (técnico no encontrado), `409` (correo duplicado o coordinador inactivo)
- **Lógica**:
  1. Valida correo único contra usuarios activos
  2. Si cambia `coordinador_id`, valida que sea coordinador activo
  3. Sincroniza `nombre` y `correo` en tabla `usuarios` para mantener consistencia

#### POST `/:id/codigo`
- **Roles autorizados**: `administrador`
- **Body**: — (vacío)
- **Respuesta**: `200 OK` → `{ codigo_acceso: string }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (técnico no encontrado)
- **Lógica**:
  1. Genera código numérico de 5 dígitos
  2. Actualiza `tecnicos.codigo_acceso`
  3. Sincroniza en `usuarios.codigo_acceso` y `usuarios.hash_codigo_acceso` (bcrypt)

#### DELETE `/:id`
- **Roles autorizados**: `administrador`
- **Body**: — (vacío)
- **Respuesta**: `204 No Content` o `200 OK`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (técnico no encontrado)
- **Lógica**:
  1. Soft delete técnico: `activo=false`, `updated_at=NOW()`
  2. Desactiva usuario tecnico asociado (búsqueda por correo)

---

### Actividades (`/actividades`)

**Autenticación**: POST, PATCH, DELETE requieren rol `administrador`; GET requiere `administrador` o `coordinador`

#### GET `/`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `[ { id, nombre, descripcion, activo, created_at, updated_at, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)

#### POST `/`
- **Roles autorizados**: `administrador`
- **Body**:
  - `nombre` (string, requerido)
  - `descripcion` (string, opcional)
- **Respuesta**: `201 Created` → `{ id, nombre, descripcion, activo, created_at, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos)

#### PATCH `/:id`
- **Roles autorizados**: `administrador`
- **Body** (todos opcionales):
  - `nombre`, `descripcion`, `created_by`
- **Respuesta**: `200 OK` → `{ id, nombre, descripcion, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (actividad no encontrada)

#### DELETE `/:id`
- **Roles autorizados**: `administrador`
- **Body**: — (vacío)
- **Respuesta**: `204 No Content` o `200 OK`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (actividad no encontrada)
- **Lógica**:
  1. Soft delete: `activo=false`, `updated_at=NOW()`

---

### Cadenas Productivas (`/cadenas-productivas`)

**Autenticación**: GET requiere `administrador` o `coordinador`; POST, PATCH, DELETE requieren `administrador`

#### GET `/`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `[ { id, nombre, descripcion, activo, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)

#### POST `/`
- **Roles autorizados**: `administrador`
- **Body**:
  - `nombre` (string, requerido)
  - `descripcion` (string, opcional)
- **Respuesta**: `201 Created` → `{ id, nombre, descripcion, activo, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos)

#### PATCH `/:id`
- **Roles autorizados**: `administrador`
- **Body** (todos opcionales):
  - `nombre`, `descripcion`
- **Respuesta**: `200 OK` → `{ id, nombre, descripcion, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (cadena no encontrada)

#### DELETE `/:id`
- **Roles autorizados**: `administrador`
- **Body**: — (vacío)
- **Respuesta**: `204 No Content` o `200 OK`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (cadena no encontrada)
- **Lógica**:
  1. Soft delete: `activo=false`, `updated_at=NOW()`

---

### Beneficiarios (`/beneficiarios`)

**Autenticación**: Todas requieren Bearer token

#### GET `/`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `[ { id, nombre, municipio, localidad, direccion, cp, telefono_principal, telefono_secundario, coord_parcela, tecnico_id, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)

#### GET `/:id`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `{ id, nombre, municipio, ..., cadenas: [ { id, nombre, ... } ], documentos: [ { ... } ] }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (beneficiario no encontrado)
- **Nota**: Incluye cadenas activas y documentos asociados

#### POST `/`
- **Roles autorizados**: `administrador`, `coordinador`
- **Body**:
  - `nombre` (string, requerido)
  - `municipio` (string, requerido)
  - `tecnico_id` (uuid, requerido)
  - `localidad`, `direccion`, `cp`, `telefono_principal`, `telefono_secundario` (strings, opcionales)
  - `coord_parcela` (string formato `x,y` o `(x,y)`, opcional)
- **Respuesta**: `201 Created` → `{ id, nombre, municipio, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (técnico no encontrado)
- **Almacenamiento especial**:
  - `telefonos`: bytea
  - `coord_parcela`: point (PostGIS)
- **Validación**: Coordinador solo puede asignar técnicos bajo su coordinación

#### PATCH `/:id`
- **Roles autorizados**: `administrador`, `coordinador`
- **Body** (todos opcionales):
  - `nombre`, `municipio`, `localidad`, `direccion`, `cp`, `telefono_principal`, `telefono_secundario`, `coord_parcela`, `tecnico_id`
- **Respuesta**: `200 OK` → `{ id, nombre, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (beneficiario o técnico no encontrado)
- **Validación**: Coordinador solo puede asignar técnicos bajo su coordinación

#### POST `/:id/cadenas`
- **Roles autorizados**: `administrador`
- **Body**: `{ cadena_ids: uuid[] }`
- **Respuesta**: `200 OK`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (beneficiario no encontrado)
- **Lógica**:
  1. Actualiza asignaciones usando tabla `beneficiario_cadenas`
  2. Marca registros como `activo=false` en lugar de eliminar físicamente

#### POST `/:id/documentos`
- **Roles autorizados**: `administrador`, `coordinador`
- **Body**: `FormData` con:
  - `archivo` (file, requerido)
  - `tipo` (string, requerido)
- **Respuesta**: `201 Created` → `{ id, nombre_original, tipo, sha256, bytes, r2_key, subido_por, created_at, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (beneficiario no encontrado)
- **Almacenamiento**:
  - Metadata guardada en tabla `documentos`:
    - `r2_key`: Key en R2 (Cloudflare)
    - `sha256`: Hash SHA256
    - `bytes`: Tamaño en bytes
    - `subido_por`: ID del usuario

#### GET `/:id/documentos`
- **Roles autorizados**: `administrador`, `coordinador`
- **Respuesta**: `200 OK` → `[ { id, nombre_original, tipo, sha256, bytes, r2_key, subido_por, created_at, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (beneficiario no encontrado)

---

### Asignaciones (`/asignaciones`)

**Autenticación**: Todas requieren rol `administrador`

#### POST `/beneficiario`
- **Body**: `{ tecnico_id: uuid, beneficiario_id: uuid }`
- **Respuesta**: `201 Created` → `{ id, tecnico_id, beneficiario_id, activo, created_at, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (técnico o beneficiario no encontrado)
- **Lógica**:
  1. Crea nueva asignación
  2. Si existe anterior con `activo=false`, la reactiva

#### DELETE `/beneficiario/:id`
- **Body**: — (vacío)
- **Respuesta**: `204 No Content` o `200 OK`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (asignación no encontrada)
- **Lógica**: Soft remove: `activo=false`, `removido_en=NOW()`

#### POST `/actividad`
- **Body**: `{ tecnico_id: uuid, actividad_id: uuid }`
- **Respuesta**: `201 Created` → `{ id, tecnico_id, actividad_id, activo, created_at, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (técnico o actividad no encontrada)
- **Lógica**:
  1. Crea nueva asignación
  2. Si existe anterior con `activo=false`, la reactiva

#### DELETE `/actividad/:id`
- **Body**: — (vacío)
- **Respuesta**: `204 No Content` o `200 OK`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (asignación no encontrada)
- **Lógica**: Soft remove: `activo=false`, `removido_en=NOW()`

---

### Bitácoras (`/bitacoras`)

**Autenticación**: Todas requieren `administrador` o `coordinador`

#### GET `/`
- **Query Parameters** (todos opcionales):
  - `tecnico_id` (uuid)
  - `mes` (number: 1-12)
  - `anio` (number)
  - `estado` (string)
  - `tipo` (string)
- **Respuesta**: `200 OK` → `[ { id, tecnico_id, mes, anio, estado, tipo, observaciones_coordinador, actividades_desc, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Nota**: Coordinador filtra automáticamente por técnicos bajo su coordinación

#### GET `/:id`
- **Respuesta**: `200 OK` → `{ id, tecnico_id, mes, anio, estado, tipo, observaciones_coordinador, actividades_desc, ... }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (bitácora no encontrada)

#### PATCH `/:id`
- **Body** (todos opcionales):
  - `observaciones`: Se guarda en `observaciones_coordinador`
  - `actividades_realizadas`: Se guarda en `actividades_desc`
- **Respuesta**: `200 OK` → `{ id, observaciones_coordinador, actividades_desc, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (bitácora no encontrada)

#### GET `/:id/pdf`
- **Respuesta**: `200 OK` con Content-Type `application/pdf`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (bitácora no encontrada)
- **Nota**: Renderiza PDF inline en el navegador

#### GET `/:id/pdf/descargar`
- **Respuesta**: `200 OK` con Content-Disposition `attachment`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (bitácora no encontrada)
- **Nota**: Descarga PDF con nombre sugerido

#### POST `/:id/pdf/imprimir`
- **Body**: — (vacío)
- **Respuesta**: `200 OK` → `{ pdf_version_id, url, created_at, ... }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (bitácora no encontrada)
- **Lógica**:
  1. Genera PDF
  2. Sube a R2 (Cloudflare)
  3. Registra versión en tabla `pdf_versiones`

#### GET `/:id/versiones`
- **Respuesta**: `200 OK` → `[ { id, numero_version, url_r2, created_by, created_at, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (bitácora no encontrada)

---

### Reportes (`/reportes`)

**Autenticación**: Todas requieren `administrador` o `coordinador`

#### GET `/mensual`
- **Query Parameters** (opcionales):
  - `mes` (number: 1-12)
  - `anio` (number)
- **Respuesta**: `200 OK` → `[ { tecnico_id, tecnico_nombre, cerradas: number, borradores: number, total: number, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Nota**: Resumen por técnico

#### GET `/tecnico/:id`
- **Path Parameters**:
  - `id` (uuid, requerido)
- **Query Parameters** (opcionales):
  - `desde` (date ISO 8601)
  - `hasta` (date ISO 8601)
- **Respuesta**: `200 OK` → `[ { id, mes, anio, estado, observaciones, actividades, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (técnico no encontrado)
- **Validación**: Coordinador solo puede consultar técnicos bajo su coordinación

---

### Notificaciones (`/notificaciones`)

**Autenticación**: Todas requieren `administrador` o `coordinador`

#### GET `/`
- **Respuesta**: `200 OK` → `[ { id, usuario_id, tipo, contenido, leida, created_at, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Nota**: Lista notificaciones no leídas del usuario autenticado

#### PATCH `/:id/leer`
- **Body**: — (vacío)
- **Respuesta**: `200 OK` → `{ id, leida: true, ... }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (notificación no encontrada)
- **Lógica**: Marca notificación como leída

#### PATCH `/leer-todas`
- **Body**: — (vacío)
- **Respuesta**: `200 OK` → `{ marcadas: number }`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Lógica**: Marca todas las notificaciones del usuario como leídas

---

### Archive (`/archive`)

**Autenticación**: Todas requieren rol `administrador`

#### GET `/`
- **Respuesta**: `200 OK` → `[ { periodo, estado, created_at, r2_key_staging, r2_key_final, ... } ]`
- **Errores**: `401` (no autenticado), `403` (sin permisos)
- **Nota**: Lista registros de `archive_logs`

#### GET `/:periodo/descargar`
- **Path Parameters**:
  - `periodo` (string, formato P1-2024 o similar)
- **Respuesta**: `200 OK` (descarga del archivo)
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (periodo no encontrado), `400` (sin URL HTTP(S) disponible)
- **Condición**: `r2_key_staging` debe contener URL HTTP(S)

#### POST `/:periodo/confirmar`
- **Path Parameters**:
  - `periodo` (string)
- **Body**: `{ confirmar: true }`
- **Respuesta**: `200 OK` → `{ evento_id, tipo: "confirmacion", created_at, ... }`
- **Errores**: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (periodo no encontrado)
- **Lógica**: Inserta evento de confirmación en `archive_logs` (append-only)

#### POST `/:periodo/forzar`
- **Path Parameters**:
  - `periodo` (string)
- **Body**: — (vacío)
- **Respuesta**: `200 OK` → `{ evento_id, tipo: "forzar", created_at, ... }`
- **Errores**: `401` (no autenticado), `403` (sin permisos), `404` (periodo no encontrado)
- **Lógica**: Inserta evento de generación en `archive_logs` (append-only)

---

## Códigos de Error Comunes

| Código | Descripción | Causas Comunes |
|--------|-------------|----------------|
| `400` | Solicitud inválida | Validación fallida, parámetros mal formados, body inválido |
| `401` | No autenticado | Falta header Authorization, token inválido o expirado |
| `403` | Prohibido | Usuario autenticado pero sin permisos por rol |
| `404` | No encontrado | Recurso no existe |
| `409` | Conflicto | Correo duplicado, inconsistencia de datos, operación no permitida |

---

## Convenciones

### Soft Deletes
- `activo=false` y `updated_at=NOW()`
- Los registros no se eliminan físicamente
- Las búsquedas típicamente filtran por `activo=true`

### Sincronización de Datos
- Cambios en tabla `tecnicos` replican en `usuarios` y viceversa
- Se mantiene consistencia de:
  - `nombre`
  - `correo`
  - `codigo_acceso` y `hash_codigo_acceso`

### Almacenamiento de Contraseñas
- `codigo_acceso`: Texto plano en BD (compatibilidad)
- `hash_codigo_acceso`: bcrypt con costo 12

### Sesiones
- Tokens: UUID guardados en Redis con clave `session:{token}`
- TTL: Configurado en Redis
- Validan automáticamente en rutas protegidas

### Formatos Especiales
- **coord_parcela**: Formato `x,y` o `(x,y)`, almacenado como `point` en PostGIS
- **telefonos**: Almacenados como `bytea`
- **documentos**: Metadata en BD, archivos en R2 (Cloudflare)
