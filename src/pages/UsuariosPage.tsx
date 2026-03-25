import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { asignacionesApi, usuariosApi } from '../lib/api'
import { pickArray } from '../lib/normalize'
import { Plus, Pencil, Trash2, X, Copy, Check, Eye } from 'lucide-react'
import FeedbackBanner from '../components/common/FeedbackBanner'

type Rol = 'administrador' | 'coordinador' | 'tecnico'

interface Usuario {
  id: number | string
  nombre: string
  correo: string
  rol: Rol | string
  codigo_acceso?: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  activo?: boolean
}

interface UsuariosResponse {
  usuarios?: Usuario[]
}

interface UsuarioForm {
  nombre: string
  correo: string
  rol: Rol
  telefono: string
  coordinador_id: string
  fecha_limite: string
}

type AnyRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null
}

function pickString(source: AnyRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function pickBoolean(source: AnyRecord, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'activo', 'active', 'habilitado'].includes(normalized)) return true
      if (['false', '0', 'inactivo', 'inactive', 'deshabilitado'].includes(normalized)) return false
    }
  }
  return undefined
}

function normalizeUsuarios(source: unknown): Usuario[] {
  const rows = pickArray<unknown>(source, ['usuarios', 'rows', 'data'])
  return rows
    .map((row): Usuario | null => {
      if (!isRecord(row)) return null

      // Prioriza ids enteros/canónicos del backend antes de UUID para update/delete.
      const id = pickString(row, ['usuario_id', 'id_usuario', 'user_id', 'id', 'uuid'])
      if (!id) return null

      const nombre = pickString(row, ['nombre', 'name']) ?? 'Sin nombre'
      const correo = pickString(row, ['correo', 'email']) ?? 'sin-correo'
      const rol = pickString(row, ['rol', 'role']) ?? 'coordinador'
      const codigo_acceso = pickString(row, ['codigo_acceso', 'codigoAcceso', 'codigo', 'access_code'])
      const telefono = pickString(row, ['telefono', 'phone'])
      const coordinador_id = pickString(row, ['coordinador_id', 'coordinator_id'])
      const fecha_limite = pickString(row, ['fecha_limite', 'fechaLimite'])
      const activo = pickBoolean(row, ['activo', 'is_active', 'status'])

      return { id, nombre, correo, rol, codigo_acceso, telefono, coordinador_id, fecha_limite, activo }
    })
    .filter((u): u is Usuario => Boolean(u))
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

function CodigoGenerado({ codigo }: { codigo: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="card" style={{ marginTop: 16, background: 'var(--guinda-50)', borderColor: 'var(--guinda-100)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--guinda)', textTransform: 'uppercase', marginBottom: 8 }}>Código de acceso generado</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <code style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: 'var(--guinda)' }}>{codigo}</code>
        <button className="btn btn-secondary btn-sm" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 10, marginBottom: 0 }}>
        Guárdalo ahora. El backend solo lo devuelve en la creación inicial.
      </p>
    </div>
  )
}

function UsuarioModal({ u, onClose }: { u?: Usuario; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<UsuarioForm>({
    nombre: u?.nombre ?? '',
    correo: u?.correo ?? '',
    rol: toFormRole(u?.rol),
    telefono: u?.telefono ?? '',
    coordinador_id: u?.coordinador_id ?? '',
    fecha_limite: u?.fecha_limite?.slice(0, 10) ?? '',
  })
  const [err, setErr] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')

  function buildPayload() {
    const payload: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      rol: form.rol,
      telefono: form.telefono.trim() || undefined,
    }

    return payload
  }

  function toIsoDateTime(value: string): string {
    return new Date(`${value}T00:00:00`).toISOString()
  }

  function resolveUsuarioId(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null
    const row = data as Record<string, unknown>
    const candidates = [row.id, row.usuario_id, row.id_usuario, row.uuid]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate
      if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
    }
    return null
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = buildPayload()
      const response = u ? await usuariosApi.update(u.id, payload) : await usuariosApi.create(payload)

      if (form.rol === 'tecnico') {
        const tecnicoId = u ? String(u.id) : resolveUsuarioId(response.data)
        if (!tecnicoId) {
          throw new Error('No se pudo obtener el ID del técnico creado para asignar coordinador y fecha límite.')
        }

        await asignacionesApi.asignarCoordinadorTecnico({
          tecnico_id: tecnicoId,
          coordinador_id: form.coordinador_id.trim(),
          fecha_limite: toIsoDateTime(form.fecha_limite.trim()),
        })
      }

      return response
    },
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      if (u) {
        onClose()
        return
      }
      const maybeCode = (response.data as { codigo_acceso?: string })?.codigo_acceso ?? ''
      setCodigoGenerado(maybeCode)
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  const handleSave = () => {
    if (!form.nombre.trim() || !form.correo.trim()) {
      setErr('Nombre y correo son obligatorios.')
      return
    }

    if (form.rol === 'tecnico' && (!form.coordinador_id.trim() || !form.fecha_limite.trim())) {
      setErr('Para técnicos, coordinador y fecha límite son obligatorios.')
      return
    }

    setErr('')
    save.mutate()
  }

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
            <select className="input" value={form.rol} onChange={e => setForm(p => ({
              ...p,
              rol: e.target.value as Rol,
            }))}>
              <option value="administrador">Administrador</option>
              <option value="coordinador">Coordinador</option>
              <option value="tecnico">Técnico</option>
            </select></div>
          {form.rol === 'tecnico' && (
            <>
              <div className="form-group"><label className="form-label">Teléfono (opcional)</label>
                <input className="input" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">ID de coordinador</label>
                <input className="input" value={form.coordinador_id} onChange={e => setForm(p => ({ ...p, coordinador_id: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Fecha límite</label>
                <input className="input" type="date" value={form.fecha_limite} onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value }))} /></div>
            </>
          )}
          {err && <FeedbackBanner kind="error" message={err} compact />}
          {!u && codigoGenerado && <CodigoGenerado codigo={codigoGenerado} />}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={save.isPending || (!u && codigoGenerado.length > 0)}>
            {save.isPending ? <><span className="spinner" />Guardando...</> : (u ? 'Guardar' : 'Crear usuario')}
          </button>
        </div>
      </div>
    </div>
  )
}

function UsuarioInfoModal({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Información de usuario</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 10 }}>
          <div><strong>Nombre:</strong> {usuario.nombre}</div>
          <div><strong>Correo:</strong> {usuario.correo}</div>
          <div><strong>Rol:</strong> {usuario.rol}</div>
          <div><strong>Código de acceso:</strong> {usuario.codigo_acceso ?? '—'}</div>
          <div><strong>Teléfono:</strong> {usuario.telefono ?? '—'}</div>
          <div><strong>Coordinador ID:</strong> {usuario.coordinador_id ?? '—'}</div>
          <div><strong>Fecha límite:</strong> {usuario.fecha_limite ?? '—'}</div>
          <div><strong>Estado:</strong> {usuario.activo !== false ? 'Activo' : 'Inactivo'}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Usuario | null>(null)
  const [infoModal, setInfoModal] = useState<Usuario | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then(r => r.data),
    staleTime: 60000,
  })
  const remove = useMutation({
    mutationFn: (id: string | number) => usuariosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      setFeedback({ kind: 'success', message: 'Usuario desactivado correctamente.' })
    },
    onError: (e: unknown) => setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo desactivar el usuario.') }),
  })
  const usuariosData = data as UsuariosResponse | Usuario[] | undefined
  const usuarios = normalizeUsuarios(usuariosData)

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Usuarios del sistema</h1>
          <p className="page-subtitle">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p></div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15} /> Nuevo usuario</button>
      </div>
      {feedback && <div style={{ marginBottom: 14 }}><FeedbackBanner kind={feedback.kind} message={feedback.message} /></div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Código acceso</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {isLoading ? Array(4).fill(0).map((_, i) => (
              <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : usuarios.map((u, i) => (
              <tr key={u.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                <td style={{ color: 'var(--gray-500)' }}>{u.correo}</td>
                <td><code style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>{u.codigo_acceso ?? '—'}</code></td>
                <td><span className={`badge badge-${(u.rol === 'administrador' || u.rol === 'admin') ? 'guinda' : 'dorado'}`}>{u.rol}</span></td>
                <td><span className={`badge badge-${u.activo !== false ? 'green' : 'gray'}`}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                <td><div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setInfoModal(u)}><Eye size={13} /> Ver</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}><Pencil size={13} /> Editar</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => confirm(`¿Desactivar a ${u.nombre}?`) && remove.mutate(u.id)}><Trash2 size={13} /> Eliminar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <UsuarioModal u={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
      {infoModal && <UsuarioInfoModal usuario={infoModal} onClose={() => setInfoModal(null)} />}
    </div>
  )
}







