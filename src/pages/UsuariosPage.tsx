import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosApi } from '../lib/api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

function UsuarioModal({ u, onClose }: { u?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ nombre: u?.nombre ?? '', correo: u?.correo ?? '', rol: u?.rol ?? 'coordinador' })
  const [err, setErr] = useState('')
  const save = useMutation({
    mutationFn: () => u ? usuariosApi.update(u.id, form) : usuariosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); onClose() },
    onError: (e: any) => setErr(e.response?.data?.message ?? 'Error'),
  })
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{u ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Nombre</label>
            <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Correo</label>
            <input className="input" type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Rol</label>
            <select className="input" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
              <option value="admin">Administrador</option>
              <option value="coordinador">Coordinador</option>
            </select></div>
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

export default function UsuariosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | any | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then(r => r.data),
    staleTime: 60000,
  })
  const remove = useMutation({
    mutationFn: (id: number) => usuariosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
  const usuarios = data?.usuarios ?? data ?? []

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Usuarios del sistema</h1>
          <p className="page-subtitle">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p></div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15} /> Nuevo usuario</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {isLoading ? Array(4).fill(0).map((_, i) => (
              <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : usuarios.map((u: any, i: number) => (
              <tr key={u.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                <td style={{ color: 'var(--gray-500)' }}>{u.correo}</td>
                <td><span className={`badge badge-${u.rol === 'admin' ? 'guinda' : 'dorado'}`}>{u.rol}</span></td>
                <td><span className={`badge badge-${u.activo !== false ? 'green' : 'gray'}`}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                <td><div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(u)}><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => confirm(`¿Desactivar a ${u.nombre}?`) && remove.mutate(u.id)}><Trash2 size={13} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <UsuarioModal u={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
