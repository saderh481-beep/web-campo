# Endpoints API - Frontend CAMPO Web (CORREGIDO)
# Versión: 1.0
# Fecha: 2026-04-08
# Base URL: https://campo-api-web-campo-saas.up.railway.app/api/v1

================================================================================
 AUTENTICACIÓN (AUTH)
================================================================================

POST   /auth/request-codigo-acceso     # Solicitar código de acceso
POST   /auth/verify-codigo-acceso       # Verificar código y obtener token
POST   /auth/login                     # Alias de verify-codigo-acceso
GET    /auth/me                        # Obtener usuario actual
POST   /auth/logout                    # Cerrar sesión

NOTA: Los endpoints register, verify-email, resend-verification NO existen en el backend

================================================================================
 USUARIOS
================================================================================

GET    /usuarios/me                    # Obtener usuario actual
GET    /usuarios                       # Listar usuarios (admin)
POST   /usuarios                       # Crear usuario (admin)
PATCH  /usuarios/:id                   # Actualizar usuario (admin)
DELETE /usuarios/:id                   # Desactivar usuario (soft delete)
DELETE /usuarios/:id/force             # Eliminar permanentemente (hard delete)

================================================================================
 TÉCNICOS
================================================================================

GET    /tecnicos                       # Listar técnicos
GET    /tecnicos/:id                   # Obtener técnico por ID
PATCH  /tecnicos/:id                   # Actualizar técnico
POST   /tecnicos/:id/codigo            # Regenerar código de acceso
POST   /tecnicos/aplicar-cortes        # Aplicar cortes a técnicos vencidos
POST   /tecnicos/:id/cerrar-corte      # Cerrar período de corte
DELETE /tecnicos/:id                   # Desactivar técnico

================================================================================
 BENEFICIARIOS
================================================================================

GET    /beneficiarios                  # Listar beneficiarios
GET    /beneficiarios/:id              # Obtener beneficiario
POST   /beneficiarios                  # Crear beneficiario
PATCH  /beneficiarios/:id              # Actualizar beneficiario
DELETE /beneficiarios/:id              # Desactivar beneficiario
POST   /beneficiarios/:id/cadenas      # Asignar cadenas productivas
POST   /beneficiarios/:id/documentos   # Subir documento
GET    /beneficiarios/:id/documentos  # Listar documentos

================================================================================
 ASIGNACIONES
================================================================================

# Coordinador -> Técnico
GET    /asignaciones/coordinador-tecnico                        # Listar
GET    /asignaciones/coordinador-tecnico/lista                  # Lista alternativa
GET    /asignaciones/coordinador-tecnico/:tecnico_id            # Obtener por técnico
POST   /asignaciones/coordinador-tecnico                       # Crear
PATCH  /asignaciones/coordinador-tecnico/:tecnico_id           # Actualizar
DELETE /asignaciones/coordinador-tecnico/:tecnico_id            # Eliminar

# Técnico -> Beneficiario
GET    /asignaciones/beneficiario         # Listar
GET    /asignaciones/beneficiario/:id    # Obtener asignación
POST   /asignaciones/beneficiario         # Crear
PATCH  /asignaciones/beneficiario/:id    # Actualizar
DELETE /asignaciones/beneficiario/:id    # Eliminar

# Técnico -> Actividad
GET    /asignaciones/actividad           # Listar
GET    /asignaciones/actividad/:id       # Obtener asignación
POST   /asignaciones/actividad           # Crear
PATCH  /asignaciones/actividad/:id        # Actualizar
DELETE /asignaciones/actividad/:id       # Eliminar

================================================================================
 BITÁCORAS
================================================================================

GET    /bitacoras                       # Listar bitácoras
GET    /bitacoras/:id                   # Obtener bitácora
PATCH  /bitacoras/:id                   # Actualizar bitácora
PATCH  /bitacoras/:id/pdf-config        # Configurar PDF
GET    /bitacoras/:id/pdf               # Ver PDF
GET    /bitacoras/:id/pdf/descargar     # Descargar PDF
POST   /bitacoras/:id/pdf/imprimir      # Imprimir PDF
GET    /bitacoras/:id/versiones         # Listar versiones

================================================================================
 CATÁLOGOS - CADENAS PRODUCTIVAS
================================================================================

GET    /cadenas-productivas             # Listar cadenas
POST   /cadenas-productivas             # Crear cadena (admin)
PATCH  /cadenas-productivas/:id         # Actualizar cadena (admin)
DELETE /cadenas-productivas/:id         # Desactivar cadena (admin)

================================================================================
 CATÁLOGOS - ACTIVIDADES
================================================================================

GET    /actividades                     # Listar actividades
POST   /actividades                     # Crear actividad (admin)
PATCH  /actividades/:id                 # Actualizar actividad (admin)
DELETE /actividades/:id                 # Desactivar actividad (admin)

================================================================================
 CATÁLOGOS - LOCALIDADES
================================================================================

GET    /localidades                     # Listar localidades
POST   /localidades                     # Crear localidad (admin)
PATCH  /localidades/:id                 # Actualizar localidad (admin)
DELETE /localidades/:id                 # Desactivar localidad (admin)

================================================================================
 CATÁLOGOS - ZONAS
================================================================================

GET    /zonas                           # Listar zonas
POST   /zonas                          # Crear zona (admin)
PATCH  /zonas/:id                      # Actualizar zona (admin)
DELETE /zonas/:id                      # Desactivar zona (admin)

================================================================================
 CONFIGURACIONES
================================================================================

GET    /configuraciones                 # Listar configuraciones (admin)
GET    /configuraciones/:clave          # Obtener configuración (admin)
PUT    /configuraciones/:clave          # Actualizar configuración (admin)

================================================================================
 NOTIFICACIONES
================================================================================

GET    /notificaciones                  # Listar notificaciones
PATCH  /notificaciones/:id/leer         # Marcar como leído
PATCH  /notificaciones/leer-todas       # Marcar todas como leído

================================================================================
 DASHBOARD
================================================================================

GET    /dashboard                       # Dashboard general
GET    /dashboard/coordinador           # Dashboard de coordinador

================================================================================
 DOCUMENTOS PLANTILLA
================================================================================

GET    /documentos-plantilla           # Listar documentos (admin)
GET    /documentos-plantilla/activos   # Listar documentos activos
POST   /documentos-plantilla           # Crear documento (admin)
PATCH  /documentos-plantilla/:id      # Actualizar documento (admin)
DELETE /documentos-plantilla/:id      # Desactivar documento (admin)

================================================================================
 REPORTES
================================================================================

GET    /reportes/tecnico/:id            # Reporte de técnico
GET    /reportes/mensual               # Reporte mensual

================================================================================
 ARCHIVE (Archivo histórico)
================================================================================

GET    /archive                        # Listar archivos
GET    /archive/:periodo/descargar    # Descargar archivo
POST   /archive/:periodo/confirmar   # Confirmar archivo
POST   /archive/:periodo/forzar      # Forzar generación

================================================================================
 RESUMEN CORREGIDO
================================================================================

MÓDULO                    GET   POST   PATCH  DELETE  PUT    TOTAL
----------------------------------------------------------------------
Auth                      1     4      0      0      0      5
Usuarios                  2     1      1      2      0      6
Técnicos                  2     2      1      1      0      6
Beneficiarios             2     2      1      1      0      6
Asignaciones              6     3      3      3      0     15
Bitácoras                 4     1      2      0      0      7
Cadenas Productivas       1     1      1      1      0      4
Actividades               1     1      1      1      0      4
Localidades               1     1      1      1      0      4
Zonas                     1     1      1      1      0      4
Configuraciones           1     0      0      0      1      2
Notificaciones            1     0      2      0      0      3
Dashboard                 2     0      0      0      0      2
Documentos Plantilla      2     1      1      1      0      5
Reportes                  2     0      0      0      0      2
Archive                   2     2      0      0      0      4
----------------------------------------------------------------------
TOTAL                    29    19     14     11     1     74

================================================================================
 CORRECCIONES PRINCIPALES
================================================================================

Problema                                  | Corrección
------------------------------------------|------------------------------------
Auth register/verify-email/resend-verification | Eliminados (no existen en backend)
Auth request-codigo-acceso                 | Agregado
Usuarios/me                               | Agregado
Asignaciones beneficiario/:id             | Agregado
Asignaciones actividad/:id                | Agregado
Notificaciones :id/leer                    | Agregado
Dashboard general                         | Agregado
Archive generar                           | No existe como tal (solo download/confirmar/forzar)
