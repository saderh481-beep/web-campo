import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { beneficiariosApi, cadenasApi } from '../lib/api'
import { Plus, Search, X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'

interface Cadena {
  id: number
  nombre: string
}

type CadenaRef = Cadena | number

interface Beneficiario {
  id: number
  nombre: string
  curp?: string
  municipio?: string
  localidad?: string
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

interface BeneficiarioForm {
  nombre: string
  curp: string
  municipio: string
  localidad: string
  cadenas_ids: number[]
}

const FORM_FIELDS: Array<{ key: keyof Omit<BeneficiarioForm, 'cadenas_ids'>; label: string; full?: boolean }> = [
  { key: 'nombre', label: 'Nombre completo', full: true },
  { key: 'curp', label: 'CURP' },
  { key: 'municipio', label: 'Municipio' },
  { key: 'localidad', label: 'Localidad' },
]

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function BeneficiarioModal({ b, cadenas, onClose }: { b?: Beneficiario; cadenas: Cadena[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<BeneficiarioForm>({
    nombre: b?.nombre ?? '', curp: b?.curp ?? '',
    municipio: b?.municipio ?? '', localidad: b?.localidad ?? '',
    cadenas_ids: (b?.cadenas ?? []).map((c) => typeof c === 'number' ? c : c.id),
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => b ? beneficiariosApi.update(b.id, form) : beneficiariosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiarios'] }); onClose() },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  const toggleCadena = (id: number) => setForm(p => ({
    ...p, cadenas_ids: p.cadenas_ids.includes(id) ? p.cadenas_ids.filter(c => c !== id) : [...p.cadenas_ids, id]
  }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
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
          </div>
          {cadenas.length > 0 && (
            <div className="form-group">
              <label className="form-label">Cadenas productivas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cadenas.map((c) => (
                  <button key={c.id} type="button"
                    style={{
                      padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${form.cadenas_ids.includes(c.id) ? 'var(--guinda)' : 'var(--gray-200)'}`,
                      background: form.cadenas_ids.includes(c.id) ? 'var(--guinda-50)' : 'white',
                      color: form.cadenas_ids.includes(c.id) ? 'var(--guinda)' : 'var(--gray-500)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onClick={() => toggleCadena(c.id)}>{c.nombre}</button>
                ))}
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

  const benefData = data as BeneficiariosResponse | Beneficiario[] | undefined
  const benefs: Beneficiario[] = Array.isArray(benefData) ? benefData : (benefData?.beneficiarios ?? [])
  const total = Array.isArray(benefData) ? benefData.length : (benefData?.total ?? benefs.length)
  const perPage = Array.isArray(benefData) ? 20 : (benefData?.per_page ?? 20)
  const pages = Math.ceil(total / perPage) || 1

  const rawCadenas = cadenasData as CadenasResponse | Cadena[] | undefined
  const cadenas: Cadena[] = Array.isArray(rawCadenas) ? rawCadenas : (rawCadenas?.cadenas ?? [])

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
          placeholder="Buscar por nombre, CURP o municipio..." value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }} />
        {q && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQ('')}><X size={14} /></button>}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Nombre</th><th>CURP</th><th>Municipio</th><th>Localidad</th><th>Cadenas</th><th></th></tr>
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
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-500)' }}>{b.curp ?? '—'}</td>
                <td>{b.municipio ?? '—'}</td>
                <td>{b.localidad ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(b.cadenas ?? []).map((c) => (
                      <span key={typeof c === 'number' ? c : c.id} className="badge badge-dorado">
                        {typeof c === 'number' ? c : c.nombre}
                      </span>
                    ))}
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
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
