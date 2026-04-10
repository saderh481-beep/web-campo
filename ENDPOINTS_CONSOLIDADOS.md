# Endpoints API - Frontend CAMPO Web (CORREGIDO)
# Versión: 1.1
# Fecha: 2026-04-10
# Base URL: https://campo-api-web-campo-saas.up.railway.app/api/v1

# NOTA IMPORTANTE: Bitácoras ahora incluye archivos multimedia (fotos, firmas, PDFs)
# Al crear/actualizar bitácora, el backend debe incluir en la respuesta:
#   - foto_rostro_url: string (foto del rostro del beneficiario)
#   - firma_url: string (firma del beneficiario)
#   - fotos_campo: array (fotos de campo de la visita)
#   - pdf_actividades_url: string (PDF de actividades realizadas)

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
 GET    /beneficiarios/:id              # Obtener beneficiario (incluye foto_rostro_url, firma_url si existen)
 POST   /beneficiarios                  # Crear beneficiario
 PATCH  /beneficiarios/:id              # Actualizar beneficiario
 DELETE /beneficiarios/:id              # Desactivar beneficiario
 POST   /beneficiarios/:id/cadenas      # Asignar cadenas productivas
 POST   /beneficiarios/:id/documentos   # Subir documento (genérico)
 GET    /beneficiarios/:id/documentos  # Listar documentos

 # Foto del rostro y Firma del beneficiario (para identificación)
 POST   /beneficiarios/:id/foto-rostro   # Subir foto del rostro
 GET    /beneficiarios/:id/foto-rostro    # Obtener foto del rostro
 DELETE /beneficiarios/:id/foto-rostro    # Eliminar foto del rostro
 POST   /beneficiarios/:id/firma          # Subir firma
 GET    /beneficiarios/:id/firma         # Obtener firma
 DELETE /beneficiarios/:id/firma      # Eliminar firma

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
 GET    /bitacoras/:id                   # Obtener bitácora (incluye foto_rostro_url, firma_url, fotos_campo, pdf_actividades_url)
 POST   /bitacoras                       # Crear bitácora
 PATCH  /bitacoras/:id                   # Actualizar bitácora

 # Archivos multimedia de bitácora (FOTOS, FIRMAS, PDFs)
 POST   /bitacoras/:id/foto-rostro        # Subir foto del rostro del beneficiario
 GET    /bitacoras/:id/foto-rostro        # Obtener foto del rostro
 POST   /bitacoras/:id/firma             # Subir firma del beneficiario
 GET    /bitacoras/:id/firma              # Obtener firma
 POST   /bitacoras/:id/fotos-campo       # Subir fotos de campo (acepta múltiples)
 GET    /bitacoras/:id/fotos-campo       # Obtener lista de fotos de campo
 DELETE /bitacoras/:id/fotos-campo/:idx # Eliminar foto de campo por índice
 POST   /bitacoras/:id/pdf-actividades   # Subir PDF de actividades realizadas
 GET    /bitacoras/:id/pdf-actividades  # Obtener PDF de actividades
 DELETE /bitacoras/:id/pdf-actividades  # Eliminar PDF de actividades

 # PDF de bitácora (generado automáticamente)
 PATCH  /bitacoras/:id/pdf-config        # Configurar PDF
 GET    /bitacoras/:id/pdf               # Ver PDF
 GET    /bitacoras/:id/pdf/descargar    # Descargar PDF (incluye imágenes y firmas embebidas)
 POST   /bitacoras/:id/pdf/imprimir      # Imprimir PDF
 GET    /bitacoras/:id/versiones        # Listar versiones

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
 Beneficiarios             3     5      1      3      0     12  (+6 nuevos: foto-rostro, firma)
 Asignaciones              6     3      3      3      0     15
 Bitácoras                 5     4      2      2      0     13  (+6 nuevos: foto-rostro, firma, fotos-campo, pdf-actividades)
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
 TOTAL                    32    28     15     17     1     93

 ================================================================================
 NUEVOS ENDPOINTS (v1.1 - 2026-04-10)
 ================================================================================

 MÓDULO         ENDPOINT                              | DESCRIPCIÓN
 ---------------|-------------------------------------|------------------------------------
 Beneficiario   POST   /beneficiarios/:id/foto-rostro  | Foto del rostro para identificación
 Beneficiario   GET    /beneficiarios/:id/foto-rostro  | Obtener foto del rostro
 Beneficiario   DELETE /beneficiarios/:id/foto-rostro  | Eliminar foto del rostro
 Beneficiario   POST   /beneficiarios/:id/firma       | Firma del beneficiario
 Beneficiario   GET    /beneficiarios/:id/firma        | Obtener firma
 Beneficiario   DELETE /beneficiarios/:id/firma       | Eliminar firma
 Bitácora      POST   /bitacoras/:id/foto-rostro       | Subir foto del rostro
 Bitácora      GET    /bitacoras/:id/foto-rostro    | Obtener foto del rostro
 Bitácora      POST   /bitacoras/:id/firma            | Subir firma del beneficiario
 Bitácora      GET    /bitacoras/:id/firma         | Obtener firma
 Bitácora      POST   /bitacoras/:id/fotos-campo    | Subir fotos de campo (múltiples)
 Bitácora      GET    /bitacoras/:id/fotos-campo    | Obtener lista de fotos de campo
 Bitácora      DELETE /bitacoras/:id/fotos-campo/:idx | Eliminar foto de campo
 Bitácora      POST   /bitacoras/:id/pdf-actividades | Subir PDF de actividades
 Bitácora      GET    /bitacoras/:id/pdf-actividades | Obtener PDF de actividades
 Bitácora      DELETE /bitacoras/:id/pdf-actividades | Eliminar PDF de actividades

 ================================================================================
 CAMPOS REQUERIDOS EN RESPUESTAS API
 ================================================================================

 Beneficiario (GET /beneficiarios/:id):
   - foto_rostro_url: string (URL de la foto del rostro)
   - firma_url: string (URL de la firma)

 Bitácora (GET /bitacoras/:id):
   - foto_rostro_url: string (URL de la foto del rostro del beneficiary)
   - firma_url: string (URL de la firma del beneficiary)
   - fotos_campo: array[{ url, label, tipo? }]
   - pdf_actividades_url: string (URL del PDF de actividades)

 PDF de bitácora (/bitacoras/:id/pdf y /descargar):
   - Debe incluir embebidas: foto_rostro, firma, fotos_campo, pdf_actividades

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
 Fotos/firmas en bitácoras                  | AGREGAR: foto-rostro, firma, fotos-campo, pdf-actividades
