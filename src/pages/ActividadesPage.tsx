import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actividadesService } from '../lib/servicios/catalogos'
import { getApiErrorMessage } from '../lib/axios'
import { canManageActividades } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import { Table } from '../components/ui/Table'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Actividad {
  id: number | string
  nombre: string
  descripcion?: string
}

interface ActividadForm {
  nombre: string
  descripcion: string
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function ActividadModal({ actividad, onClose }: { actividad?: Actividad; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<ActividadForm>({
    nombre: actividad?.nombre ?? '',
    descripcion: actividad?.descripcion ?? '',
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
      }
      return actividad ? actividadesService.update(actividad.id, payload) : actividadesService.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actividades'] })
      onClose()
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar actividad')),
  })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>{actividad ? 'Editar actividad' : 'Nueva actividad'}</h3>
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

export default function ActividadesPage() {
  const { user } = useAuth()
  const canManage = canManageActividades(user?.rol)
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Actividad | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['actividades'],
    queryFn: () => actividadesService.list().then((r) => r.data),
    staleTime: 30000,
  })

  const remove = useMutation({
    mutationFn: (id: string | number) => actividadesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actividades'] }),
  })

  const actividades = pickArray<Actividad>(data as unknown, ['actividades', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Actividades</h1>
          <p className="page-subtitle">Catálogo de actividades</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15} /> Nueva actividad
          </button>
        )}
      </div>

      <Table
        columns={[
          { key: 'index', header: '#', className: 'w-16' },
          { key: 'nombre', header: 'Nombre' },
          { key: 'descripcion', header: 'Descripción', truncate: true, tooltip: true, render: (a: Actividad) => a.descripcion ?? '—' },
        ]}
        data={actividades}
        keyField="id"
        loading={isLoading}
        emptyMessage="Sin actividades registradas"
        pageSize={5}
        renderActions={(a: Actividad) => canManage && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(a)} title="Editar">
              <Pencil size={13} />
            </button>
            <button 
              className="btn btn-ghost btn-icon btn-sm" 
              style={{ color: 'var(--danger)' }} 
              onClick={() => confirm('¿Eliminar actividad?') && remove.mutate(a.id)}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      />

      {modal && canManage && <ActividadModal actividad={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
