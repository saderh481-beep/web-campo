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
