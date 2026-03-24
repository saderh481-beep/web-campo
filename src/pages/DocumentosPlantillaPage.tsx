import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import { documentosPlantillaApi } from '../lib/api'
import { canManageDocumentosPlantilla } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface DocumentoPlantilla {
  id: number | string
  nombre: string
  descripcion?: string
  obligatorio?: boolean
  orden?: number
  activo?: boolean
}

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function DocumentoModal({ item, onClose }: { item?: DocumentoPlantilla; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    nombre: item?.nombre ?? '',
    descripcion: item?.descripcion ?? '',
    obligatorio: item?.obligatorio ?? true,
    orden: String(item?.orden ?? 0),
    activo: item?.activo ?? true,
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        obligatorio: form.obligatorio,
        orden: Number(form.orden || 0),
        ...(item ? { activo: form.activo } : {}),
      }
      return item ? documentosPlantillaApi.update(item.id, payload) : documentosPlantillaApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos-plantilla'] })
      onClose()
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'No se pudo guardar')),
  })

  const handleSave = () => {
    if (!form.nombre.trim()) {
      setErr('El nombre es obligatorio.')
      return
    }
    setErr('')
    save.mutate()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{item ? 'Editar documento plantilla' : 'Nuevo documento plantilla'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripcion</label>
            <textarea className="input" rows={3} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Orden</label>
              <input className="input" type="number" value={form.orden} onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value }))} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 26 }}>
              <label><input type="checkbox" checked={form.obligatorio} onChange={(e) => setForm((p) => ({ ...p, obligatorio: e.target.checked }))} /> Obligatorio</label>
            </div>
          </div>
          {item && (
            <div className="form-group" style={{ marginTop: -4 }}>
              <label><input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} /> Activo</label>
            </div>
          )}
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

export default function DocumentosPlantillaPage() {
  const { user } = useAuth()
  const canManage = canManageDocumentosPlantilla(user?.rol)
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | DocumentoPlantilla | null>(null)
  const [q, setQ] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['documentos-plantilla', canManage],
    queryFn: () => (canManage ? documentosPlantillaApi.list() : documentosPlantillaApi.activos()).then((r) => r.data),
    staleTime: 60000,
  })

  const remove = useMutation({
    mutationFn: (id: string | number) => documentosPlantillaApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos-plantilla'] })
      setFeedback({ kind: 'success', message: 'Documento plantilla eliminado correctamente.' })
    },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo eliminar el documento.') }),
  })

  const rows = pickArray<DocumentoPlantilla>(data, ['documentos_plantilla', 'documentos', 'rows', 'data'])
  const rowsFiltradas = rows
    .filter((doc) => {
      if (!q.trim()) return true
      const query = q.toLowerCase()
      return doc.nombre.toLowerCase().includes(query) || (doc.descripcion ?? '').toLowerCase().includes(query)
    })
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos Plantilla</h1>
          <p className="page-subtitle">Catalogo global de documentos requeridos. Mostrando {rowsFiltradas.length} de {rows.length}</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15} /> Nuevo documento</button>}
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <input
          className="input"
          style={{ border: 'none', padding: 0, boxShadow: 'none' }}
          placeholder="Buscar por nombre o descripcion"
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
            <tr><th>#</th><th>Nombre</th><th>Descripcion</th><th>Orden</th><th>Obligatorio</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}>{Array(7).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : rowsFiltradas.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><p>Sin documentos plantilla</p></div></td></tr>
            ) : rowsFiltradas.map((doc, i) => (
              <tr key={doc.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{doc.nombre}</td>
                <td style={{ color: 'var(--gray-500)' }}>{doc.descripcion ?? '—'}</td>
                <td>{doc.orden ?? 0}</td>
                <td><span className={`badge badge-${doc.obligatorio !== false ? 'guinda' : 'gray'}`}>{doc.obligatorio !== false ? 'Si' : 'No'}</span></td>
                <td><span className={`badge badge-${doc.activo !== false ? 'green' : 'gray'}`}>{doc.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  {canManage && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(doc)}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={remove.isPending} onClick={() => confirm(`¿Eliminar ${doc.nombre}?`) && remove.mutate(doc.id)}>
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

      {modal && canManage && <DocumentoModal item={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
