# API Web - Endpoints (Actualizado)

Documentacion consolidada con la especificacion nueva de rutas, roles y comportamiento.

## Base

- Health: `GET /health`
- Prefijos principales:
  - `/auth`
  - `/usuarios`
  - `/tecnicos`
  - `/cadenas-productivas`
  - `/actividades`
  - `/beneficiarios`
  - `/asignaciones`
  - `/bitacoras`
  - `/reportes`
  - `/notificaciones`
  - `/localidades`
  - `/configuraciones`
  - `/documentos-plantilla`
  - `/archive`

## Autenticacion

Rutas protegidas usan header:

```http
Authorization: Bearer <token>
```

Roles disponibles:
- `administrador`
- `coordinador`
- `tecnico`

## Tabla Rapida

### Auth

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| POST | `/auth/request-codigo-acceso` | Publico | `{ correo }` |
| POST | `/auth/verify-codigo-acceso` | Publico | `{ correo, codigo_acceso }` |
| POST | `/auth/login` | Publico | `{ correo, codigo_acceso }` |
| POST | `/auth/request-otp` | Publico | `{ correo }` |
| POST | `/auth/verify-otp` | Publico | `{ correo, codigo_acceso }` |
| POST | `/auth/logout` | Bearer | `-` |

### Usuarios

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/usuarios` | administrador | `-` |
| POST | `/usuarios` | administrador | `{ correo, nombre, rol, telefono?, coordinador_id?, fecha_limite? }` |
| PATCH | `/usuarios/:id` | administrador | `{ nombre?, correo?, rol?, codigo_acceso?, telefono?, coordinador_id?, fecha_limite? }` |
| DELETE | `/usuarios/:id` | administrador | `-` |

### Tecnicos

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/tecnicos` | administrador, coordinador | `-` |
| GET | `/tecnicos/:id` | administrador, coordinador | `-` |
| POST | `/tecnicos` | administrador | No disponible (alta via `/usuarios` con rol tecnico) |
| PATCH | `/tecnicos/:id` | administrador | `{ nombre?, correo?, telefono?, coordinador_id?, fecha_limite? }` |
| POST | `/tecnicos/:id/codigo` | administrador | `-` |
| POST | `/tecnicos/aplicar-cortes` | administrador | `-` |
| POST | `/tecnicos/:id/cerrar-corte` | administrador, coordinador | `-` |
| DELETE | `/tecnicos/:id` | administrador | `-` |

### Cadenas Productivas

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/cadenas-productivas` | administrador, coordinador | `-` |
| POST | `/cadenas-productivas` | administrador | `{ nombre, descripcion? }` |
| PATCH | `/cadenas-productivas/:id` | administrador | `{ nombre?, descripcion? }` |
| DELETE | `/cadenas-productivas/:id` | administrador | `-` |

### Actividades

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/actividades` | administrador, coordinador | `-` |
| POST | `/actividades` | administrador | `{ nombre, descripcion? }` |
| PATCH | `/actividades/:id` | administrador | `{ nombre?, descripcion? }` |
| DELETE | `/actividades/:id` | administrador | `-` |

### Beneficiarios

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/beneficiarios` | administrador, coordinador | `-` |
| GET | `/beneficiarios/:id` | administrador, coordinador | `-` |
| POST | `/beneficiarios` | administrador, coordinador | `{ nombre, municipio, tecnico_id, localidad_id? }` |
| PATCH | `/beneficiarios/:id` | administrador, coordinador | `{ nombre?, municipio?, localidad?, localidad_id?, direccion?, cp?, telefono_principal?, telefono_secundario?, coord_parcela?, tecnico_id? }` |
| POST | `/beneficiarios/:id/cadenas` | administrador | `{ cadena_ids: uuid[] }` |
| POST | `/beneficiarios/:id/documentos` | administrador, coordinador | `FormData(archivo, tipo)` |
| GET | `/beneficiarios/:id/documentos` | administrador, coordinador | `-` |

### Asignaciones

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| POST | `/asignaciones/beneficiario` | administrador | `{ tecnico_id, beneficiario_id }` |
| DELETE | `/asignaciones/beneficiario/:id` | administrador | `-` |
| POST | `/asignaciones/actividad` | administrador | `{ tecnico_id, actividad_id }` |
| DELETE | `/asignaciones/actividad/:id` | administrador | `-` |

### Bitacoras

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/bitacoras` | administrador, coordinador | Query opcional: `tecnico_id, mes, anio, estado, tipo` |
| GET | `/bitacoras/:id` | administrador, coordinador | `-` |
| PATCH | `/bitacoras/:id` | administrador, coordinador | `{ observaciones?, actividades_realizadas? }` |
| GET | `/bitacoras/:id/pdf` | administrador, coordinador | `-` |
| GET | `/bitacoras/:id/pdf/descargar` | administrador, coordinador | `-` |
| POST | `/bitacoras/:id/pdf/imprimir` | administrador, coordinador | `-` |
| GET | `/bitacoras/:id/versiones` | administrador, coordinador | `-` |

### Reportes

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/reportes/mensual` | administrador, coordinador | Query opcional: `mes, anio` |
| GET | `/reportes/tecnico/:id` | administrador, coordinador | Query opcional: `desde, hasta` |

### Notificaciones

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/notificaciones` | todos (autenticado) | `-` |
| PATCH | `/notificaciones/:id/leer` | todos (autenticado) | `-` |
| PATCH | `/notificaciones/leer-todas` | todos (autenticado) | `-` |

### Localidades

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/localidades` | administrador, coordinador | `-` |
| POST | `/localidades` | administrador | `{ municipio, nombre, cp? }` |
| PATCH | `/localidades/:id` | administrador | `{ municipio?, nombre?, cp? }` |
| DELETE | `/localidades/:id` | administrador | `-` |

### Configuraciones

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/configuraciones` | administrador | `-` |
| GET | `/configuraciones/:clave` | administrador, coordinador | `-` |
| PUT | `/configuraciones/:clave` | administrador | `{ valor: object }` |

### Documentos Plantilla

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/documentos-plantilla/activos` | administrador, coordinador | `-` |
| GET | `/documentos-plantilla` | administrador | `-` |
| POST | `/documentos-plantilla` | administrador | `{ nombre, descripcion?, obligatorio?, orden? }` |
| PATCH | `/documentos-plantilla/:id` | administrador | `{ nombre?, descripcion?, obligatorio?, orden?, activo? }` |
| DELETE | `/documentos-plantilla/:id` | administrador | `-` |

### Archive

| Metodo | Ruta | Rol | Body minimo |
|---|---|---|---|
| GET | `/archive` | administrador | `-` |
| GET | `/archive/:periodo/descargar` | administrador | `-` |
| POST | `/archive/:periodo/confirmar` | administrador | `{ confirmar: true }` |
| POST | `/archive/:periodo/forzar` | administrador | `-` |

## Referencia Detallada

### Auth (`/auth`)

- `POST /request-codigo-acceso`
  - Body: `{ correo }`
  - Nota: endpoint informativo/compatibilidad; ya no genera codigo por correo.

- `POST /verify-codigo-acceso`
  - Body: `{ correo, codigo_acceso }`
  - Nota: login por compatibilidad.

- `POST /login`
  - Body: `{ correo, codigo_acceso }`
  - Busca usuario activo por correo, compara con `hash_codigo_acceso` (bcrypt), crea token UUID, guarda sesion en Redis y registra `auth_logs` login.
  - Respuesta 200:

```json
{
  "token": "uuid",
  "usuario": {
    "id": "uuid",
    "nombre": "Nombre",
    "correo": "correo@dominio.com",
    "rol": "administrador"
  }
}
```

- `POST /request-otp`
  - Compatibilidad temporal (mismo comportamiento de `request-codigo-acceso`).

- `POST /verify-otp`
  - Compatibilidad temporal (mismo comportamiento de `login`).

- `POST /logout`
  - Requiere Bearer token.
  - Elimina `session:{token}` en Redis y registra `auth_logs` logout.

### Usuarios (`/usuarios`)

Requiere rol `administrador`.

- `GET /`
  - Lista usuarios (incluye `codigo_acceso`).

- `POST /`
  - Body:
    - `correo` (email)
    - `nombre`
    - `rol`: `tecnico | coordinador | administrador`
    - `telefono?` (solo tecnico)
    - `coordinador_id?` (requerido si rol=tecnico)
    - `fecha_limite?` (requerido si rol=tecnico)
  - Genera `codigo_acceso` automaticamente:
    - tecnico: 5 digitos
    - coordinador/administrador: 6 digitos
  - Guarda codigo en texto plano y hash en bcrypt cost 12.
  - Si rol=tecnico, replica en tabla `tecnicos` con `activo=true`.
  - Respuesta 201 incluye `codigo_acceso`.

- `PATCH /:id`
  - Body parcial: `nombre, correo, rol, codigo_acceso, telefono, coordinador_id, fecha_limite`.
  - Si cambia `codigo_acceso`, tambien actualiza `hash_codigo_acceso`.
  - Si no se envia `codigo_acceso`, conserva hash actual sin recalcular.
  - Valida correo unico entre usuarios activos.
  - Si rol final es tecnico y se envia `coordinador_id`, valida coordinador activo.
  - Si el usuario es tecnico, sincroniza datos en tabla `tecnicos`.

- `DELETE /:id`
  - Soft delete: `activo=false`, `updated_at=NOW()`.
  - Retorna 404 si no existe.
  - Si rol=tecnico, tambien desactiva registro en `tecnicos`.

### Tecnicos (`/tecnicos`)

Requiere autenticacion.

- `GET /`
  - Roles: administrador, coordinador.
  - Admin ve todos los activos; coordinador solo los suyos.

- `GET /:id`
  - Roles: administrador, coordinador.

- `POST /`
  - Solo administrador.
  - No disponible para crear tecnicos.
  - Alta via `/usuarios` con rol tecnico.

- `PATCH /:id`
  - Solo administrador.
  - Body parcial: `nombre, correo, telefono, coordinador_id, fecha_limite`.
  - Valida correo unico contra usuarios activos.
  - Si cambia coordinador, valida coordinador activo.
  - Sincroniza `nombre/correo` en `usuarios`.
  - Si `fecha_limite` es futura, resetea `estado_corte` a `en_servicio`.

- `POST /aplicar-cortes`
  - Solo administrador.
  - Aplica `estado_corte=corte_aplicado` a tecnicos vencidos que esten en `en_servicio`.
  - Respuesta: lista de tecnicos actualizados.

- `POST /:id/cerrar-corte`
  - Roles: administrador, coordinador.
  - Coordinador solo en tecnicos bajo su coordinacion.
  - Aplica `estado_corte=corte_aplicado`.

- `POST /:id/codigo`
  - Solo administrador.
  - Genera codigo numerico de 5 digitos para tecnico.
  - Guarda en `tecnicos.codigo_acceso` y en `usuarios.codigo_acceso`, actualizando `usuarios.hash_codigo_acceso`.
  - No usa Redis para codigos tecnicos.

- `DELETE /:id`
  - Solo administrador.
  - Soft delete de tecnico: `activo=false`, `updated_at=NOW()`.
  - Tambien desactiva usuario tecnico asociado por correo.
  - Retorna 404 si el tecnico no existe.

### Cadenas Productivas (`/cadenas-productivas`)

- `GET /`: roles administrador, coordinador.
- `POST /`: solo administrador. Body: `nombre, descripcion?`.
- `PATCH /:id`: solo administrador. Body parcial: `nombre, descripcion`.
- `DELETE /:id`: solo administrador. Soft delete `activo=false`, `updated_at=NOW()`. Retorna 404 si no existe.

### Actividades (`/actividades`)

- `GET /`: roles administrador, coordinador.
- `POST /`: solo administrador. Body: `nombre, descripcion?`.
- `PATCH /:id`: solo administrador. Body parcial: `nombre, descripcion`.
- `DELETE /:id`: solo administrador. Soft delete `activo=false`, `updated_at=NOW()`. Retorna 404 si no existe.

### Beneficiarios (`/beneficiarios`)

- `GET /`: roles administrador, coordinador.
- `GET /:id`: regresa beneficiario con cadenas activas y documentos.

- `POST /`
  - Roles: administrador, coordinador.
  - Body:
    - `nombre`
    - `municipio`
    - `localidad?`
    - `localidad_id?` (uuid FK a tabla localidades)
    - `direccion?`
    - `cp?`
    - `telefono_principal?`
    - `telefono_secundario?`
    - `coord_parcela?` (formato `x,y` o `(x,y)`)
    - `tecnico_id`
  - Telefonos se almacenan como `bytea`.
  - `coord_parcela` se almacena como `point`.

- `PATCH /:id`
  - Roles: administrador, coordinador.
  - Body parcial de los mismos campos, incluyendo `localidad_id`.
  - Si se envia `tecnico_id`, valida tecnico activo.
  - Coordinador solo puede asignar tecnicos bajo su coordinacion.

- `POST /:id/cadenas`
  - Solo administrador.
  - Body: `{ cadena_ids: uuid[] }`.
  - Actualiza asignaciones usando `beneficiario_cadenas.activo` (sin delete fisico).

- `POST /:id/documentos`
  - Roles: administrador, coordinador.
  - `FormData`: `archivo`, `tipo`.
  - Guarda metadata en `documentos` (`r2_key`, `sha256`, `bytes`, `subido_por`).

- `GET /:id/documentos`
  - Lista documentos del beneficiario.

### Asignaciones (`/asignaciones`)

Requiere rol `administrador`.

- `POST /beneficiario`
  - Body: `{ tecnico_id, beneficiario_id }`.
  - Crea o reactiva asignacion.

- `DELETE /beneficiario/:id`
  - Soft remove: `activo=false`, `removido_en=NOW()`.
  - Retorna 404 si no existe.

- `POST /actividad`
  - Body: `{ tecnico_id, actividad_id }`.
  - Crea o reactiva asignacion.

- `DELETE /actividad/:id`
  - Soft remove: `activo=false`, `removido_en=NOW()`.
  - Retorna 404 si no existe.

### Bitacoras (`/bitacoras`)

Requiere rol `administrador` o `coordinador`.

- `GET /`
  - Filtros opcionales: `tecnico_id, mes, anio, estado, tipo`.

- `GET /:id`

- `PATCH /:id`
  - Body opcional:
    - `observaciones`
    - `actividades_realizadas`
  - Persiste en columnas:
    - `observaciones_coordinador`
    - `actividades_desc`

- `GET /:id/pdf`
  - Render inline PDF.
  - Usa configuracion dinamica desde `configuraciones.clave = 'pdf_encabezado'`.

- `GET /:id/pdf/descargar`
  - Descarga PDF.
  - Usa configuracion dinamica desde `configuraciones.clave = 'pdf_encabezado'`.

- `POST /:id/pdf/imprimir`
  - Genera PDF, lo sube y registra version en `pdf_versiones`.

- `GET /:id/versiones`
  - Lista versiones PDF.

### Reportes (`/reportes`)

Requiere rol `administrador` o `coordinador`.

- `GET /mensual`
  - Query opcional: `mes, anio`.
  - Respuesta: resumen por tecnico (`cerradas`, `borradores`, `total`).

- `GET /tecnico/:id`
  - Query opcional: `desde, hasta`.
  - Respuesta: detalle de bitacoras del tecnico.
  - Coordinador solo puede consultar tecnicos bajo su coordinacion.
  - Retorna 404 si no existe o no tiene permisos.

### Notificaciones (`/notificaciones`)

Requiere autenticacion (todos los roles, incluido tecnico). Cada ruta filtra por `destino_id` del usuario autenticado.

- `GET /`: lista no leidas del usuario autenticado.
- `PATCH /:id/leer`: marca una notificacion como leida.
- `PATCH /leer-todas`: marca todas como leidas para el usuario.

### Localidades (`/localidades`)

Catalogo manual de localidades por municipio.

- `GET /`
  - Roles: administrador, coordinador.
  - Devuelve activas ordenadas por municipio, nombre.

- `POST /`
  - Solo administrador.
  - Body: `municipio`, `nombre`, `cp?` (exactamente 5 digitos).

- `PATCH /:id`
  - Solo administrador.
  - Body parcial: `municipio`, `nombre`, `cp`.
  - Solo actualiza localidades activas.

- `DELETE /:id`
  - Solo administrador.
  - Soft delete: `activo=false`.

### Configuraciones (`/configuraciones`)

Almacen clave-valor JSONB global.
Claves predefinidas: `fecha_corte_global`, `ciclo_nombre`, `pdf_encabezado`.

- `GET /`
  - Solo administrador.
  - Lista: `clave`, `valor`, `descripcion`, `updated_at`.

- `GET /:clave`
  - Roles: administrador, coordinador.
  - Lee configuracion especifica.

- `PUT /:clave`
  - Solo administrador.
  - Body: `{ valor: object }`.
  - Reemplaza el JSONB completo.
  - Retorna 404 si no existe la clave.

Ejemplo de `pdf_encabezado`:

```json
{
  "valor": {
    "institucion": "Secretaria de Desarrollo Agropecuario",
    "dependencia": "Direccion de Fomento",
    "logo_url": "https://...",
    "pie_pagina": "Hidalgo, Mexico"
  }
}
```

### Documentos Plantilla (`/documentos-plantilla`)

Catalogo global de documentos requeridos por beneficiario.

- `GET /activos`
  - Roles: administrador, coordinador.
  - Devuelve activos ordenados por `orden`, `nombre`.

- `GET /`
  - Solo administrador.
  - Devuelve activos e inactivos.

- `POST /`
  - Solo administrador.
  - Body: `nombre`, `descripcion?`, `obligatorio?` (default `true`), `orden?` (default `0`).

- `PATCH /:id`
  - Solo administrador.
  - Body parcial: `nombre`, `descripcion`, `obligatorio`, `orden`, `activo`.

- `DELETE /:id`
  - Solo administrador.
  - Soft delete: `activo=false`.

### Archive (`/archive`)

Requiere rol `administrador`.

- `GET /`
  - Lista registros de `archive_logs`.

- `GET /:periodo/descargar`
  - Descarga paquete si `r2_key_staging` contiene URL HTTP(S).

- `POST /:periodo/confirmar`
  - Body: `{ confirmar: true }`.
  - Actualiza el registro mas reciente del periodo a `estado=confirmado`.
  - Retorna 404 si no existe archivado para ese periodo.

- `POST /:periodo/forzar`
  - Inserta evento de generacion en `archive_logs`.
  - Retorna 409 si ya existe archivado en estado `generando` para ese periodo.

## Codigos de Error Comunes

- `400`: Request invalido o validacion fallida.
- `401`: No autenticado o token invalido.
- `403`: Sin permisos por rol.
- `404`: Recurso no encontrado.
- `409`: Conflicto de datos (por ejemplo correo duplicado).
