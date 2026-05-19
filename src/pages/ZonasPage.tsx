import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { zonasService } from '../lib/servicios/catalogos'
import { getApiErrorMessage } from '../lib/axios'
import { canManageLocalidades } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import { Table } from '../components/ui/Table'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface Zona {
  id: number | string
  nombre: string
  descripcion?: string
  activo?: boolean
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function ZonaModal({ zona, onClose }: { zona?: Zona; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    nombre: zona?.nombre ?? '',
    descripcion: zona?.descripcion ?? '',
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
      }
      return zona ? zonasService.update(zona.id, payload) : zonasService.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zonas'] })
      onClose()
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar zona')),
  })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{zona ? 'Editar zona' : 'Nueva zona'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="input" rows={3} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
          </div>
          {err && <p className="form-error">{err}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || form.nombre.trim().length === 0}>
            {save.isPending ? <><span className="spinner" />Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ZonasPage() {
  const { user } = useAuth()
  const canManage = canManageLocalidades(user?.rol)
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Zona | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['zonas'],
    queryFn: () => zonasService.list().then((r) => r.data),
    staleTime: 30000,
  })

  const remove = useMutation({
    mutationFn: (id: string | number) => zonasService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zonas'] })
      setFeedback({ kind: 'success', message: 'Zona eliminada correctamente.' })
    },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo eliminar la zona.') }),
  })

  const zonas = pickArray<Zona>(data, ['zonas', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Zonas</h1>
          <p className="page-subtitle">{zonas.length} zona{zonas.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15} /> Nueva zona
          </button>
        )}
      </div>

      {feedback && (
        <div style={{ marginBottom: 14 }}>
          <FeedbackBanner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      <Table
        columns={[
          { key: 'index', header: '#', className: 'w-16' },
          { key: 'nombre', header: 'Nombre' },
          { key: 'descripcion', header: 'Descripción', truncate: true, tooltip: true, render: (z: Zona) => z.descripcion ?? '—' },
          { key: 'activo', header: 'Estado', render: (z: Zona) => (
            <span className={`badge badge-${z.activo !== false ? 'success' : 'gray'}`}>
              {z.activo !== false ? 'Activa' : 'Inactiva'}
            </span>
          )},
        ]}
        data={zonas}
        keyField="id"
        loading={isLoading}
        emptyMessage="Sin zonas registradas"
        pageSize={5}
        searchable
        searchPlaceholder="Buscar zona..."
        renderActions={(z: Zona) => canManage && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(z)} title="Editar">
              <Pencil size={13} />
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              style={{ color: 'var(--danger)' }}
              disabled={remove.isPending}
              onClick={() => confirm(`¿Eliminar zona ${z.nombre}?`) && remove.mutate(z.id)}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      />

      {modal && canManage && <ZonaModal zona={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
