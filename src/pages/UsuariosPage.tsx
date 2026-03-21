import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { usuariosApi } from '../lib/api'
import { pickArray } from '../lib/normalize'
import { Plus, Pencil, Trash2, X, User, Mail, Shield, AlertCircle } from 'lucide-react'

type Rol = 'admin' | 'coordinador'

interface Usuario {
  id: number
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

function UsuarioModal({ u, onClose }: { u?: Usuario; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<UsuarioForm>({
    nombre: u?.nombre ?? '',
    correo: u?.correo ?? '',
    rol: u?.rol === 'admin' ? 'admin' : 'coordinador',
  })
  const [err, setErr] = useState('')
  
  const save = useMutation({
    mutationFn: () => u ? usuariosApi.update(u.id, form) : usuariosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); onClose() },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--primary-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <User size={20} />
            </div>
            <h3>{u ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} style={{ opacity: 0.5 }} />
              Nombre completo
            </label>
            <input 
              className="input" 
              value={form.nombre} 
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ingresa el nombre"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} style={{ opacity: 0.5 }} />
              Correo electronico
            </label>
            <input 
              className="input" 
              type="email" 
              value={form.correo} 
              onChange={e => setForm(p => ({ ...p, correo: e.target.value }))}
              placeholder="correo@hidalgo.gob.mx"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} style={{ opacity: 0.5 }} />
              Rol del usuario
            </label>
            <select 
              className="input" 
              value={form.rol} 
              onChange={e => setForm(p => ({ ...p, rol: e.target.value as Rol }))}
            >
              <option value="admin">Administrador</option>
              <option value="coordinador">Coordinador</option>
            </select>
          </div>
          
          {err && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 10,
              color: 'var(--danger)',
              fontSize: 13,
            }}>
              <AlertCircle size={16} />
              {err}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => save.mutate()} 
            disabled={save.isPending || !form.nombre || !form.correo}
          >
            {save.isPending ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Guardando...
              </>
            ) : (
              'Guardar usuario'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ usuario, onClose, onConfirm }: { 
  usuario: Usuario; 
  onClose: () => void; 
  onConfirm: () => void 
}) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
            }}>
              <Trash2 size={20} />
            </div>
            <h3>Desactivar usuario</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <p style={{ 
            fontSize: 14, 
            color: 'var(--gray-600)', 
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            Estas a punto de desactivar al usuario <strong>{usuario.nombre}</strong>. 
            Esta accion puede revertirse mas adelante.
          </p>
          
          <div style={{
            padding: '14px 16px',
            background: 'var(--gray-50)',
            borderRadius: 10,
            border: '1px solid var(--gray-200)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 4 }}>
              {usuario.nombre}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {usuario.correo}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Desactivar usuario
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Usuario | null>(null)
  const [deleteModal, setDeleteModal] = useState<Usuario | null>(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then(r => r.data),
    staleTime: 60000,
  })
  
  const remove = useMutation({
    mutationFn: (id: number) => usuariosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      setDeleteModal(null)
    },
  })
  
  const usuariosData = data as UsuariosResponse | Usuario[] | undefined
  const usuarios = pickArray<Usuario>(usuariosData, ['usuarios', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios del sistema</h1>
          <p className="page-subtitle">
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> 
          Nuevo usuario
        </button>
      </div>
      
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: 20, borderRadius: 6 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ color: 'var(--gray-400)' }}>
                    <User size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>No hay usuarios registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              usuarios.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 500 }}>
                    {i + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                        {u.nombre?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                        {u.nombre}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-500)' }}>{u.correo}</td>
                  <td>
                    <span className={`badge badge-${u.rol === 'admin' ? 'guinda' : 'dorado'}`}>
                      {u.rol === 'admin' ? 'Administrador' : 'Coordinador'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.activo !== false ? 'green' : 'gray'}`}>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        className="btn btn-ghost btn-icon btn-sm" 
                        onClick={() => setModal(u)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="btn btn-ghost btn-icon btn-sm" 
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteModal(u)}
                        title="Desactivar"
                      >
                        <Trash2 size={14} />
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
        <UsuarioModal 
          u={modal === 'new' ? undefined : modal} 
          onClose={() => setModal(null)} 
        />
      )}
      
      {deleteModal && (
        <DeleteConfirmModal
          usuario={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => remove.mutate(deleteModal.id)}
        />
      )}
    </div>
  )
}
