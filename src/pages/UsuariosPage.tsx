import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { usuariosApi } from '../lib/api'
import { pickArray } from '../lib/normalize'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type Rol = 'administrador' | 'coordinador' | 'tecnico'

interface Usuario {
  id: number | string
  nombre: string
  correo: string
  rol: Rol | string
  activo?: boolean
}

interface UsuariosResponse {
  usuarios?: Usuario[]
}

interface UsuarioForm {
  nombre: string
  correo: string
  rol: Rol
}

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function toFormRole(role: string | undefined): Rol {
  if (role === 'coordinador' || role === 'tecnico' || role === 'administrador') return role
  if (role === 'admin') return 'administrador'
  return 'coordinador'
}

function UsuarioModal({ u, onClose }: { u?: Usuario; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<UsuarioForm>({
    nombre: u?.nombre ?? '',
    correo: u?.correo ?? '',
    rol: toFormRole(u?.rol),
  })
  const [err, setErr] = useState('')
  const save = useMutation({
    mutationFn: () => u ? usuariosApi.update(u.id, form) : usuariosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); onClose() },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
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
            <select className="input" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value as Rol }))}>
              <option value="administrador">Administrador</option>
              <option value="coordinador">Coordinador</option>
              <option value="tecnico">Técnico</option>
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
  const [modal, setModal] = useState<'new' | Usuario | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then(r => r.data),
    staleTime: 60000,
  })
  const remove = useMutation({
    mutationFn: (id: string | number) => usuariosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
  const usuariosData = data as UsuariosResponse | Usuario[] | undefined
  const usuarios = pickArray<Usuario>(usuariosData, ['usuarios', 'rows', 'data'])

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
            )) : usuarios.map((u, i) => (
              <tr key={u.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                <td style={{ color: 'var(--gray-500)' }}>{u.correo}</td>
                <td><span className={`badge badge-${(u.rol === 'administrador' || u.rol === 'admin') ? 'guinda' : 'dorado'}`}>{u.rol}</span></td>
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
