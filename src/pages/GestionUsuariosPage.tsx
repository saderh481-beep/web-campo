/**
 * Página de Gestión de Usuarios (Admin/Coordinadores)
 * Ruta: /usuarios
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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gestionUsuariosService } from '../lib/servicios/gestion-usuarios'
import { getApiErrorMessage } from '../lib/axios'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import FeedbackBanner from '../components/common/FeedbackBanner'
import { type Rol } from '../lib/validation'

interface Usuario {
  usuario_id: string
  nombre: string
  correo: string
  rol: Rol
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  activo: boolean
}

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
    queryFn: async () => {
      const response = await gestionUsuariosService.list()
      return response.data
    },
  })

  // Mutation para crear usuario
  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      gestionUsuariosService.create({
        nombre: data.nombre,
        correo: data.correo,
        rol: data.rol as 'admin' | 'coordinador' | 'tecnico',
        codigo_acceso: data.codigo_acceso || undefined,
        telefono: data.telefono || undefined,
        coordinador_id: data.coordinador_id || undefined,
        fecha_limite: data.fecha_limite || undefined,
      }),
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
    mutationFn: (data: { id: string; form: typeof form }) =>
      gestionUsuariosService.update(data.id, {
        nombre: data.form.nombre,
        correo: data.form.correo,
        rol: data.form.rol as 'admin' | 'coordinador' | 'tecnico',
        codigo_acceso: data.form.codigo_acceso || undefined,
        telefono: data.form.telefono || undefined,
        coordinador_id: data.form.coordinador_id || undefined,
        fecha_limite: data.form.fecha_limite || undefined,
        activo: data.form.activo,
      }),
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
    mutationFn: (id: string) => gestionUsuariosService.remove(id),
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
      rol: usuario.rol,
      codigo_acceso: '',
      telefono: usuario.telefono || '',
      coordinador_id: usuario.coordinador_id || '',
      fecha_limite: usuario.fecha_limite || '',
      activo: usuario.activo,
    })
    setEditingId(usuario.usuario_id)
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
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
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
        <div className="overflow-x-auto">
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.usuario_id}>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.correo}</td>
                  <td>
                    <span className="badge badge-primary">{usuario.rol}</span>
                  </td>
                  <td>{usuario.telefono || '-'}</td>
                  <td>
                    <span className={`badge ${usuario.activo ? 'badge-success' : 'badge-error'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="btn btn-sm btn-ghost"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Está seguro de eliminar este usuario?')) {
                          deleteMutation.mutate(usuario.usuario_id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="btn btn-sm btn-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
