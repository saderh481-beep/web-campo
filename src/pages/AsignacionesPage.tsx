import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actividadesApi, asignacionesApi, beneficiariosApi, tecnicosApi, usuariosApi, getApiErrorMessage } from '../lib/api'
import { canManageAsignaciones } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import { ChevronDown, ChevronRight, ClipboardList, Link2, Pencil, Trash2, Users } from 'lucide-react'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface Tecnico {
  id: number | string
  nombre: string
}

interface Beneficiario {
  id: number | string
  nombre: string
}

interface Actividad {
  id: number | string
  nombre: string
}

interface Coordinador {
  id: number | string
  nombre: string
  rol?: string
}

interface CoordinadorTecnicoAsignacion {
  tecnico_id: string
  coordinador_id?: string
  coordinador_nombre?: string
  fecha_limite?: string
  estado_corte?: string
  activo?: boolean
}

interface BeneficiarioAsignacion {
  id: string
  tecnico_id?: string
  beneficiario_id?: string
  activo?: boolean
  asignado_en?: string
  removido_en?: string | null
}

interface ActividadAsignacion {
  id: string
  tecnico_id?: string
  actividad_id?: string
  activo?: boolean
  asignado_en?: string
  removido_en?: string | null
}

type Feedback = { kind: 'success' | 'error'; message: string } | null

type EditState =
  | { kind: 'coordinador'; row: CoordinadorTecnicoAsignacion }
  | { kind: 'beneficiario'; row: BeneficiarioAsignacion }
  | { kind: 'actividad'; row: ActividadAsignacion }
  | null

interface EditFormState {
  coordinador_id?: string
  fecha_limite?: string
  tecnico_id?: string
  beneficiario_id?: string
  actividad_id?: string
  activo: boolean
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function isActive(value: unknown): boolean {
  return value !== false && value !== 0 && value !== 'false'
}

function toDateInput(value?: string): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

function toIsoDateTime(value: string): string | undefined {
  if (!value.trim()) return undefined
  return new Date(`${value}T00:00:00`).toISOString()
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-MX')
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-MX')
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Link2; title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--guinda-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color: 'var(--guinda)' }} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gray-500)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function CollapsibleSection({
  icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  icon: typeof Link2
  title: string
  subtitle: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <button
        className="btn btn-ghost"
        type="button"
        onClick={onToggle}
        style={{ width: '100%', justifyContent: 'space-between', padding: 0, border: 'none', background: 'transparent' }}
      >
        <SectionHeader icon={icon} title={title} subtitle={subtitle} />
        <span style={{ marginTop: 4 }}>{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
      </button>
      {isOpen && children}
    </div>
  )
}

function EditAsignacionModal({
  state,
  tecnicos,
  coordinadores,
  beneficiarios,
  actividades,
  onClose,
}: {
  state: Exclude<EditState, null>
  tecnicos: Tecnico[]
  coordinadores: Coordinador[]
  beneficiarios: Beneficiario[]
  actividades: Actividad[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [form, setForm] = useState<EditFormState>(() => {
    if (state.kind === 'coordinador') {
      return {
        coordinador_id: state.row.coordinador_id ?? '',
        fecha_limite: toDateInput(state.row.fecha_limite),
        activo: isActive(state.row.activo),
      }
    }

    if (state.kind === 'beneficiario') {
      return {
        tecnico_id: state.row.tecnico_id ?? '',
        beneficiario_id: state.row.beneficiario_id ?? '',
        activo: isActive(state.row.activo),
      }
    }

    return {
      tecnico_id: state.row.tecnico_id ?? '',
      actividad_id: state.row.actividad_id ?? '',
      activo: isActive(state.row.activo),
    }
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (state.kind === 'coordinador') {
        const payload = {
          coordinador_id: form.coordinador_id || undefined,
          fecha_limite: toIsoDateTime(form.fecha_limite ?? ''),
          activo: form.activo,
        }
        return asignacionesApi.actualizarCoordinadorTecnico(state.row.tecnico_id, payload)
      }

      if (state.kind === 'beneficiario') {
        const payload = {
          tecnico_id: form.tecnico_id || undefined,
          beneficiario_id: form.beneficiario_id || undefined,
          activo: form.activo,
        }
        return asignacionesApi.actualizarBeneficiario(state.row.id, payload)
      }

      const payload = {
        tecnico_id: form.tecnico_id || undefined,
        actividad_id: form.actividad_id || undefined,
        activo: form.activo,
      }
      return asignacionesApi.actualizarActividad(state.row.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'coordinador-tecnico'] })
      qc.invalidateQueries({ queryKey: ['asignaciones', 'beneficiario'] })
      qc.invalidateQueries({ queryKey: ['asignaciones', 'actividad'] })
      setFeedback({ kind: 'success', message: 'Asignación actualizada correctamente.' })
      setTimeout(onClose, 250)
    },
    onError: (err: unknown) => {
      setFeedback({ kind: 'error', message: toErrorMessage(err, 'No se pudo actualizar la asignación.') })
    },
  })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>
            {state.kind === 'coordinador' && 'Editar coordinador-técnico'}
            {state.kind === 'beneficiario' && 'Editar técnico-beneficiario'}
            {state.kind === 'actividad' && 'Editar técnico-actividad'}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        </div>
        <div className="modal-body">
          {state.kind === 'coordinador' && (
            <>
              <div className="form-group">
                <label className="form-label">Coordinador</label>
                <select className="input" value={form.coordinador_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, coordinador_id: e.target.value }))}>
                  <option value="">Sin coordinador</option>
                  {coordinadores.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha límite</label>
                <input className="input" type="date" value={form.fecha_limite ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, fecha_limite: e.target.value }))} />
              </div>
            </>
          )}

          {state.kind === 'beneficiario' && (
            <>
              <div className="form-group">
                <label className="form-label">Técnico</label>
                <select className="input" value={form.tecnico_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, tecnico_id: e.target.value }))}>
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Beneficiario</label>
                <select className="input" value={form.beneficiario_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, beneficiario_id: e.target.value }))}>
                  <option value="">Selecciona beneficiario</option>
                  {beneficiarios.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {state.kind === 'actividad' && (
            <>
              <div className="form-group">
                <label className="form-label">Técnico</label>
                <select className="input" value={form.tecnico_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, tecnico_id: e.target.value }))}>
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Actividad</label>
                <select className="input" value={form.actividad_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, actividad_id: e.target.value }))}>
                  <option value="">Selecciona actividad</option>
                  {actividades.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="activo-asignacion" type="checkbox" checked={form.activo} onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))} />
            <label htmlFor="activo-asignacion" className="form-label" style={{ margin: 0 }}>Asignación activa</label>
          </div>

          {feedback && <FeedbackBanner kind={feedback.kind} message={feedback.message} compact />}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <><span className="spinner" />Guardando...</> : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AsignacionesPage() {
  const location = useLocation()
  const { user } = useAuth()
  const canManage = canManageAsignaciones(user?.rol)
  const qc = useQueryClient()
  const [tecnicoBeneficiarioId, setTecnicoBeneficiarioId] = useState('')
  const [beneficiarioId, setBeneficiarioId] = useState('')
  const [tecnicoActividadId, setTecnicoActividadId] = useState('')
  const [actividadId, setActividadId] = useState('')
  const [beneficiarioFeedback, setBeneficiarioFeedback] = useState<Feedback>(null)
  const [actividadFeedback, setActividadFeedback] = useState<Feedback>(null)
  const [tableFeedback, setTableFeedback] = useState<Feedback>(null)
  const [editState, setEditState] = useState<EditState>(null)
  const [openSections, setOpenSections] = useState({
    coordinadorTecnico: true,
    tecnicoBeneficiario: true,
    tecnicoActividad: true,
  })

  const { data: tecnicosData, isLoading: loadingTecnicos } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosApi.list().then((r) => r.data),
    staleTime: 120000,
  })

  const { data: beneficiariosData, isLoading: loadingBeneficiarios } = useQuery({
    queryKey: ['beneficiarios', { page: 1 }],
    queryFn: () => beneficiariosApi.list({ page: 1 }).then((r) => r.data),
    staleTime: 120000,
  })

  const { data: actividadesData, isLoading: loadingActividades } = useQuery({
    queryKey: ['actividades'],
    queryFn: () => actividadesApi.list().then((r) => r.data),
    staleTime: 120000,
  })

  const { data: usuariosData, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then((r) => r.data),
    staleTime: 120000,
    enabled: canManage,
  })

  const { data: coordinadorTecnicoData, isLoading: loadingCoordinadorTecnico } = useQuery({
    queryKey: ['asignaciones', 'coordinador-tecnico'],
    queryFn: () => asignacionesApi.listarCoordinadorTecnico().then((r) => r.data),
    staleTime: 30000,
    enabled: canManage,
  })

  const { data: asignacionesBeneficiarioData, isLoading: loadingAsignacionesBeneficiario } = useQuery({
    queryKey: ['asignaciones', 'beneficiario'],
    queryFn: () => asignacionesApi.listarBeneficiario().then((r) => r.data),
    staleTime: 30000,
    enabled: canManage,
  })

  const { data: asignacionesActividadData, isLoading: loadingAsignacionesActividad } = useQuery({
    queryKey: ['asignaciones', 'actividad'],
    queryFn: () => asignacionesApi.listarActividad().then((r) => r.data),
    staleTime: 30000,
    enabled: canManage,
  })

  const asignarBeneficiario = useMutation({
    mutationFn: () => asignacionesApi.asignarBeneficiario({ tecnico_id: tecnicoBeneficiarioId, beneficiario_id: beneficiarioId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'beneficiario'] })
      setBeneficiarioFeedback({ kind: 'success', message: 'Beneficiario asignado correctamente.' })
      setBeneficiarioId('')
    },
    onError: (e: unknown) => setBeneficiarioFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo asignar el beneficiario.') }),
  })

  const asignarActividad = useMutation({
    mutationFn: () => asignacionesApi.asignarActividad({ tecnico_id: tecnicoActividadId, actividad_id: actividadId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'actividad'] })
      setActividadFeedback({ kind: 'success', message: 'Actividad asignada correctamente.' })
      setActividadId('')
    },
    onError: (e: unknown) => setActividadFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo asignar la actividad.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ kind, id }: { kind: 'coordinador' | 'beneficiario' | 'actividad'; id: string }) => {
      if (kind === 'coordinador') return asignacionesApi.quitarCoordinadorTecnico(id)
      if (kind === 'beneficiario') return asignacionesApi.quitarBeneficiario(id)
      return asignacionesApi.quitarActividad(id)
    },
    onSuccess: (_, variables) => {
      if (variables.kind === 'coordinador') qc.invalidateQueries({ queryKey: ['asignaciones', 'coordinador-tecnico'] })
      if (variables.kind === 'beneficiario') qc.invalidateQueries({ queryKey: ['asignaciones', 'beneficiario'] })
      if (variables.kind === 'actividad') qc.invalidateQueries({ queryKey: ['asignaciones', 'actividad'] })
      setTableFeedback({ kind: 'success', message: 'Asignación eliminada correctamente.' })
    },
    onError: (err: unknown) => {
      setTableFeedback({ kind: 'error', message: toErrorMessage(err, 'No se pudo eliminar la asignación.') })
    },
  })

  const tecnicos = pickArray<Tecnico>(tecnicosData as unknown, ['tecnicos', 'rows', 'data'])
  const beneficiarios = pickArray<Beneficiario>(beneficiariosData as unknown, ['beneficiarios', 'rows', 'data'])
  const actividades = pickArray<Actividad>(actividadesData as unknown, ['actividades', 'rows', 'data'])
  const coordinadores = useMemo(
    () => pickArray<Coordinador>(usuariosData as unknown, ['usuarios', 'rows', 'data']).filter((item) => item.rol === 'coordinador'),
    [usuariosData]
  )

  const tecnicoMap = useMemo(() => new Map(tecnicos.map((item) => [String(item.id), item.nombre])), [tecnicos])
  const beneficiarioMap = useMemo(() => new Map(beneficiarios.map((item) => [String(item.id), item.nombre])), [beneficiarios])
  const actividadMap = useMemo(() => new Map(actividades.map((item) => [String(item.id), item.nombre])), [actividades])
  const coordinadorMap = useMemo(() => new Map(coordinadores.map((item) => [String(item.id), item.nombre])), [coordinadores])

  const coordinadorTecnico = pickArray<CoordinadorTecnicoAsignacion>(coordinadorTecnicoData as unknown, ['tecnico_detalles', 'asignaciones', 'rows', 'data'])
  const asignacionesBeneficiario = pickArray<BeneficiarioAsignacion>(asignacionesBeneficiarioData as unknown, ['asignaciones_beneficiario', 'asignaciones', 'rows', 'data'])
  const asignacionesActividad = pickArray<ActividadAsignacion>(asignacionesActividadData as unknown, ['asignaciones_actividad', 'asignaciones', 'rows', 'data'])

  const loadingCreate = loadingTecnicos || loadingBeneficiarios || loadingActividades
  const loadingTables = loadingCoordinadorTecnico || loadingAsignacionesBeneficiario || loadingAsignacionesActividad || loadingUsuarios

  const section = location.pathname.includes('/asignaciones/tecnico-beneficiario')
    ? 'beneficiario'
    : location.pathname.includes('/asignaciones/tecnico-actividad')
      ? 'actividad'
      : 'coordinador'

  const showCoordinador = section === 'coordinador'
  const showBeneficiario = section === 'beneficiario'
  const showActividad = section === 'actividad'

  const pageTitle = showCoordinador
    ? 'Asignaciones: Coordinador -> Técnico'
    : showBeneficiario
      ? 'Asignaciones: Técnico -> Beneficiario'
      : 'Asignaciones: Técnico -> Actividad'

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">Alta, consulta y edición rápida para la relación seleccionada.</p>
        </div>
      </div>

      {!canManage && (
        <div className="card"><p>No tienes permisos para administrar asignaciones.</p></div>
      )}

      {canManage && (
        <>
          {(showBeneficiario || showActividad) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {showBeneficiario && (
            <div className="card">
              <SectionHeader icon={Link2} title="Asignar beneficiario" subtitle="Crea o reactiva la relación técnico-beneficiario." />
              <div className="form-group">
                <label className="form-label">Técnico</label>
                <select className="input" value={tecnicoBeneficiarioId} onChange={(e) => setTecnicoBeneficiarioId(e.target.value)}>
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Beneficiario</label>
                <select className="input" value={beneficiarioId} onChange={(e) => setBeneficiarioId(e.target.value)}>
                  <option value="">Selecciona beneficiario</option>
                  {beneficiarios.map((b) => <option key={b.id} value={String(b.id)}>{b.nombre}</option>)}
                </select>
              </div>
              {beneficiarioFeedback && <FeedbackBanner kind={beneficiarioFeedback.kind} message={beneficiarioFeedback.message} compact />}
              <button className="btn btn-primary" disabled={loadingCreate || asignarBeneficiario.isPending || !tecnicoBeneficiarioId || !beneficiarioId} onClick={() => asignarBeneficiario.mutate()}>
                {asignarBeneficiario.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar beneficiario'}
              </button>
            </div>
            )}

            {showActividad && (
            <div className="card">
              <SectionHeader icon={ClipboardList} title="Asignar actividad" subtitle="Crea o reactiva la relación técnico-actividad." />
              <div className="form-group">
                <label className="form-label">Técnico</label>
                <select className="input" value={tecnicoActividadId} onChange={(e) => setTecnicoActividadId(e.target.value)}>
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Actividad</label>
                <select className="input" value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
                  <option value="">Selecciona actividad</option>
                  {actividades.map((a) => <option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
                </select>
              </div>
              {actividadFeedback && <FeedbackBanner kind={actividadFeedback.kind} message={actividadFeedback.message} compact />}
              <button className="btn btn-primary" disabled={loadingCreate || asignarActividad.isPending || !tecnicoActividadId || !actividadId} onClick={() => asignarActividad.mutate()}>
                {asignarActividad.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar actividad'}
              </button>
            </div>
            )}
          </div>
          )}

          {tableFeedback && <div style={{ marginTop: 16 }}><FeedbackBanner kind={tableFeedback.kind} message={tableFeedback.message} /></div>}

          {showCoordinador && (
          <CollapsibleSection
            icon={Users}
            title="Coordinador a Técnico"
            subtitle="Consulta y ajusta coordinador, fecha límite y estado de la relación."
            isOpen={openSections.coordinadorTecnico}
            onToggle={() => setOpenSections((prev) => ({ ...prev, coordinadorTecnico: !prev.coordinadorTecnico }))}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Técnico</th><th>Coordinador</th><th>Fecha límite</th><th>Corte</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {loadingTables ? (
                    Array(3).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>)
                  ) : coordinadorTecnico.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><p>Sin asignaciones coordinador-técnico.</p></div></td></tr>
                  ) : coordinadorTecnico.map((row) => {
                    const tecnicoNombre = tecnicoMap.get(String(row.tecnico_id)) ?? row.tecnico_id
                    const coordinadorNombre = row.coordinador_nombre ?? (row.coordinador_id ? coordinadorMap.get(String(row.coordinador_id)) : undefined) ?? '—'
                    return (
                      <tr key={row.tecnico_id}>
                        <td style={{ fontWeight: 600 }}>{tecnicoNombre}</td>
                        <td>{coordinadorNombre}</td>
                        <td>{formatDate(row.fecha_limite)}</td>
                        <td><span className={`badge badge-${row.estado_corte === 'corte_aplicado' ? 'amber' : row.estado_corte === 'baja' ? 'gray' : 'green'}`}>{row.estado_corte ?? 'en_servicio'}</span></td>
                        <td><span className={`badge badge-${isActive(row.activo) ? 'green' : 'gray'}`}>{isActive(row.activo) ? 'Activa' : 'Inactiva'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditState({ kind: 'coordinador', row })}><Pencil size={13} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={() => confirm(`¿Eliminar la asignación de ${tecnicoNombre}?`) && deleteMutation.mutate({ kind: 'coordinador', id: row.tecnico_id })}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
          )}

          {showBeneficiario && (
          <CollapsibleSection
            icon={Link2}
            title="Técnico a Beneficiario"
            subtitle="Consulta, edita o desactiva asignaciones activas e históricas."
            isOpen={openSections.tecnicoBeneficiario}
            onToggle={() => setOpenSections((prev) => ({ ...prev, tecnicoBeneficiario: !prev.tecnicoBeneficiario }))}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Técnico</th><th>Beneficiario</th><th>Asignado</th><th>Removido</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {loadingTables ? (
                    Array(3).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>)
                  ) : asignacionesBeneficiario.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><p>Sin asignaciones técnico-beneficiario.</p></div></td></tr>
                  ) : asignacionesBeneficiario.map((row) => {
                    const tecnicoNombre = row.tecnico_id ? tecnicoMap.get(String(row.tecnico_id)) ?? row.tecnico_id : '—'
                    const beneficiarioNombre = row.beneficiario_id ? beneficiarioMap.get(String(row.beneficiario_id)) ?? row.beneficiario_id : '—'
                    return (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{tecnicoNombre}</td>
                        <td>{beneficiarioNombre}</td>
                        <td>{formatDateTime(row.asignado_en)}</td>
                        <td>{formatDateTime(row.removido_en)}</td>
                        <td><span className={`badge badge-${isActive(row.activo) ? 'green' : 'gray'}`}>{isActive(row.activo) ? 'Activa' : 'Inactiva'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditState({ kind: 'beneficiario', row })}><Pencil size={13} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={() => confirm(`¿Eliminar la asignación de ${beneficiarioNombre}?`) && deleteMutation.mutate({ kind: 'beneficiario', id: row.id })}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
          )}

          {showActividad && (
          <CollapsibleSection
            icon={ClipboardList}
            title="Técnico a Actividad"
            subtitle="Consulta, edita o desactiva asignaciones de actividades."
            isOpen={openSections.tecnicoActividad}
            onToggle={() => setOpenSections((prev) => ({ ...prev, tecnicoActividad: !prev.tecnicoActividad }))}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Técnico</th><th>Actividad</th><th>Asignado</th><th>Removido</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {loadingTables ? (
                    Array(3).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>)
                  ) : asignacionesActividad.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><p>Sin asignaciones técnico-actividad.</p></div></td></tr>
                  ) : asignacionesActividad.map((row) => {
                    const tecnicoNombre = row.tecnico_id ? tecnicoMap.get(String(row.tecnico_id)) ?? row.tecnico_id : '—'
                    const actividadNombre = row.actividad_id ? actividadMap.get(String(row.actividad_id)) ?? row.actividad_id : '—'
                    return (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{tecnicoNombre}</td>
                        <td>{actividadNombre}</td>
                        <td>{formatDateTime(row.asignado_en)}</td>
                        <td>{formatDateTime(row.removido_en)}</td>
                        <td><span className={`badge badge-${isActive(row.activo) ? 'green' : 'gray'}`}>{isActive(row.activo) ? 'Activa' : 'Inactiva'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditState({ kind: 'actividad', row })}><Pencil size={13} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={() => confirm(`¿Eliminar la asignación de ${actividadNombre}?`) && deleteMutation.mutate({ kind: 'actividad', id: row.id })}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
          )}
        </>
      )}

      {editState && (
        <EditAsignacionModal
          state={editState}
          tecnicos={tecnicos}
          coordinadores={coordinadores}
          beneficiarios={beneficiarios}
          actividades={actividades}
          onClose={() => setEditState(null)}
        />
      )}
    </div>
  )
}
