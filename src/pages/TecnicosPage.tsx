import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { tecnicosApi } from '../lib/api'
import { pickArray } from '../lib/normalize'
import { Plus, RefreshCw, Copy, Check, Trash2, Pencil, X, Search } from 'lucide-react'

interface Tecnico { id: number; nombre: string; correo: string; municipio?: string; codigo_acceso?: string; activo?: boolean; vencimiento_codigo?: string }
interface FormData { nombre: string; correo: string; municipio: string }
const FORM_FIELDS: Array<{ key: keyof FormData; label: string; type: 'text' | 'email' }> = [
  { key: 'nombre', label: 'Nombre completo', type: 'text' },
  { key: 'correo', label: 'Correo electrónico', type: 'email' },
  { key: 'municipio', label: 'Municipio', type: 'text' },
]

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function CodigoAcceso({ codigo, id }: { codigo: string; id: number }) {
  const [copied, setCopied] = useState(false)
  const qc = useQueryClient()
  const regen = useMutation({
    mutationFn: () => tecnicosApi.regenerarCodigo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tecnicos'] }),
  })
  const copy = () => {
    navigator.clipboard.writeText(codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, background: 'var(--guinda-50)', color: 'var(--guinda)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em' }}>{codigo}</code>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={copy} title="Copiar">
        {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
      </button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => regen.mutate()} disabled={regen.isPending} title="Regenerar">
        <RefreshCw size={13} style={{ animation: regen.isPending ? 'spin 0.7s linear infinite' : 'none' }} />
      </button>
    </div>
  )
}

function TecnicoModal({ tecnico, onClose }: { tecnico?: Tecnico; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormData>({ nombre: tecnico?.nombre ?? '', correo: tecnico?.correo ?? '', municipio: tecnico?.municipio ?? '' })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => tecnico ? tecnicosApi.update(tecnico.id, form) : tecnicosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tecnicos'] }); onClose() },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{tecnico ? 'Editar técnico' : 'Nuevo técnico'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {FORM_FIELDS.map(({ key, label, type }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input className="input" type={type}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
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

export default function TecnicosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Tecnico | null>(null)
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosApi.list().then(r => r.data),
    staleTime: 30000,
  })

  const remove = useMutation({
    mutationFn: (id: number) => tecnicosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tecnicos'] }),
  })

  const tecnicosData = pickArray<Tecnico>(data, ['tecnicos', 'rows', 'data'])
  const tecnicos: Tecnico[] = tecnicosData
    .filter((t: Tecnico) => !q || t.nombre?.toLowerCase().includes(q.toLowerCase()) || t.correo?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Técnicos</h1>
          <p className="page-subtitle">{tecnicos.length} técnico{tecnicos.length !== 1 ? 's' : ''} registrado{tecnicos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Nuevo técnico
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <input className="input" style={{ border: 'none', padding: 0, boxShadow: 'none' }}
          placeholder="Buscar técnico..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Correo</th><th>Municipio</th><th>Código de acceso</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 18, width: j === 0 ? 24 : '80%' }} /></td>
                ))}</tr>
              ))
            ) : tecnicos.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><p>Sin técnicos</p></div></td></tr>
            ) : tecnicos.map((t, i) => (
              <tr key={t.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{t.nombre}</td>
                <td style={{ color: 'var(--gray-500)' }}>{t.correo}</td>
                <td>{t.municipio ?? '—'}</td>
                <td>{t.codigo_acceso ? <CodigoAcceso codigo={t.codigo_acceso} id={t.id} /> : <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                <td>
                  <span className={`badge badge-${t.activo !== false ? 'green' : 'gray'}`}>
                    {t.activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(t)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => confirm(`¿Desactivar a ${t.nombre}?`) && remove.mutate(t.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <TecnicoModal
          tecnico={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
