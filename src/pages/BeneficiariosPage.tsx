import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { beneficiariosService } from '../lib/servicios/beneficiarios'
import { cadenasService, localidadesService } from '../lib/servicios/catalogos'
import { tecnicosService } from '../lib/servicios/tecnicos'
import { getApiErrorMessage } from '../lib/axios'
import { canAssignBeneficiarioCadenas, canUploadBeneficiarioDocumentos } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { dedupeAssets, isRecord, normalizeAssets } from '../lib/assets'
import type { AssetItem } from '../lib/assets'
import { pickArray, pickNumber } from '../lib/normalize'
import { Plus, Search, X, ChevronLeft, ChevronRight, Pencil, Paperclip, Upload, Download, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface Cadena {
  id: number | string
  nombre: string
}

interface Tecnico {
  id: number | string
  nombre: string
  correo?: string
}

interface Localidad {
  id: number | string
  municipio: string
  nombre: string
}

type CadenaRef = Cadena | number | string

interface Beneficiario {
  id: number | string
  nombre: string
  municipio?: string
  localidad?: string
  localidad_id?: string
  tecnico_id?: string
  tecnico_nombre?: string
  tecnico?: string
  cadenas?: CadenaRef[]
}

interface BeneficiariosResponse {
  beneficiarios?: Beneficiario[]
  total?: number
  per_page?: number
}

interface CadenasResponse {
  cadenas?: Cadena[]
}

interface TecnicosResponse {
  tecnicos?: Tecnico[]
}

interface BeneficiarioForm {
  nombre: string
  municipio: string
  localidad: string
  localidad_id: string
  direccion: string
  cp: string
  telefono_principal: string
  telefono_secundario: string
  coord_parcela: string
  tecnico_id: string
  cadenas_ids: string[]
}

const FORM_FIELDS: Array<{ key: keyof Pick<BeneficiarioForm, 'nombre' | 'municipio' | 'localidad' | 'direccion' | 'cp' | 'telefono_principal' | 'telefono_secundario' | 'coord_parcela'>; label: string; full?: boolean }> = [
  { key: 'nombre', label: 'Nombre completo', full: true },
  { key: 'municipio', label: 'Municipio' },
  { key: 'localidad', label: 'Localidad' },
  { key: 'direccion', label: 'Dirección', full: true },
  { key: 'cp', label: 'Código Postal' },
  { key: 'telefono_principal', label: 'Teléfono principal' },
  { key: 'telefono_secundario', label: 'Teléfono secundario' },
  { key: 'coord_parcela', label: 'Coord. parcela (x,y)', full: true },
]

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function normalizeInput(value: string): string {
  return value.trim()
}

function isValidPostalCode(value: string): boolean {
  return /^\d{5}$/.test(value)
}

function isValidCoordParcela(value: string): boolean {
  return /^\(?\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)?$/.test(value)
}

function getBeneficiarioAssets(source: unknown): AssetItem[] {
  if (Array.isArray(source)) return normalizeAssets(source, 'documentos-root')
  if (!isRecord(source)) return []

  return dedupeAssets([
    normalizeAssets(source.documentos, 'documentos'),
    normalizeAssets(source.archivos, 'archivos'),
    normalizeAssets(source.adjuntos, 'adjuntos'),
    normalizeAssets(source.imagenes, 'imagenes'),
    normalizeAssets(source.evidencias, 'evidencias'),
    normalizeAssets(source.items, 'items'),
    normalizeAssets(source.data, 'data'),
  ])
}

function DocumentosModal({ beneficiario, canUpload, onClose }: { beneficiario: Beneficiario; canUpload: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState('general')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiarios', beneficiario.id, 'documentos'],
    queryFn: () => beneficiariosService.getDocumentos(String(beneficiario.id)).then((r) => r.data),
    staleTime: 30000,
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Selecciona un archivo primero')
      const formData = new FormData()
      formData.append('archivo', selectedFile)
      formData.append('tipo', tipo)
      return beneficiariosService.subirDocumento(String(beneficiario.id), formData)
    },
    onSuccess: () => {
      setSelectedFile(null)
      setFeedback({ kind: 'success', message: 'Documento subido correctamente.' })
      qc.invalidateQueries({ queryKey: ['beneficiarios', beneficiario.id, 'documentos'] })
    },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, (e as Error).message || 'No se pudo subir el archivo') }),
  })

  const assets = useMemo(() => getBeneficiarioAssets(data), [data])
  const imageAssets = assets.filter((asset) => asset.kind === 'image')
  const fileAssets = assets.filter((asset) => asset.kind !== 'image')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>Documentos de {beneficiario.nombre}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body modal-body-scroll">
          {canUpload && (
            <div className="card modal-soft-section" style={{ marginBottom: 16, padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 160px auto', gap: 10, alignItems: 'center' }}>
                <input
                  className="input"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
                  <option value="general">General</option>
                  <option value="identificacion">Identificación</option>
                  <option value="comprobante">Comprobante</option>
                  <option value="pdf">PDF</option>
                  <option value="imagen">Imagen</option>
                </select>
                <button className="btn btn-primary" onClick={() => upload.mutate()} disabled={!selectedFile || upload.isPending}>
                  {upload.isPending ? <><span className="spinner" />Subiendo...</> : <><Upload size={14} /> Subir</>}
                </button>
              </div>
              {selectedFile && <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>Seleccionado: {selectedFile.name}</p>}
              {feedback && <div style={{ marginTop: 8 }}><FeedbackBanner kind={feedback.kind} message={feedback.message} compact /></div>}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {imageAssets.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Imágenes</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {imageAssets.map((asset) => (
                      <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
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
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Archivos</div>
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
                          {asset.kind === 'pdf' ? <Paperclip size={15} /> : <LinkIcon size={15} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.label}</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Download size={14} />
                          <span className="badge badge-guinda">Abrir</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {assets.length === 0 && (
                <div className="empty-state"><p>Este beneficiario aún no tiene documentos visibles.</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BeneficiarioModal({ b, cadenas, tecnicos, localidades, canAssignCadenas, onClose }: { b?: Beneficiario; cadenas: Cadena[]; tecnicos: Tecnico[]; localidades: Localidad[]; canAssignCadenas: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<BeneficiarioForm>({
    nombre: b?.nombre ?? '',
    municipio: b?.municipio ?? '',
    localidad: b?.localidad ?? '',
    localidad_id: b?.localidad_id ?? '',
    direccion: '',
    cp: '',
    telefono_principal: '',
    telefono_secundario: '',
    coord_parcela: '',
    tecnico_id: b?.tecnico_id ?? '',
    cadenas_ids: (b?.cadenas ?? []).map((c) => String(typeof c === 'object' ? c.id : c)),
  })
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      if (normalizeInput(form.nombre).length === 0) {
        throw new Error('Debes capturar el nombre del beneficiario.')
      }
      if (normalizeInput(form.municipio).length === 0) {
        throw new Error('Debes capturar el municipio.')
      }
      if (form.tecnico_id.trim().length === 0) {
        throw new Error('Debes seleccionar un técnico')
      }
      if (form.cp.trim() && !isValidPostalCode(form.cp.trim())) {
        throw new Error('El código postal debe tener exactamente 5 dígitos.')
      }
      if (form.coord_parcela.trim() && !isValidCoordParcela(form.coord_parcela.trim())) {
        throw new Error('La coordenada de parcela debe tener formato x,y o (x,y).')
      }

      const selectedLocalidad = localidades.find((item) => String(item.id) === form.localidad_id)

      const payload = {
        nombre: normalizeInput(form.nombre),
        municipio: normalizeInput(selectedLocalidad?.municipio ?? form.municipio),
        localidad: selectedLocalidad ? undefined : normalizeInput(form.localidad) || undefined,
        localidad_id: form.localidad_id || undefined,
        direccion: normalizeInput(form.direccion) || undefined,
        cp: normalizeInput(form.cp) || undefined,
        telefono_principal: normalizeInput(form.telefono_principal) || undefined,
        telefono_secundario: normalizeInput(form.telefono_secundario) || undefined,
        coord_parcela: normalizeInput(form.coord_parcela) || undefined,
        tecnico_id: form.tecnico_id.trim(),
      }

      const response = b
        ? await beneficiariosService.update(b.id, payload)
        : await beneficiariosService.create(payload)

      if (canAssignCadenas && form.cadenas_ids.length > 0) {
        const createdId = String((response.data as { id?: string | number })?.id ?? b?.id ?? '')
        if (createdId) {
          await beneficiariosService.asignarCadenas(createdId, form.cadenas_ids)
        }
      }

      return response
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiarios'] }); onClose() },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, (e as Error).message || 'Error al guardar') }),
  })

  const toggleCadena = (id: string) => setForm(p => ({
    ...p,
    cadenas_ids: p.cadenas_ids.includes(id) ? p.cadenas_ids.filter(c => c !== id) : [...p.cadenas_ids, id],
  }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>{b ? 'Editar beneficiario' : 'Nuevo beneficiario'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body modal-body-scroll">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {FORM_FIELDS.map(({ key, label, full }) => (
              <div key={key} className="form-group" style={full ? { gridColumn: '1/-1' } : {}}>
                <label className="form-label">{label}</label>
                <input className="input" value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Localidad (catálogo)</label>
              <select className="input" value={form.localidad_id} onChange={e => setForm(p => ({ ...p, localidad_id: e.target.value }))}>
                <option value="">Sin localidad</option>
                {localidades.map((loc) => (
                  <option key={loc.id} value={String(loc.id)}>
                    {loc.municipio} - {loc.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Técnico asignado</label>
              <select className="input" value={form.tecnico_id} onChange={e => setForm(p => ({ ...p, tecnico_id: e.target.value }))}>
                <option value="">Selecciona un técnico</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.nombre}{t.correo ? ` (${t.correo})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {canAssignCadenas && cadenas.length > 0 && (
            <div className="form-group">
              <label className="form-label">Cadenas productivas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cadenas.map((c) => {
                  const id = String(c.id)
                  return (
                    <button key={id} type="button"
                      style={{
                        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${form.cadenas_ids.includes(id) ? 'var(--guinda)' : 'var(--gray-200)'}`,
                        background: form.cadenas_ids.includes(id) ? 'var(--guinda-50)' : 'white',
                        color: form.cadenas_ids.includes(id) ? 'var(--guinda)' : 'var(--gray-500)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                      onClick={() => toggleCadena(id)}>{c.nombre}</button>
                  )
                })}
              </div>
            </div>
          )}
          {feedback && <FeedbackBanner kind={feedback.kind} message={feedback.message} compact />}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <><span className="spinner" />Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BeneficiariosPage() {
  const { user } = useAuth()
  const canAssignCadenas = canAssignBeneficiarioCadenas(user?.rol)
  const canUploadDocs = canUploadBeneficiarioDocumentos(user?.rol)
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'new' | Beneficiario | null>(null)
  const [docsModal, setDocsModal] = useState<Beneficiario | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiarios', { page, q }],
    queryFn: () => beneficiariosService.list({ page, q: q || undefined }).then(r => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  })

  const { data: cadenasData } = useQuery({
    queryKey: ['cadenas'],
    queryFn: () => cadenasService.list().then(r => r.data),
    staleTime: 300000,
  })

  const { data: tecnicosData } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosService.list().then(r => r.data),
    staleTime: 300000,
  })

  const { data: localidadesData } = useQuery({
    queryKey: ['localidades'],
    queryFn: () => localidadesService.list().then(r => r.data),
    staleTime: 300000,
  })

  const removeBeneficiario = useMutation({
    mutationFn: (id: string | number) => beneficiariosService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficiarios'] })
    },
  })

  const benefData = data as BeneficiariosResponse | Beneficiario[] | undefined
  const benefs = pickArray<Beneficiario>(benefData, ['beneficiarios', 'rows', 'data'])
  const total = Array.isArray(benefData) ? benefData.length : pickNumber(benefData, ['total'], benefs.length)
  const perPage = Array.isArray(benefData) ? 20 : pickNumber(benefData, ['per_page'], 20)
  const pages = Math.ceil(total / perPage) || 1

  const rawCadenas = cadenasData as CadenasResponse | Cadena[] | undefined
  const cadenas = pickArray<Cadena>(rawCadenas, ['cadenas', 'rows', 'data'])

  const rawTecnicos = tecnicosData as TecnicosResponse | Tecnico[] | undefined
  const tecnicos = pickArray<Tecnico>(rawTecnicos, ['tecnicos', 'rows', 'data'])

  const localidades = pickArray<Localidad>(localidadesData as unknown, ['localidades', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficiarios</h1>
          <p className="page-subtitle">{total} beneficiario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Nuevo beneficiario
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FeedbackBanner
          kind="info"
          compact
          message="Actualización API: el acceso de coordinador se filtra por técnico asignado y la asignación de beneficiario se sincroniza automáticamente al crear/reasignar técnico."
        />
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <input className="input" style={{ border: 'none', padding: 0, boxShadow: 'none' }}
          placeholder="Buscar por nombre o municipio..." value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }} />
        {q && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQ('')}><X size={14} /></button>}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Nombre</th><th>Municipio</th><th>Localidad</th><th>Técnico</th><th>Cadenas</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(8).fill(0).map((_, i) => (
              <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : benefs.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><p>Sin beneficiarios</p></div></td></tr>
            ) : benefs.map((b, i) => (
              <tr key={b.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{(page - 1) * perPage + i + 1}</td>
                <td style={{ fontWeight: 600 }}>{b.nombre}</td>
                <td>{b.municipio ?? '—'}</td>
                <td>{b.localidad ?? '—'}</td>
                <td>{b.tecnico_nombre ?? b.tecnico ?? b.tecnico_id ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(b.cadenas ?? []).map((c) => {
                      const id = typeof c === 'object' ? c.id : c
                      return (
                        <span key={id} className="badge badge-dorado">
                          {typeof c === 'object' ? c.nombre : c}
                        </span>
                      )
                    })}
                    {(!b.cadenas || b.cadenas.length === 0) && <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>—</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Documentos" onClick={() => setDocsModal(b)}><Paperclip size={13} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => setModal(b)}><Pencil size={13} /></button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Desactivar"
                      style={{ color: 'var(--danger)' }}
                      disabled={removeBeneficiario.isPending}
                      onClick={() => confirm(`¿Desactivar a ${b.nombre}?`) && removeBeneficiario.mutate(b.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} /> Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Página {page} de {pages}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      )}

      {modal && (
        <BeneficiarioModal
          b={modal === 'new' ? undefined : modal}
          cadenas={cadenas}
          tecnicos={tecnicos}
          localidades={localidades}
          canAssignCadenas={canAssignCadenas}
          onClose={() => setModal(null)}
        />
      )}

      {docsModal && <DocumentosModal beneficiario={docsModal} canUpload={canUploadDocs} onClose={() => setDocsModal(null)} />}
    </div>
  )
}
