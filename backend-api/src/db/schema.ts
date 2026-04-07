import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey(),
  correo: text('correo').notNull().unique(),
  nombre: text('nombre').notNull(),
  rol: text('rol', { enum: ['administrador', 'coordinador', 'tecnico'] }).notNull(),
  telefono: text('telefono'),
  coordinadorId: text('coordinador_id'),
  fechaLimite: text('fecha_limite'),
  codigoAcceso: text('codigo_acceso'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const tecnicos = sqliteTable('tecnicos', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  correo: text('correo'),
  telefono: text('telefono'),
  coordinadorId: text('coordinador_id'),
  fechaLimite: text('fecha_limite'),
  codigoAcceso: text('codigo_acceso'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const beneficiarios = sqliteTable('beneficiarios', {
  id: text('id').primaryKey(),
  tecnicoId: text('tecnico_id').notNull(),
  nombre: text('nombre').notNull(),
  municipio: text('municipio'),
  localidad: text('localidad'),
  localidadId: text('localidad_id'),
  direccion: text('direccion'),
  cp: text('cp'),
  telefonoPrincipal: text('telefono_principal'),
  telefonoSecundario: text('telefono_secundario'),
  coordParcela: text('coord_parcela'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const cadenasProductivas = sqliteTable('cadenas_productivas', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const beneficiarioCadenas = sqliteTable('beneficiario_cadenas', {
  id: text('id').primaryKey(),
  beneficiarioId: text('beneficiario_id').notNull(),
  cadenaId: text('cadena_id').notNull(),
  createdAt: text('created_at').notNull(),
})

export const actividades = sqliteTable('actividades', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const localidades = sqliteTable('localidades', {
  id: text('id').primaryKey(),
  municipio: text('municipio').notNull(),
  nombre: text('nombre').notNull(),
  cp: text('cp'),
  zonaId: text('zona_id'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const zonas = sqliteTable('zonas', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const asignacionesCoordinadorTecnico = sqliteTable('asignaciones_coordinador_tecnico', {
  id: text('id').primaryKey(),
  coordinadorId: text('coordinador_id').notNull(),
  tecnicoId: text('tecnico_id').notNull(),
  fechaLimite: text('fecha_limite'),
  estadoCorte: text('estado_corte', { enum: ['en_servicio', 'suspendido'] }).notNull().default('en_servicio'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const asignacionesBeneficiario = sqliteTable('asignaciones_beneficiario', {
  id: text('id').primaryKey(),
  tecnicoId: text('tecnico_id').notNull(),
  beneficiarioId: text('beneficiario_id').notNull(),
  asignadoPor: text('asignado_por').notNull(),
  asignadoEn: text('asignado_en').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const asignacionesActividad = sqliteTable('asignaciones_actividad', {
  id: text('id').primaryKey(),
  tecnicoId: text('tecnico_id').notNull(),
  actividadId: text('actividad_id').notNull(),
  asignadoPor: text('asignado_por').notNull(),
  asignadoEn: text('asignado_en').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const bitacoras = sqliteTable('bitacoras', {
  id: text('id').primaryKey(),
  tipo: text('tipo', { enum: ['visita', 'asesoria', 'seguimiento'] }).notNull(),
  tecnicoId: text('tecnico_id').notNull(),
  beneficiarioId: text('beneficiario_id'),
  cadenaProductivaId: text('cadena_productiva_id'),
  actividadId: text('actividad_id'),
  fechaInicio: text('fecha_inicio').notNull(),
  fechaFin: text('fecha_fin'),
  actividadesDesc: text('actividades_desc'),
  recomendaciones: text('recomendaciones'),
  comentariosBeneficiario: text('comentarios_beneficiario'),
  coordinacionInterinst: integer('coordinacion_interinst', { mode: 'boolean' }),
  observacionesCoordinador: text('observaciones_coordinador'),
  estado: text('estado', { enum: ['borrador', 'enviado', 'revisado', 'aprobado'] }).notNull().default('borrador'),
  pdfEdicion: text('pdf_edicion'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const documentos = sqliteTable('documentos', {
  id: text('id').primaryKey(),
  beneficiarioId: text('beneficiario_id').notNull(),
  tipo: text('tipo').notNull(),
  nombreOriginal: text('nombre_original').notNull(),
  r2Key: text('r2_key').notNull(),
  sha256: text('sha256').notNull(),
  bytes: integer('bytes').notNull(),
  subidoPor: text('subido_por').notNull(),
  createdAt: text('created_at').notNull(),
})

export const documentosPdf = sqliteTable('documentos_pdf', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  tipo: text('tipo').notNull(),
  url: text('url').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const configuraciones = sqliteTable('configuraciones', {
  id: text('id').primaryKey(),
  clave: text('clave').notNull().unique(),
  valor: text('valor').notNull(),
  descripcion: text('descripcion'),
  updatedBy: text('updated_by'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const notificaciones = sqliteTable('notificaciones', {
  id: text('id').primaryKey(),
  destinoId: text('destino_id').notNull(),
  destinoTipo: text('destino_tipo', { enum: ['usuario', 'tecnico'] }).notNull(),
  tipo: text('tipo').notNull(),
  titulo: text('titulo').notNull(),
  cuerpo: text('cuerpo'),
  leido: integer('leido', { mode: 'boolean' }).notNull().default(false),
  enviadoPush: integer('enviado_push', { mode: 'boolean' }).notNull().default(false),
  enviadoEmail: integer('enviado_email', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
})

export const authLogs = sqliteTable('auth_logs', {
  id: text('id').primaryKey(),
  usuarioId: text('usuario_id'),
  correo: text('correo').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  exitoso: integer('exitoso', { mode: 'boolean' }).notNull(),
  motivo: text('motivo'),
  createdAt: text('created_at').notNull(),
})

export const reportes = sqliteTable('reportes', {
  id: text('id').primaryKey(),
  tipo: text('tipo').notNull(),
  params: text('params'),
  generadoPor: text('generado_por').notNull(),
  archivoUrl: text('archivo_url'),
  estado: text('estado').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const archive = sqliteTable('archive', {
  id: text('id').primaryKey(),
  periodo: text('periodo').notNull().unique(),
  totalBitacoras: integer('total_bitacoras').notNull(),
  totalFotos: integer('total_fotos').notNull(),
  bytesComprimidos: integer('bytes_comprimidos').notNull(),
  estado: text('estado', { enum: ['generando', 'completado', 'confirmado', 'error'] }).notNull(),
  zipPublicUrl: text('zip_public_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const bitacoraVersiones = sqliteTable('bitacora_versiones', {
  id: text('id').primaryKey(),
  bitacoraId: text('bitacora_id').notNull(),
  version: integer('version').notNull(),
  r2Key: text('r2_key').notNull(),
  sha256: text('sha256').notNull(),
  inmutable: integer('inmutable', { mode: 'boolean' }).notNull().default(false),
  generadoPor: text('generado_por').notNull(),
  createdAt: text('created_at').notNull(),
})

export const documentosPlantilla = sqliteTable('documentos_plantilla', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  tipo: text('tipo').notNull(),
  obligatorio: integer('obligatorio', { mode: 'boolean' }).notNull().default(false),
  orden: integer('orden').notNull().default(0),
  configuracion: text('configuracion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const relaciones = {
  usuarios: relations(usuarios, ({ one }) => ({
    coordinador: one(usuarios, {
      fields: [usuarios.coordinadorId],
      references: [usuarios.id],
    }),
  })),
  tecnicos: relations(tecnicos, ({ one }) => ({
    coordinador: one(usuarios, {
      fields: [tecnicos.coordinadorId],
      references: [usuarios.id],
    }),
  })),
  beneficiarios: relations(beneficiarios, ({ one, many }) => ({
    tecnico: one(tecnicos, {
      fields: [beneficiarios.tecnicoId],
      references: [tecnicos.id],
    }),
    localidad: one(localidades, {
      fields: [beneficiarios.localidadId],
      references: [localidades.id],
    }),
    cadenas: many(beneficiarioCadenas),
    documentos: many(documentos),
  })),
  cadenasProductivas: relations(cadenasProductivas, ({ many }) => ({
    beneficiarioCadenas: many(beneficiarioCadenas),
  })),
  localidades: relations(localidades, ({ one }) => ({
    zona: one(zonas, {
      fields: [localidades.zonaId],
      references: [zonas.id],
    }),
  })),
  bitacoras: relations(bitacoras, ({ one }) => ({
    tecnico: one(tecnicos, {
      fields: [bitacoras.tecnicoId],
      references: [tecnicos.id],
    }),
    beneficiario: one(beneficiarios, {
      fields: [bitacoras.beneficiarioId],
      references: [beneficiarios.id],
    }),
    cadena: one(cadenasProductivas, {
      fields: [bitacoras.cadenaProductivaId],
      references: [cadenasProductivas.id],
    }),
    actividad: one(actividades, {
      fields: [bitacoras.actividadId],
      references: [actividades.id],
    }),
  })),
}
