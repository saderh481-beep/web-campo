import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import { localidadesApi, getApiErrorMessage } from '../lib/api'
import { canManageLocalidades } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface Localidad {
  id: number | string
  municipio: string
  nombre: string
  cp?: string
  activo?: boolean
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function LocalidadModal({ localidad, onClose }: { localidad?: Localidad; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    municipio: localidad?.municipio ?? '',
    nombre: localidad?.nombre ?? '',
    cp: localidad?.cp ?? '',
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        municipio: form.municipio,
        nombre: form.nombre,
        cp: form.cp || undefined,
      }
      return localidad ? localidadesApi.update(localidad.id, payload) : localidadesApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['localidades'] })
      onClose()
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'No se pudo guardar la localidad')),
  })

  const handleSave = () => {
    if (!form.municipio.trim() || !form.nombre.trim()) {
      setErr('Municipio y nombre son obligatorios.')
      return
    }
    if (form.cp && !/^\d{5}$/.test(form.cp)) {
      setErr('El codigo postal debe tener 5 digitos.')
      return
    }
    setErr('')
    save.mutate()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{localidad ? 'Editar localidad' : 'Nueva localidad'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Municipio</label>
            <input className="input" value={form.municipio} onChange={(e) => setForm((p) => ({ ...p, municipio: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">CP (opcional)</label>
            <input className="input" value={form.cp} maxLength={5} onChange={(e) => setForm((p) => ({ ...p, cp: e.target.value.replace(/\D/g, '') }))} />
          </div>
          {err && <p className="form-error">{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? <><span className="spinner" />Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LocalidadesPage() {
  const { user } = useAuth()
  const canManage = canManageLocalidades(user?.rol)
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Localidad | null>(null)
  const [q, setQ] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['localidades'],
    queryFn: () => localidadesApi.list().then((r) => r.data),
    staleTime: 60000,
  })

  const remove = useMutation({
    mutationFn: (id: string | number) => localidadesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['localidades'] })
      setFeedback({ kind: 'success', message: 'Localidad desactivada correctamente.' })
    },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo eliminar la localidad.') }),
  })

  const localidades = pickArray<Localidad>(data, ['localidades', 'rows', 'data'])
  const localidadesFiltradas = localidades
    .filter((loc) => {
      if (!q.trim()) return true
      const query = q.toLowerCase()
      return loc.nombre.toLowerCase().includes(query) || loc.municipio.toLowerCase().includes(query) || (loc.cp ?? '').includes(query)
    })
    .sort((a, b) => {
      const byMunicipio = a.municipio.localeCompare(b.municipio, 'es', { sensitivity: 'base' })
      if (byMunicipio !== 0) return byMunicipio
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    })

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Localidades</h1>
          <p className="page-subtitle">Catalogo por municipio. Mostrando {localidadesFiltradas.length} de {localidades.length}</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15} /> Nueva localidad</button>}
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <input
          className="input"
          style={{ border: 'none', padding: 0, boxShadow: 'none' }}
          placeholder="Buscar por municipio, localidad o CP"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQ('')}><X size={14} /></button>}
      </div>

      {feedback && (
        <div style={{ marginBottom: 14 }}>
          <FeedbackBanner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Municipio</th><th>Nombre</th><th>CP</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}>{Array(6).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : localidadesFiltradas.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><p>Sin localidades</p></div></td></tr>
            ) : localidadesFiltradas.map((loc, i) => (
              <tr key={loc.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{loc.municipio}</td>
                <td>{loc.nombre}</td>
                <td>{loc.cp ?? '—'}</td>
                <td><span className={`badge badge-${loc.activo !== false ? 'green' : 'gray'}`}>{loc.activo !== false ? 'Activa' : 'Inactiva'}</span></td>
                <td>
                  {canManage && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(loc)}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={remove.isPending} onClick={() => confirm(`¿Eliminar ${loc.nombre}?`) && remove.mutate(loc.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && canManage && <LocalidadModal localidad={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
