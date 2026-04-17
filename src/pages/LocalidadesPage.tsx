import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { localidadesService } from '../lib/servicios/catalogos'
import { getApiErrorMessage } from '../lib/axios'
import { canManageLocalidades } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import { Table } from '../components/ui/Table'
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
      return localidad ? localidadesService.update(localidad.id, payload) : localidadesService.create(payload)
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
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['localidades'],
    queryFn: () => localidadesService.list().then(r => r.data),
  })

  const localidadesData = pickArray<Localidad>(data, ['localidades', 'rows', 'data'])

  const remove = useMutation({
    mutationFn: (id: string | number) => localidadesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['localidades'] })
      setFeedback({ kind: 'success', message: 'Localidad eliminada correctamente' })
    },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo eliminar') }),
  })

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Localestaciones</h1>
          <p className="page-subtitle">{localidadesData.length} localidad{localidadesData.length !== 1 ? 'es' : ''}</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15} /> Nueva localidad
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
          { key: 'municipio', header: 'Municipio' },
          { key: 'nombre', header: 'Nombre' },
          { key: 'cp', header: 'CP', render: (loc: Localidad) => loc.cp ?? '—' },
          { 
            key: 'activo', 
            header: 'Estado', 
            render: (loc: Localidad) => (
              <span className={`badge badge-${loc.activo !== false ? 'success' : 'gray'}`}>
                {loc.activo !== false ? 'Activa' : 'Inactiva'}
              </span>
            )
          },
        ]}
        data={localidadesData}
        keyField="id"
        loading={isLoading}
        emptyMessage="Sin localidades"
        pageSize={5}
        searchable
        searchPlaceholder="Buscar por municipio o nombre..."
        renderActions={(loc: Localidad) => canManage && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(loc)} title="Editar">
              <Pencil size={13} />
            </button>
            <button 
              className="btn btn-ghost btn-icon btn-sm" 
              style={{ color: 'var(--danger)' }} 
              disabled={remove.isPending} 
              onClick={() => confirm(`¿Eliminar ${loc.nombre}?`) && remove.mutate(loc.id)}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      />

      {modal && canManage && <LocalidadModal localidad={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
