import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bitacorasApi } from '../lib/api'
import { dedupeAssets, firstUrl, isRecord, normalizeAssets } from '../lib/assets'
import type { AssetItem } from '../lib/assets'
import { pickArray } from '../lib/normalize'
import { FileText, Download, Eye, X, Pencil, Save, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'

interface Bitacora {
  id: number | string
  beneficiario_nombre?: string
  beneficiario?: string
  tecnico_nombre?: string
  tecnico?: string
  fecha?: string
  estado?: string
  tipo?: string
  notas?: string
  observaciones?: string
  observaciones_coordinador?: string
  actividades_realizadas?: string
  actividades_desc?: string
  actividad?: string
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
  const viewUrl = firstUrl(bit, ['pdf_url', 'pdf_secure_url', 'reporte_url', 'documento_url', 'archivo_pdf_url']) ?? bitacorasApi.pdfUrl(id)
  const downloadUrl = firstUrl(bit, ['pdf_download_url', 'download_url', 'pdf_url', 'pdf_secure_url', 'reporte_url', 'documento_url', 'archivo_pdf_url']) ?? bitacorasApi.pdfDownloadUrl(id)
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

function BitacoraDetalle({ id, onClose }: { id: number | string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['bitacora', id],
    queryFn: () => bitacorasApi.get(id).then(r => r.data),
  })
  const [editNotas, setEditNotas] = useState(false)
  const [notas, setNotas] = useState('')
  const bit = data?.bitacora ?? data

  const pdfLinks = useMemo(() => getPdfLinks(bit, id), [bit, id])
  const assets = useMemo(() => getBitacoraAssets(bit), [bit])
  const imageAssets = assets.filter((asset) => asset.kind === 'image')
  const fileAssets = assets.filter((asset) => asset.kind !== 'image')

  const saveNotas = useMutation({
    mutationFn: () => bitacorasApi.update(id, { observaciones: notas }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bitacora', id] }); setEditNotas(false) },
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
                  ['Beneficiario', bit.beneficiario_nombre ?? bit.beneficiario ?? '—'],
                  ['Técnico', bit.tecnico_nombre ?? bit.tecnico ?? '—'],
                  ['Fecha', bit.fecha ? new Date(bit.fecha).toLocaleDateString('es-MX', { dateStyle: 'long' }) : '—'],
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
  const [filtros, setFiltros] = useState<{ mes?: string; estado?: string; tipo?: string }>({})
  const [detalle, setDetalle] = useState<string | number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bitacoras', filtros],
    queryFn: () => bitacorasApi.list(filtros).then(r => r.data),
    staleTime: 30000,
  })

  const bitacoras = pickArray<Bitacora>(data, ['bitacoras', 'rows', 'data'])

  const estadoColor: Record<string, string> = {
    firmada: 'green', borrador: 'amber', cancelada: 'red', pendiente: 'gray',
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bitácoras</h1>
          <p className="page-subtitle">{bitacoras.length} registro{bitacoras.length !== 1 ? 's' : ''}</p>
        </div>
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
        {(filtros.mes || filtros.estado || filtros.tipo) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({})}>
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
            )) : bitacoras.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><FileText size={32} /><p>Sin bitácoras con los filtros seleccionados</p></div></td></tr>
            ) : bitacoras.map(b => {
              const pdfLinks = getPdfLinks(b, b.id)
              return (
                <tr key={b.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 700 }}>#{b.id}</td>
                  <td style={{ fontWeight: 600 }}>{b.beneficiario_nombre ?? b.beneficiario ?? '—'}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{b.tecnico_nombre ?? b.tecnico ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{b.fecha ? new Date(b.fecha).toLocaleDateString('es-MX') : '—'}</td>
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

