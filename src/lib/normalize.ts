function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function findNestedValue(
  source: unknown,
  matcher: (value: unknown) => boolean,
  visited = new WeakSet<object>(),
): unknown {
  if (matcher(source)) return source
  if (!isObjectRecord(source)) return undefined
  if (visited.has(source)) return undefined

  visited.add(source)

  for (const value of Object.values(source)) {
    const found = findNestedValue(value, matcher, visited)
    if (found !== undefined) return found
  }

  return undefined
}

function getByPath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!isObjectRecord(current)) return undefined
      return current[segment]
    }, source)
}

function findNestedPropertyValue(
  source: unknown,
  key: string,
  matcher: (value: unknown) => boolean,
  visited = new WeakSet<object>(),
): unknown {
  if (!isObjectRecord(source)) return undefined
  if (visited.has(source)) return undefined

  visited.add(source)

  const directValue = source[key]
  if (matcher(directValue)) return directValue

  for (const value of Object.values(source)) {
    const found = findNestedPropertyValue(value, key, matcher, visited)
    if (found !== undefined) return found
  }

  return undefined
}

export function pickArray<T>(source: unknown, keys: string[] = []): T[] {
  if (Array.isArray(source)) return source as T[]
  if (!isObjectRecord(source)) return []

  for (const key of keys) {
    const directValue = getByPath(source, key)
    if (Array.isArray(directValue)) return directValue as T[]

    const nestedValue = findNestedPropertyValue(source, key, Array.isArray)
    if (Array.isArray(nestedValue)) return nestedValue as T[]
  }

  const fallbackNestedArray = findNestedValue(source, Array.isArray)
  return Array.isArray(fallbackNestedArray) ? fallbackNestedArray as T[] : []
}

export function pickNumber(source: unknown, keys: string[], fallback = 0): number {
  if (!isObjectRecord(source)) return fallback

  for (const key of keys) {
    const directValue = getByPath(source, key)
    if (typeof directValue === 'number' && Number.isFinite(directValue)) return directValue

    const nestedValue = findNestedPropertyValue(
      source,
      key,
      (value) => typeof value === 'number' && Number.isFinite(value),
    )
    if (typeof nestedValue === 'number' && Number.isFinite(nestedValue)) return nestedValue
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
