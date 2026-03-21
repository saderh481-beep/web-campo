import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { beneficiariosApi, cadenasApi, tecnicosApi } from '../lib/api'
import { pickArray, pickNumber } from '../lib/normalize'
import { Plus, Search, X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'

interface Cadena {
  id: number | string
  nombre: string
}

interface Tecnico {
  id: number | string
  nombre: string
  correo?: string
}

type CadenaRef = Cadena | number | string

interface Beneficiario {
  id: number | string
  nombre: string
  municipio?: string
  localidad?: string
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
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function BeneficiarioModal({ b, cadenas, tecnicos, onClose }: { b?: Beneficiario; cadenas: Cadena[]; tecnicos: Tecnico[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<BeneficiarioForm>({
    nombre: b?.nombre ?? '',
    municipio: b?.municipio ?? '',
    localidad: b?.localidad ?? '',
    direccion: '',
    cp: '',
    telefono_principal: '',
    telefono_secundario: '',
    coord_parcela: '',
    tecnico_id: b?.tecnico_id ?? '',
    cadenas_ids: (b?.cadenas ?? []).map((c) => String(typeof c === 'object' ? c.id : c)),
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      if (form.tecnico_id.trim().length === 0) {
        throw new Error('Debes seleccionar un técnico')
      }

      const payload = {
        nombre: form.nombre,
        municipio: form.municipio,
        localidad: form.localidad || undefined,
        direccion: form.direccion || undefined,
        cp: form.cp || undefined,
        telefono_principal: form.telefono_principal || undefined,
        telefono_secundario: form.telefono_secundario || undefined,
        coord_parcela: form.coord_parcela || undefined,
        tecnico_id: form.tecnico_id,
      }

      const response = b
        ? await beneficiariosApi.update(b.id, payload)
        : await beneficiariosApi.create(payload)

      if (form.cadenas_ids.length > 0) {
        const createdId = String((response.data as { id?: string | number })?.id ?? b?.id ?? '')
        if (createdId) {
          await beneficiariosApi.asignarCadenas(createdId, form.cadenas_ids)
        }
      }

      return response
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiarios'] }); onClose() },
    onError: (e: unknown) => setErr(toErrorMessage(e, (e as Error).message || 'Error al guardar')),
  })

  const toggleCadena = (id: string) => setForm(p => ({
    ...p,
    cadenas_ids: p.cadenas_ids.includes(id) ? p.cadenas_ids.filter(c => c !== id) : [...p.cadenas_ids, id],
  }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3>{b ? 'Editar beneficiario' : 'Nuevo beneficiario'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {FORM_FIELDS.map(({ key, label, full }) => (
              <div key={key} className="form-group" style={full ? { gridColumn: '1/-1' } : {}}>
                <label className="form-label">{label}</label>
                <input className="input" value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
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
          {cadenas.length > 0 && (
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
          {err && <p className="form-error">{err}</p>}
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
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'new' | Beneficiario | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiarios', { page, q }],
    queryFn: () => beneficiariosApi.list({ page, q: q || undefined }).then(r => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  })

  const { data: cadenasData } = useQuery({
    queryKey: ['cadenas'],
    queryFn: () => cadenasApi.list().then(r => r.data),
    staleTime: 300000,
  })

  const { data: tecnicosData } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosApi.list().then(r => r.data),
    staleTime: 300000,
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
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(b)}><Pencil size={13} /></button>
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
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
