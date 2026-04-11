import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { administradoresService, type Administrador } from '../lib/servicios/administradores'
import { getApiErrorMessage } from '../lib/axios'
import { useToast } from '../hooks/useToast'
import { Plus, Pencil, Trash2, X, Eye } from 'lucide-react'

interface AdministradorForm {
  nombre: string
  correo: string
  telefono: string
  activo: boolean
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function AdministradorModal({
  admin,
  onClose,
  onSaved,
}: {
  admin?: Administrador
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<AdministradorForm>({
    nombre: admin?.nombre ?? '',
    correo: admin?.correo ?? '',
    telefono: admin?.telefono ?? '',
    activo: admin?.activo !== false,
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || undefined,
      }
      return admin
        ? await administradoresService.update(admin.id, { ...payload, activo: form.activo })
        : await administradoresService.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administradores'] })
      onSaved(admin ? 'Administrador actualizado correctamente.' : 'Administrador creado correctamente.')
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
          <h3>{admin ? 'Editar administrador' : 'Nuevo administrador'}</h3>
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
          {admin && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                />
                Administrador activo
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
            {save.isPending ? 'Guardando...' : admin ? 'Guardar' : 'Crear administrador'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdministradorInfoModal({ admin, onClose }: { admin: Administrador; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Información del administrador</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 10 }}>
          <div>
            <strong>Nombre:</strong> {admin.nombre}
          </div>
          <div>
            <strong>Correo:</strong> {admin.correo}
          </div>
          <div>
            <strong>Teléfono:</strong> {admin.telefono ?? '—'}
          </div>
          <div>
            <strong>Estado:</strong> {admin.activo !== false ? 'Activo' : 'Inactivo'}
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

export default function AdministradoresPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [modal, setModal] = useState<'new' | Administrador | null>(null)
  const [infoModal, setInfoModal] = useState<Administrador | null>(null)

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['administradores'],
    queryFn: () => administradoresService.list().then((r) => r.data),
  })

  const remove = useMutation({
    mutationFn: (id: string | number) => administradoresService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administradores'] })
      toast.success('Administrador eliminado correctamente.')
    },
    onError: (e: unknown) =>
      toast.error(toErrorMessage(e, 'No se pudo eliminar el administrador.')),
  })

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administradores</h1>
          <p className="page-subtitle">{admins.length} administrador{admins.length !== 1 ? 'es' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Nuevo administrador
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
              admins.map((a, i) => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{a.nombre}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{a.correo}</td>
                  <td>{a.telefono ?? '—'}</td>
                  <td>
                    <span className={`badge badge-${a.activo !== false ? 'green' : 'gray'}`}>
                      {a.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setInfoModal(a)}>
                        <Eye size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(a)}>
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        disabled={remove.isPending}
                        onClick={() => confirm(`¿Eliminar al administrador ${a.nombre}?`) && remove.mutate(a.id)}
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
        <AdministradorModal
          admin={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={(message) => toast.success(message)}
        />
      )}
      {infoModal && <AdministradorInfoModal admin={infoModal} onClose={() => setInfoModal(null)} />}
    </div>
  )
}