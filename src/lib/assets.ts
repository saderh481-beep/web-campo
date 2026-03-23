export interface AssetItem {
  id: string
  url: string
  label: string
  kind: 'image' | 'pdf' | 'file'
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

export function firstUrl(source: unknown, keys: string[]): string | undefined {
  if (!isRecord(source)) return undefined

  for (const key of keys) {
    const value = source[key]
    if (isUrl(value)) return value

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isUrl(item)) return item
        if (isRecord(item)) {
          const nested = firstUrl(item, ['secure_url', 'url', 'download_url', 'pdf_url', 'pdf_secure_url', 'archivo_url', 'documento_url', 'src'])
          if (nested) return nested
        }
      }
    }

    if (isRecord(value)) {
      const nested = firstUrl(value, ['secure_url', 'url', 'download_url', 'pdf_url', 'pdf_secure_url', 'archivo_url', 'documento_url', 'src'])
      if (nested) return nested
    }
  }

  return undefined
}

export function getAssetKind(url: string, raw?: Record<string, unknown>): AssetItem['kind'] {
  const mime = typeof raw?.mime_type === 'string' ? raw.mime_type.toLowerCase() : ''
  const ext = url.split('?')[0].toLowerCase()
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(ext)) return 'image'
  if (mime === 'application/pdf' || /\.pdf$/.test(ext)) return 'pdf'
  return 'file'
}

export function assetLabel(raw: Record<string, unknown> | undefined, fallback: string): string {
  if (!raw) return fallback
  const candidates = [raw.nombre, raw.name, raw.titulo, raw.title, raw.filename, raw.original_filename, raw.public_id]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate
  }
  return fallback
}

export function normalizeAssets(source: unknown, idPrefix: string): AssetItem[] {
  if (!Array.isArray(source)) return []

  return source.flatMap((item, index) => {
    if (isUrl(item)) {
      return [{
        id: `${idPrefix}-${index}`,
        url: item,
        label: `Archivo ${index + 1}`,
        kind: getAssetKind(item),
      }]
    }

    if (!isRecord(item)) return []

    const url = firstUrl(item, ['secure_url', 'url', 'download_url', 'pdf_url', 'pdf_secure_url', 'archivo_url', 'documento_url', 'src'])
    if (!url) return []

    return [{
      id: String(item.id ?? `${idPrefix}-${index}`),
      url,
      label: assetLabel(item, `Archivo ${index + 1}`),
      kind: getAssetKind(url, item),
    }]
  })
}

export function dedupeAssets(groups: AssetItem[][]): AssetItem[] {
  const seen = new Set<string>()
  return groups.flat().filter((asset) => {
    if (seen.has(asset.url)) return false
    seen.add(asset.url)
    return true
  })
}
