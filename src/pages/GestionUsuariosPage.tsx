
 /**
 * Solo accesible para usuarios con rol admin o coordinador
 * 
 * Funcionalidades:
 * - Listar todos los usuarios del sistema
 * - Crear nuevos usuarios (con permisos específicos)
 * - Editar usuarios existentes
 * - Eliminar usuarios
 * - Asignar códigos de acceso
 * - Definir coordinador responsable
 */

import { usuariosService, type CreateUsuarioPayload, type UpdateUsuarioPayload } from '../lib/servicios/usuarios'
import { getApiErrorMessage } from '../lib/axios'
import { useState } from 'react'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Table } from '../components/ui'

import FeedbackBanner from '../components/common/FeedbackBanner'

interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: 'admin' | 'coordinador' | 'tecnico' | 'administrador'
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  activo: boolean
}

type Rol = 'administrador' | 'coordinador' | 'tecnico'

interface UsuarioForm {
  nombre: string
  correo: string
  rol: Rol
  codigo_acceso: string
  telefono: string
  coordinador_id: string
  fecha_limite: string
  activo: boolean
}

const INITIAL_FORM_STATE: UsuarioForm = {
  nombre: '',
  correo: '',
  rol: 'tecnico',
  codigo_acceso: '',
  telefono: '',
  coordinador_id: '',
  fecha_limite: '',
  activo: true,
}

export default function GestionUsuariosPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UsuarioForm>(INITIAL_FORM_STATE)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Query para listar usuarios
  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.list().then(r => r.data),
  })

// Mutation para crear usuario
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload: CreateUsuarioPayload = {
        nombre: data.nombre,
        correo: data.correo,
        rol: mapRolToApi(data.rol),
        codigo_acceso: data.codigo_acceso || undefined,
        telefono: data.telefono || undefined,
        coordinador_id: data.coordinador_id || undefined,
        fecha_limite: data.fecha_limite || undefined,
      }
      return (await usuariosService.create(payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setFeedback({ type: 'success', message: 'Usuario creado correctamente' })
      setForm(INITIAL_FORM_STATE)
      setShowForm(false)
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, 'Error al crear usuario')
      setFeedback({ type: 'error', message })
    },
  })


  // Mutation para actualizar usuario
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; form: typeof form }) => {
      const payload: UpdateUsuarioPayload = {
        nombre: data.form.nombre,
        correo: data.form.correo,
        rol: mapRolToApi(data.form.rol),
        codigo_acceso: data.form.codigo_acceso || undefined,
        telefono: data.form.telefono || undefined,
        coordinador_id: data.form.coordinador_id || undefined,
        fecha_limite: data.form.fecha_limite || undefined,
        activo: data.form.activo,
      }
      return (await usuariosService.update(data.id, payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setFeedback({ type: 'success', message: 'Usuario actualizado correctamente' })
      resetForm()
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, 'Error al actualizar usuario')
      setFeedback({ type: 'error', message })
    },
  })


  // Mutation para eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuariosService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setFeedback({ type: 'success', message: 'Usuario eliminado correctamente' })
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, 'Error al eliminar usuario')
      setFeedback({ type: 'error', message })
    },
  })

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (usuario: Usuario) => {
    setForm({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol as Rol,
      codigo_acceso: '',
      telefono: usuario.telefono || '',
      coordinador_id: usuario.coordinador_id || '',
      fecha_limite: usuario.fecha_limite || '',
      activo: usuario.activo,
    })
    setEditingId(usuario.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, form })
    } else {
      createMutation.mutate(form)
    }
  }

  const mapRolToApi = (rol: Rol): 'administrador' | 'coordinador' | 'tecnico' => {
    return rol as 'administrador' | 'coordinador' | 'tecnico'
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {feedback && (
        <FeedbackBanner
          kind={feedback.type}
          message={feedback.message}
        />
      )}

      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">Correo *</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">Rol *</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="label">Código de Acceso</label>
                  <input
                    type="text"
                    value={form.codigo_acceso}
                    onChange={(e) => setForm({ ...form, codigo_acceso: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Ej: TECH-12345"
                  />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label">Coordinador ID</label>
                  <input
                    type="text"
                    value={form.coordinador_id}
                    onChange={(e) => setForm({ ...form, coordinador_id: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label">Fecha Límite</label>
                  <input
                    type="date"
                    value={form.fecha_limite}
                    onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="flex items-center pt-7">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="label-text ml-2">Activo</span>
                  </label>
                </div>
              </div>

              <div className="modal-action">
                <button type="button" onClick={resetForm} className="btn">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary"
                >
                  {editingId ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Cargando usuarios...</div>
      ) : error ? (
        <div className="alert alert-error">Error al cargar usuarios</div>
      ) : (
        <Table
          columns={[
            { key: 'nombre', header: 'Nombre' },
            { key: 'correo', header: 'Correo', className: 'max-w-[200px] truncate' },
            { 
              key: 'rol', 
              header: 'Rol', 
              render: (u: Usuario) => <span className="badge badge-primary">{u.rol}</span>
            },
            { key: 'telefono', header: 'Teléfono', render: (u: Usuario) => u.telefono || '-' },
            { 
              key: 'activo', 
              header: 'Estado', 
              render: (u: Usuario) => (
                <span className={`badge ${u.activo ? 'badge-success' : 'badge-error'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              )
            },
          ]}
          data={usuarios}
          keyField="id"
          loading={isLoading}
          emptyMessage="Sin usuarios"
          pagination={{ page: 1, pageSize: 5, total: usuarios.length }}
          renderActions={(usuario: Usuario) => (
            <div className="flex gap-2">
              <button onClick={() => handleEdit(usuario)} className="btn btn-ghost btn-icon btn-sm">
                <Pencil size={16} />
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Está seguro de eliminar este usuario?')) {
                    deleteMutation.mutate(usuario.id)
                  }
                }}
                disabled={deleteMutation.isPending}
                className="btn btn-error btn-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}
    </div>
  )
}
