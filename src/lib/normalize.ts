export function pickArray<T>(source: unknown, keys: string[] = []): T[] {
  if (Array.isArray(source)) return source as T[]
  if (!source || typeof source !== 'object') return []

  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) return value as T[]
  }
  return []
}

export function pickNumber(source: unknown, keys: string[], fallback = 0): number {
  if (!source || typeof source !== 'object') return fallback
  const record = source as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return fallback
}

type AnyRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function pickString(source: AnyRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = asString(source[key])
    if (val) return val
  }
  return undefined
}

export interface NormalizedActividad {
  id: string
  tecnico_id?: string
  tecnico_nombre?: string
  beneficiario_id?: string
  beneficiario_nombre?: string
  tipo?: string
  descripcion?: string
  fecha?: string
  estado?: string
}

export interface NormalizedAsignacion {
  id: string
  tecnico_id?: string
  tecnico_nombre?: string
  beneficiario_id?: string
  beneficiario_nombre?: string
  fecha_inicio?: string
  fecha_fin?: string
  estado?: string
}

export function normalizeActividad(source: unknown): NormalizedActividad {
  const row = isRecord(source) ? source : {}
  const tecnico = isRecord(row.tecnico) ? row.tecnico : undefined
  const beneficiario = isRecord(row.beneficiario) ? row.beneficiario : undefined

  return {
    id: pickString(row, ['id', 'actividad_id', 'actividadId']) ?? '',
    tecnico_id: pickString(row, ['tecnico_id', 'tecnicoId']) ?? (tecnico ? pickString(tecnico, ['id']) : undefined),
    tecnico_nombre: pickString(row, ['tecnico_nombre', 'tecnicoNombre']) ?? (tecnico ? pickString(tecnico, ['nombre', 'name']) : undefined),
    beneficiario_id: pickString(row, ['beneficiario_id', 'beneficiarioId']) ?? (beneficiario ? pickString(beneficiario, ['id']) : undefined),
    beneficiario_nombre: pickString(row, ['beneficiario_nombre', 'beneficiarioNombre']) ?? (beneficiario ? pickString(beneficiario, ['nombre', 'name']) : undefined),
    tipo: pickString(row, ['tipo', 'actividad_tipo', 'actividadTipo']),
    descripcion: pickString(row, ['descripcion', 'detalle', 'detalles', 'observaciones']),
    fecha: pickString(row, ['fecha', 'fecha_actividad', 'fechaActividad', 'created_at', 'createdAt']),
    estado: pickString(row, ['estado', 'status']),
  }
}

export function normalizeAsignacion(source: unknown): NormalizedAsignacion {
  const row = isRecord(source) ? source : {}
  const tecnico = isRecord(row.tecnico) ? row.tecnico : undefined
  const beneficiario = isRecord(row.beneficiario) ? row.beneficiario : undefined

  return {
    id: pickString(row, ['id', 'asignacion_id', 'asignacionId']) ?? '',
    tecnico_id: pickString(row, ['tecnico_id', 'tecnicoId']) ?? (tecnico ? pickString(tecnico, ['id']) : undefined),
    tecnico_nombre: pickString(row, ['tecnico_nombre', 'tecnicoNombre']) ?? (tecnico ? pickString(tecnico, ['nombre', 'name']) : undefined),
    beneficiario_id: pickString(row, ['beneficiario_id', 'beneficiarioId']) ?? (beneficiario ? pickString(beneficiario, ['id']) : undefined),
    beneficiario_nombre: pickString(row, ['beneficiario_nombre', 'beneficiarioNombre']) ?? (beneficiario ? pickString(beneficiario, ['nombre', 'name']) : undefined),
    fecha_inicio: pickString(row, ['fecha_inicio', 'fechaInicio', 'inicio']),
    fecha_fin: pickString(row, ['fecha_fin', 'fechaFin', 'fin']),
    estado: pickString(row, ['estado', 'status']),
  }
}
