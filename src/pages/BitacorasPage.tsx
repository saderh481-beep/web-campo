import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bitacorasService } from '../lib/servicios/bitacoras'
import { getApiErrorMessage } from '../lib/axios'
import { dedupeAssets, firstUrl, isRecord, normalizeAssets } from '../lib/assets'
import type { AssetItem } from '../lib/assets'
import { pickArray } from '../lib/normalize'
import { FileText, Download, Eye, X, Pencil, Save, Image as ImageIcon, Link as LinkIcon, Printer, MapPin } from 'lucide-react'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface Bitacora {
  id: number | string
  beneficiario_nombre?: string
  beneficiario?: string
  beneficiario_municipio?: string
  beneficiario_localidad?: string
  tecnico_nombre?: string
  tecnico?: string
  usuario_nombre?: string
  usuario?: string
  fecha?: string
  fecha_inicio?: string
  creado_en?: string
  created_at?: string
  estado?: string
  tipo?: string
  notas?: string
  observaciones?: string
  observaciones_coordinador?: string
  actividades_realizadas?: string
  actividades_desc?: string
  actividad?: string
  ubicacion?: string
  geolocalizacion?: string
  latitud?: number | string
  longitud?: number | string
  pdf_url?: string
  pdf_secure_url?: string
  pdf_download_url?: string
  documento_url?: string
  archivo_pdf_url?: string
  reporte_url?: string
  imagenes?: unknown[]
  imagenes_urls?: string[]
  fotos?: unknown[]
  evidencias?: unknown[]
  adjuntos?: unknown[]
  archivos?: unknown[]
  documentos?: unknown[]
}

function getPdfLinks(bit: unknown, id: string | number) {
  const viewUrl = firstUrl(bit, ['pdf_url', 'pdf_secure_url', 'reporte_url', 'documento_url', 'archivo_pdf_url']) ?? bitacorasService.pdfUrl(id)
  const downloadUrl = firstUrl(bit, ['pdf_download_url', 'download_url', 'pdf_url', 'pdf_secure_url', 'reporte_url', 'documento_url', 'archivo_pdf_url']) ?? bitacorasService.pdfDownloadUrl(id)
  return { viewUrl, downloadUrl }
}

function getBitacoraAssets(bit: unknown): AssetItem[] {
  if (!isRecord(bit)) return []

  return dedupeAssets([
    normalizeAssets(bit.imagenes, 'imagenes'),
    normalizeAssets(bit.imagenes_urls, 'imagenes-url'),
    normalizeAssets(bit.fotos, 'fotos'),
    normalizeAssets(bit.evidencias, 'evidencias'),
    normalizeAssets(bit.adjuntos, 'adjuntos'),
    normalizeAssets(bit.archivos, 'archivos'),
    normalizeAssets(bit.documentos, 'documentos'),
  ])
}

function pickBitacoraText(bit: unknown, keys: string[]): string | null {
  if (!isRecord(bit)) return null
  for (const key of keys) {
    const value = bit[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (isRecord(value)) {
      const nested = pickBitacoraText(value, ['nombre', 'name', 'descripcion', 'direccion'])
      if (nested) return nested
    }
  }
  return null
}

function getBitacoraDateTime(bit: unknown): string | null {
  return pickBitacoraText(bit, ['fecha_inicio', 'creado_en', 'created_at', 'fecha', 'registrado_en'])
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
}

function getBitacoraLocation(bit: unknown): string | null {
  const explicit = pickBitacoraText(bit, ['geolocalizacion', 'ubicacion', 'direccion', 'coord_parcela'])
  if (explicit) return explicit

  if (!isRecord(bit)) return null
  const nestedLocation = isRecord(bit.ubicacion) ? bit.ubicacion : null
  const lat = bit.latitud ?? bit.lat ?? nestedLocation?.latitud ?? nestedLocation?.lat
  const lng = bit.longitud ?? bit.lng ?? bit.lon ?? nestedLocation?.longitud ?? nestedLocation?.lng ?? nestedLocation?.lon
  if ((typeof lat === 'string' || typeof lat === 'number') && (typeof lng === 'string' || typeof lng === 'number')) {
    return `${lat}, ${lng}`
  }
  return null
}

function matchesText(value: string | null | undefined, query: string): boolean {
  if (!query.trim()) return true
  return value?.toLowerCase().includes(query.trim().toLowerCase()) ?? false
}

function BitacoraDetalle({ id, onClose }: { id: number | string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['bitacora', id],
    queryFn: () => bitacorasService.get(id).then(r => r.data),
  })
  const [editNotas, setEditNotas] = useState(false)
  const [notas, setNotas] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const bit = data

  const pdfLinks = useMemo(() => getPdfLinks(bit, id), [bit, id])
  const assets = useMemo(() => getBitacoraAssets(bit), [bit])
  const imageAssets = assets.filter((asset) => asset.kind === 'image')
  const fileAssets = assets.filter((asset) => asset.kind !== 'image')
  const bitacoraDateTime = getBitacoraDateTime(bit)
  const bitacoraLocation = getBitacoraLocation(bit)
  const registradoPor = pickBitacoraText(bit, ['usuario_nombre', 'usuario', 'tecnico_nombre', 'tecnico', 'registrado_por', 'created_by'])
  const beneficiarioDetalle = [pickBitacoraText(bit, ['beneficiario_nombre', 'beneficiario']), pickBitacoraText(bit, ['beneficiario_municipio', 'municipio']), pickBitacoraText(bit, ['beneficiario_localidad', 'localidad'])]
    .filter(Boolean)
    .join(' · ')

  const saveNotas = useMutation({
    mutationFn: () => bitacorasService.update(id, { observaciones: notas }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bitacora', id] })
      setFeedback({ kind: 'success', message: 'Notas actualizadas correctamente.' })
      setEditNotas(false)
    },
    onError: () => setFeedback({ kind: 'error', message: 'No se pudieron actualizar las notas.' }),
  })

  const imprimirPdf = useMutation({
    mutationFn: () => bitacorasService.imprimirPdf(id),
    onSuccess: () => setFeedback({ kind: 'success', message: 'PDF enviado a impresión correctamente.' }),
    onError: (error: unknown) => setFeedback({ kind: 'error', message: getApiErrorMessage(error, 'No se pudo imprimir el PDF.') }),
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>Bitácora #{id}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a href={pdfLinks.viewUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              <Eye size={13} /> Ver PDF
            </a>
            <a href={pdfLinks.downloadUrl} download className="btn btn-primary btn-sm">
              <Download size={13} /> Descargar
            </a>
            <button className="btn btn-secondary btn-sm" onClick={() => imprimirPdf.mutate()} disabled={imprimirPdf.isPending}>
              {imprimirPdf.isPending ? <><span className="spinner" />Imprimiendo...</> : <><Printer size={13} /> Imprimir</>}
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="modal-body modal-body-scroll">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[60, 40, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 20, width: `${w}%` }} />)}
            </div>
          ) : !bit ? <p>No encontrado</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Beneficiario', beneficiarioDetalle || '—'],
                  ['Usuario registro', registradoPor ?? '—'],
                  ['Fecha y hora', formatDateTime(bitacoraDateTime)],
                  ['Estado', bit.estado ?? '—'],
                  ['Tipo', bit.tipo ?? '—'],
                  ['Actividad', bit.actividad ?? '—'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v as string}</div>
                  </div>
                ))}
              </div>

              <div className="card modal-soft-section" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Geolocalización</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-700)' }}>
                  <MapPin size={14} />
                  <span>{bitacoraLocation ?? 'No disponible en este registro.'}</span>
                </div>
              </div>

              {imageAssets.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Imágenes y evidencias</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {imageAssets.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                      >
                        <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
                          <img src={asset.url} alt={asset.label} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', background: 'var(--gray-100)' }} />
                          <div style={{ padding: 8, fontSize: 12, fontWeight: 500, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ImageIcon size={13} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.label}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {fileAssets.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Archivos adjuntos</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fileAssets.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)', background: 'white', textDecoration: 'none', color: 'var(--gray-700)' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {asset.kind === 'pdf' ? <FileText size={15} /> : <LinkIcon size={15} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.label}</span>
                        </span>
                        <span className="badge badge-guinda">Abrir</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Notas</div>
                  {bit.estado === 'borrador' && !editNotas && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setNotas(bit.notas ?? bit.observaciones ?? bit.observaciones_coordinador ?? ''); setEditNotas(true) }}>
                      <Pencil size={12} /> Editar
                    </button>
                  )}
                </div>
                {feedback && <div style={{ marginBottom: 8 }}><FeedbackBanner kind={feedback.kind} message={feedback.message} compact /></div>}
                {editNotas ? (
                  <>
                    <textarea className="input" rows={4} value={notas} onChange={e => setNotas(e.target.value)} style={{ resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => saveNotas.mutate()} disabled={saveNotas.isPending}>
                        {saveNotas.isPending ? <span className="spinner" /> : <Save size={12} />} Guardar
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditNotas(false)}>Cancelar</button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, background: 'var(--gray-50)', padding: 12, borderRadius: 6 }}>
                    {bit.notas ?? bit.observaciones ?? bit.observaciones_coordinador ?? bit.actividades_realizadas ?? bit.actividades_desc ?? <em style={{ color: 'var(--gray-300)' }}>Sin notas</em>}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BitacorasPage() {
  const [filtros, setFiltros] = useState<{ mes?: string; anio?: number; estado?: string; tipo?: string; tecnico_id?: string }>({})
  const [beneficiarioFiltro, setBeneficiarioFiltro] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [detalle, setDetalle] = useState<string | number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bitacoras', filtros],
    queryFn: () => {
      const params: Record<string, unknown> = { ...filtros }
      if (params.mes) {
        const [anio, mesNum] = String(params.mes).split('-').map(Number)
        params.mes = mesNum
        params.anio = anio
      }
      return bitacorasService.list(params as Parameters<typeof bitacorasService.list>[0]).then(r => r.data)
    },
    staleTime: 30000,
  })

  const bitacoras = pickArray<Bitacora>(data, ['bitacoras', 'rows', 'data'])
  const bitacorasFiltradas = bitacoras.filter((bitacora) => {
    const beneficiario = bitacora.beneficiario_nombre ?? bitacora.beneficiario ?? ''
    const usuario = bitacora.usuario_nombre ?? bitacora.usuario ?? bitacora.tecnico_nombre ?? bitacora.tecnico ?? ''
    const fecha = getBitacoraDateTime(bitacora)
    const parsedFecha = fecha ? new Date(fecha) : null
    const parsedDesde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null
    const parsedHasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null

    const matchesBeneficiario = matchesText(beneficiario, beneficiarioFiltro)
    const matchesUsuario = matchesText(usuario, usuarioFiltro)
    const matchesDesde = !parsedDesde || !parsedFecha || parsedFecha >= parsedDesde
    const matchesHasta = !parsedHasta || !parsedFecha || parsedFecha <= parsedHasta

    return matchesBeneficiario && matchesUsuario && matchesDesde && matchesHasta
  })

  const estadoColor: Record<string, string> = {
    firmada: 'green', borrador: 'amber', cancelada: 'red', pendiente: 'gray',
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bitácoras</h1>
          <p className="page-subtitle">{bitacorasFiltradas.length} registro{bitacorasFiltradas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FeedbackBanner
          kind="info"
          compact
          message="Puedes filtrar por rango de fechas, usuario y beneficiario antes de descargar o mandar a imprimir cada PDF."
        />
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Mes</label>
          <input className="input" type="month" style={{ width: 160 }}
            value={filtros.mes ?? ''}
            onChange={e => setFiltros(p => ({ ...p, mes: e.target.value || undefined }))} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Estado</label>
          <select className="input" style={{ width: 140 }}
            value={filtros.estado ?? ''}
            onChange={e => setFiltros(p => ({ ...p, estado: e.target.value || undefined }))}>
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="firmada">Firmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Tipo</label>
          <select className="input" style={{ width: 140 }}
            value={filtros.tipo ?? ''}
            onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value || undefined }))}>
            <option value="">Todos</option>
            <option value="A">Tipo A</option>
            <option value="B">Tipo B</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Beneficiario</label>
          <input className="input" style={{ width: 220 }} value={beneficiarioFiltro} onChange={e => setBeneficiarioFiltro(e.target.value)} placeholder="Buscar beneficiario" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Usuario</label>
          <input className="input" style={{ width: 220 }} value={usuarioFiltro} onChange={e => setUsuarioFiltro(e.target.value)} placeholder="Buscar usuario o técnico" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Desde</label>
          <input className="input" type="date" style={{ width: 170 }} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label className="form-label">Hasta</label>
          <input className="input" type="date" style={{ width: 170 }} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        {(filtros.mes || filtros.estado || filtros.tipo || beneficiarioFiltro || usuarioFiltro || fechaDesde || fechaHasta) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFiltros({}); setBeneficiarioFiltro(''); setUsuarioFiltro(''); setFechaDesde(''); setFechaHasta('') }}>
            <X size={13} /> Limpiar filtros
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Beneficiario</th><th>Técnico</th><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(6).fill(0).map((_, i) => (
              <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : bitacorasFiltradas.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><FileText size={32} /><p>Sin bitácoras con los filtros seleccionados</p></div></td></tr>
            ) : bitacorasFiltradas.map(b => {
              const pdfLinks = getPdfLinks(b, b.id)
              return (
                <tr key={b.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 700 }}>#{b.id}</td>
                  <td style={{ fontWeight: 600 }}>{b.beneficiario_nombre ?? b.beneficiario ?? '—'}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{b.usuario_nombre ?? b.usuario ?? b.tecnico_nombre ?? b.tecnico ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{formatDateTime(getBitacoraDateTime(b))}</td>
                  <td>{b.tipo ? <span className="badge badge-guinda">{b.tipo}</span> : '—'}</td>
                  <td>
                    <span className={`badge badge-${estadoColor[b.estado ?? ''] ?? 'gray'}`}>
                      {b.estado ?? 'borrador'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Ver detalle" onClick={() => setDetalle(b.id)}>
                        <Eye size={13} />
                      </button>
                      <a href={pdfLinks.downloadUrl} download className="btn btn-ghost btn-icon btn-sm" title="Descargar PDF">
                        <Download size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detalle !== null && <BitacoraDetalle id={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}

