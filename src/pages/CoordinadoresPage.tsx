import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coordinadoresService, type Coordinador } from '../lib/servicios/coordinadores'
import { getApiErrorMessage } from '../lib/axios'
import { useToast } from '../hooks/useToast'
import { Plus, Pencil, Trash2, X, Eye } from 'lucide-react'

interface CoordinadorForm {
  nombre: string
  correo: string
  telefono: string
  activo: boolean
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function CoordinadorModal({
  coord,
  onClose,
  onSaved,
}: {
  coord?: Coordinador
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<CoordinadorForm>({
    nombre: coord?.nombre ?? '',
    correo: coord?.correo ?? '',
    telefono: coord?.telefono ?? '',
    activo: coord?.activo !== false,
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || undefined,
      }
      return coord
        ? await coordinadoresService.update(coord.id, { ...payload, activo: form.activo })
        : await coordinadoresService.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coordinadores'] })
      onSaved(coord ? 'Coordinador actualizado correctamente.' : 'Coordinador creado correctamente.')
      onClose()
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  const handleSave = () => {
    if (!form.nombre.trim() || !form.correo.trim()) {
      setErr('Nombre y correo son obligatorios.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
      setErr('El correo no tiene un formato válido.')
      return
    }
    setErr('')
    save.mutate()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{coord ? 'Editar coordinador' : 'Nuevo coordinador'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input
              className="input"
              type="email"
              value={form.correo}
              onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono (opcional)</label>
            <input
              className="input"
              value={form.telefono}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            />
          </div>
          {coord && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                />
                Coordinador activo
              </label>
            </div>
          )}
          {err && <div className="feedback-banner feedback-error feedback-compact">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? 'Guardando...' : coord ? 'Guardar' : 'Crear coordinador'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CoordinadorInfoModal({ coord, onClose }: { coord: Coordinador; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Información del coordinador</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 10 }}>
          <div>
            <strong>Nombre:</strong> {coord.nombre}
          </div>
          <div>
            <strong>Correo:</strong> {coord.correo}
          </div>
          <div>
            <strong>Teléfono:</strong> {coord.telefono ?? '—'}
          </div>
          <div>
            <strong>Estado:</strong> {coord.activo !== false ? 'Activo' : 'Inactivo'}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CoordinadoresPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [modal, setModal] = useState<'new' | Coordinador | null>(null)
  const [infoModal, setInfoModal] = useState<Coordinador | null>(null)

  const { data: coords = [], isLoading } = useQuery({
    queryKey: ['coordinadores'],
    queryFn: () => coordinadoresService.list().then((r) => r.data),
  })

  const remove = useMutation({
    mutationFn: (id: string | number) => coordinadoresService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coordinadores'] })
      toast.success('Coordinador eliminado correctamente.')
    },
    onError: (e: unknown) =>
      toast.error(toErrorMessage(e, 'No se pudo eliminar el coordinador.')),
  })

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Coordinadores</h1>
          <p className="page-subtitle">{coords.length} coordinador{coords.length !== 1 ? 'es' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Nuevo coordinador
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton" style={{ height: 18 }} />
                      </td>
                    ))}
                  </tr>
                ))
            ) : (
              coords.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{c.correo}</td>
                  <td>{c.telefono ?? '—'}</td>
                  <td>
                    <span className={`badge badge-${c.activo !== false ? 'green' : 'gray'}`}>
                      {c.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setInfoModal(c)}>
                        <Eye size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(c)}>
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        disabled={remove.isPending}
                        onClick={() => confirm(`¿Eliminar al coordinador ${c.nombre}?`) && remove.mutate(c.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modal && (
        <CoordinadorModal
          coord={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={(message) => toast.success(message)}
        />
      )}
      {infoModal && <CoordinadorInfoModal coord={infoModal} onClose={() => setInfoModal(null)} />}
    </div>
  )
}