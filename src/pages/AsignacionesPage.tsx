import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actividadesService, asignacionesService } from '../lib/servicios/asignaciones'
import { beneficiariosService } from '../lib/servicios/beneficiarios'
import { tecnicosService } from '../lib/servicios/tecnicos'
import { coordinadoresService } from '../lib/servicios/coordinadores'
import { getApiErrorMessage } from '../lib/axios'
import { canManageAsignaciones } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { pickArray } from '../lib/normalize'
import { Table } from '../components/ui/Table'
import { ChevronDown, ChevronRight, Clipboard, Link2, Pencil, Trash2, Users } from 'lucide-react'

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
  tecnico_nombre?: string
  coordinador_id?: string
  coordinador_nombre?: string
  fecha_limite?: string
  estado_corte?: string
  activo?: boolean
}

type CoordinatorTecnicoAsignacion = CoordinadorTecnicoAsignacion

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
  toast,
}: {
  state: Exclude<EditState, null>
  tecnicos: Tecnico[]
  coordinadores: Coordinador[]
  beneficiarios: Beneficiario[]
  actividades: Actividad[]
  onClose: () => void
  toast: { success: (m: string) => void; error: (m: string) => void }
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<EditFormState>(() => {
    if (state.kind === 'coordinador') {
      return {
        tecnico_id: state.row.tecnico_id ?? '',
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
        return asignacionesService.actualizarCoordinadorTecnico(state.row.tecnico_id, payload)
      }

      if (state.kind === 'beneficiario') {
        const payload = {
          tecnico_id: form.tecnico_id || undefined,
          beneficiario_id: form.beneficiario_id || undefined,
          activo: form.activo,
        }
        return asignacionesService.actualizarBeneficiario(state.row.id, payload)
      }

      const payload = {
        tecnico_id: form.tecnico_id || undefined,
        actividad_id: form.actividad_id || undefined,
        activo: form.activo,
      }
      return asignacionesService.actualizarActividad(state.row.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'coordinador-tecnico'] })
      qc.invalidateQueries({ queryKey: ['asignaciones', 'beneficiario'] })
      qc.invalidateQueries({ queryKey: ['asignaciones', 'actividad'] })
      toast.success('Asignación actualizada correctamente.')
      setTimeout(onClose, 250)
    },
    onError: (err: unknown) => {
      toast.error(toErrorMessage(err, 'No se pudo actualizar la asignación.'))
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
                <label className="form-label">Técnico</label>
                <select className="input" value={form.tecnico_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, tecnico_id: e.target.value }))}>
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map((item) => (
                    <option key={item.id} value={String(item.id)}>{item.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Coordinador</label>
                <select className="input" value={form.coordinador_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, coordinador_id: e.target.value }))}>
                  <option value="">Sin coordinador</option>
                  {coordinadores.filter(c => c.rol === 'coordinador').map((item) => (
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
  const toast = useToast()
  const [coordinadorTecnicoId, setCoordinadorTecnicoId] = useState('')
  const [coordinadorId, setCoordinadorId] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [tecnicoBeneficiarioId, setTecnicoBeneficiarioId] = useState('')
  const [beneficiarioId, setBeneficiarioId] = useState('')
  const [tecnicoActividadId, setTecnicoActividadId] = useState('')
  const [actividadId, setActividadId] = useState('')
  const [editState, setEditState] = useState<EditState>(null)
  const [openSections, setOpenSections] = useState({
    coordinadorTecnico: true,
    tecnicoBeneficiario: true,
    tecnicoActividad: true,
  })

  const { data: tecnicosData, isLoading: loadingTecnicos } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosService.list().then((r) => r.data),
    staleTime: 120000,
  })

  const { data: beneficiariosData, isLoading: loadingBeneficiarios } = useQuery({
    queryKey: ['beneficiarios', { page: 1 }],
    queryFn: () => beneficiariosService.list({ page: 1 }).then((r) => r.data),
    staleTime: 120000,
  })

  const { data: actividadesData, isLoading: loadingActividades } = useQuery({
    queryKey: ['actividades'],
    queryFn: () => actividadesService.list().then((r) => r.data),
    staleTime: 120000,
  })

  const { data: coordinadoresData, isLoading: loadingCoordinadores } = useQuery({
    queryKey: ['coordinadores'],
    queryFn: () => coordinadoresService.list().then((r) => r.data),
    staleTime: 120000,
    enabled: canManage,
  })

  const { data: coordinadorTecnicoData, isLoading: loadingCoordinadorTecnico } = useQuery({
    queryKey: ['asignaciones', 'coordinador-tecnico'],
    queryFn: () => asignacionesService.listaAlternativaCoordinadorTecnico().then((r) => r.data),
    staleTime: 30000,
    enabled: canManage,
  })

  const { data: asignacionesBeneficiarioData, isLoading: loadingAsignacionesBeneficiario } = useQuery({
    queryKey: ['asignaciones', 'beneficiario'],
    queryFn: () => asignacionesService.listarBeneficiario({ activo: true }).then((r) => r.data),
    staleTime: 30000,
    enabled: canManage,
  })

  const { data: asignacionesActividadData, isLoading: loadingAsignacionesActividad } = useQuery({
    queryKey: ['asignaciones', 'actividad'],
    queryFn: () => asignacionesService.listarActividad({}).then((r) => r.data),
    staleTime: 30000,
    enabled: canManage,
  })

  const asignarBeneficiario = useMutation({
    mutationFn: () => asignacionesService.asignarBeneficiario({ tecnico_id: tecnicoBeneficiarioId, beneficiario_id: beneficiarioId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'beneficiario'] })
      toast.success('Beneficiario asignado correctamente.')
      setBeneficiarioId('')
    },
    onError: (e: unknown) => toast.error(toErrorMessage(e, 'No se pudo asignar el beneficiario.')),
  })

  const asignarActividad = useMutation({
    mutationFn: () => asignacionesService.asignarActividad({ tecnico_id: tecnicoActividadId, actividad_id: actividadId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'actividad'] })
      toast.success('Actividad asignada correctamente.')
      setActividadId('')
    },
    onError: (e: unknown) => toast.error(toErrorMessage(e, 'No se pudo asignar la actividad.')),
  })

  const asignarCoordinador = useMutation({
    mutationFn: () => {
      if (!coordinadorTecnicoId || !coordinadorId || !fechaLimite?.trim()) {
        throw new Error('Debes seleccionar técnico, coordinador y fecha límite.')
      }
      const isoDate = toIsoDateTime(fechaLimite)
      if (!isoDate) {
        throw new Error('Fecha límite inválida.')
      }
      return asignacionesService.asignarCoordinadorTecnico({
        tecnico_id: coordinadorTecnicoId,
        coordinador_id: coordinadorId,
        fecha_limite: isoDate,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones', 'coordinador-tecnico'] })
      qc.invalidateQueries({ queryKey: ['tecnicos'] })
      toast.success('Coordinador asignado correctamente.')
      setCoordinadorTecnicoId('')
      setCoordinadorId('')
      setFechaLimite('')
    },
    onError: (e: unknown) => toast.error(toErrorMessage(e, 'No se pudo asignar el coordinador.')),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ kind, id }: { kind: 'coordinador' | 'beneficiario' | 'actividad'; id: string }) => {
      if (kind === 'coordinador') return asignacionesService.quitarCoordinadorTecnico(id)
      if (kind === 'beneficiario') return asignacionesService.quitarBeneficiario(id)
      return asignacionesService.quitarActividad(id)
    },
    onSuccess: (_, variables) => {
      if (variables.kind === 'coordinador') qc.invalidateQueries({ queryKey: ['asignaciones', 'coordinador-tecnico'] })
      if (variables.kind === 'beneficiario') qc.invalidateQueries({ queryKey: ['asignaciones', 'beneficiario'] })
      if (variables.kind === 'actividad') qc.invalidateQueries({ queryKey: ['asignaciones', 'actividad'] })
      toast.success('Asignación eliminada correctamente.')
    },
    onError: (err: unknown) => {
      toast.error(toErrorMessage(err, 'No se pudo eliminar la asignación.'))
    },
  })

  const tecnicos = pickArray<Tecnico>(tecnicosData as unknown, ['tecnicos', 'rows', 'data'])
  const beneficiarios = pickArray<Beneficiario>(beneficiariosData as unknown, ['beneficiarios', 'rows', 'data'])
  const actividades = pickArray<Actividad>(actividadesData as unknown, ['actividades', 'rows', 'data'])
  const coordinadores = pickArray<Coordinador>(coordinadoresData as unknown, ['coordinadores', 'rows', 'data'])

  const tecnicoMap = useMemo(() => new Map(tecnicos.map((item) => [String(item.id), item.nombre])), [tecnicos])
  const beneficiarioMap = useMemo(() => new Map(beneficiarios.map((item) => [String(item.id), item.nombre])), [beneficiarios])
  const actividadMap = useMemo(() => new Map(actividades.map((item) => [String(item.id), item.nombre])), [actividades])
  const coordinadorMap = useMemo(() => new Map(coordinadores.map((item) => [String(item.id), item.nombre])), [coordinadores])

  const getCoordTecnicoData = (data: unknown): CoordinatorTecnicoAsignacion[] => {
    if (Array.isArray(data)) return data as CoordinatorTecnicoAsignacion[]
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      if (Array.isArray(d.data)) return d.data as CoordinatorTecnicoAsignacion[]
      if (Array.isArray(d.rows)) return d.rows as CoordinatorTecnicoAsignacion[]
      if (Array.isArray(d.asignaciones)) return d.asignaciones as CoordinatorTecnicoAsignacion[]
      const keys = Object.keys(d)
      for (const k of keys) {
        if (Array.isArray(d[k])) return d[k] as CoordinatorTecnicoAsignacion[]
      }
    }
    return []
  }
  const coordinadorTecnico = getCoordTecnicoData(coordinadorTecnicoData)
  const asignacionesBeneficiario = pickArray<BeneficiarioAsignacion>(asignacionesBeneficiarioData as unknown, ['asignaciones_beneficiario', 'asignaciones', 'rows', 'data'])
  const asignacionesActividad = pickArray<ActividadAsignacion>(asignacionesActividadData as unknown, ['asignaciones_actividad', 'asignaciones', 'rows', 'data'])

  const loadingCreate = loadingTecnicos || loadingBeneficiarios || loadingActividades
  const loadingTables = loadingCoordinadorTecnico || loadingAsignacionesBeneficiario || loadingAsignacionesActividad || loadingCoordinadores

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
          {(showCoordinador || showBeneficiario || showActividad) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {showCoordinador && (
            <div className="card">
              <SectionHeader icon={Users} title="Asignar coordinador" subtitle="Crea o reemplaza la relación coordinador-técnico." />
              <div className="form-group">
                <label className="form-label">Técnico</label>
                <select className="input" value={coordinadorTecnicoId} onChange={(e) => setCoordinadorTecnicoId(e.target.value)}>
                  <option value="">Selecciona técnico</option>
                  {tecnicos.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Coordinador</label>
                <select className="input" value={coordinadorId} onChange={(e) => setCoordinadorId(e.target.value)}>
                  <option value="">Selecciona coordinador</option>
                  {coordinadores.filter(c => c.rol === 'coordinador').map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha límite</label>
                <input className="input" type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
              </div>
              <button className="btn btn-primary" disabled={loadingTecnicos || loadingCoordinadores || asignarCoordinador.isPending || !coordinadorTecnicoId || !coordinadorId || !fechaLimite} onClick={() => asignarCoordinador.mutate()}>
                {asignarCoordinador.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar coordinador'}
              </button>
            </div>
            )}

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
              <button className="btn btn-primary" disabled={loadingCreate || asignarBeneficiario.isPending || !tecnicoBeneficiarioId || !beneficiarioId} onClick={() => asignarBeneficiario.mutate()}>
                {asignarBeneficiario.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar beneficiario'}
              </button>
            </div>
            )}

            {showActividad && (
            <div className="card">
              <SectionHeader icon={Clipboard} title="Asignar actividad" subtitle="Crea o reactiva la relación técnico-actividad." />
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
              <button className="btn btn-primary" disabled={loadingCreate || asignarActividad.isPending || !tecnicoActividadId || !actividadId} onClick={() => asignarActividad.mutate()}>
                {asignarActividad.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar actividad'}
              </button>
            </div>
            )}
          </div>
          )}

          {showCoordinador && (
          <CollapsibleSection
            icon={Users}
            title="Coordinador a Técnico"
            subtitle="Consulta y ajusta coordinador, fecha límite y estado de la relación."
            isOpen={openSections.coordinadorTecnico}
            onToggle={() => setOpenSections((prev) => ({ ...prev, coordinadorTecnico: !prev.coordinadorTecnico }))}
          >
            <Table
              columns={[
                { key: 'tecnico', header: 'Técnico', render: (row: typeof coordinadorTecnico[0]) => <span style={{ fontWeight: 600 }}>{row.tecnico_nombre ?? tecnicoMap.get(String(row.tecnico_id)) ?? row.tecnico_id}</span> },
                { key: 'coordinador', header: 'Coordinador', render: (row: typeof coordinadorTecnico[0]) => row.coordinador_nombre ?? (row.coordinador_id ? coordinadorMap.get(String(row.coordinador_id)) : undefined) ?? '—' },
                { key: 'fecha_limite', header: 'Fecha límite', render: (row: typeof coordinadorTecnico[0]) => formatDate(row.fecha_limite) },
                { key: 'estado_corte', header: 'Corte', render: (row: typeof coordinadorTecnico[0]) => <span className={`badge badge-${row.estado_corte === 'corte_aplicado' ? 'warning' : row.estado_corte === 'baja' ? 'gray' : 'success'}`}>{row.estado_corte ?? 'en_servicio'}</span> },
                { key: 'activo', header: 'Estado', render: (row: typeof coordinadorTecnico[0]) => <span className={`badge badge-${isActive(row.activo) ? 'success' : 'gray'}`}>{isActive(row.activo) ? 'Activa' : 'Inactiva'}</span> },
              ]}
              data={coordinadorTecnico}
              keyField="tecnico_id"
              loading={loadingTables}
              emptyMessage="Sin asignaciones coordinador-técnico"
              pageSize={5}
              renderActions={(row: typeof coordinadorTecnico[0]) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditState({ kind: 'coordinador', row })} title="Editar"><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={deleteMutation.isPending || !row.tecnico_id} onClick={() => {
                    if (!row.tecnico_id) return
                    if (confirm(`¿Eliminar la asignación de ${row.tecnico_nombre ?? row.tecnico_id}?`)) {
                      deleteMutation.mutate({ kind: 'coordinador', id: row.tecnico_id })
                    }
                  }} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              )}
            />
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
            <Table
              columns={[
                { key: 'tecnico', header: 'Técnico', render: (row: typeof asignacionesBeneficiario[0]) => <span style={{ fontWeight: 600 }}>{row.tecnico_id ? tecnicoMap.get(String(row.tecnico_id)) ?? row.tecnico_id : '—'}</span> },
                { key: 'beneficiario', header: 'Beneficiario', render: (row: typeof asignacionesBeneficiario[0]) => row.beneficiario_id ? beneficiarioMap.get(String(row.beneficiario_id)) ?? row.beneficiario_id : '—' },
                { key: 'asignado_en', header: 'Asignado', render: (row: typeof asignacionesBeneficiario[0]) => formatDateTime(row.asignado_en) },
                { key: 'removido_en', header: 'Removido', render: (row: typeof asignacionesBeneficiario[0]) => formatDateTime(row.removido_en) },
                { key: 'activo', header: 'Estado', render: (row: typeof asignacionesBeneficiario[0]) => <span className={`badge badge-${isActive(row.activo) ? 'success' : 'gray'}`}>{isActive(row.activo) ? 'Activa' : 'Inactiva'}</span> },
              ]}
              data={asignacionesBeneficiario}
              keyField="id"
              loading={loadingTables}
              emptyMessage="Sin asignaciones técnico-beneficiario"
              pageSize={5}
              renderActions={(row: typeof asignacionesBeneficiario[0]) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditState({ kind: 'beneficiario', row })} title="Editar"><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={() => confirm(`¿Eliminar la asignación de ${row.beneficiario_id}?`) && deleteMutation.mutate({ kind: 'beneficiario', id: row.id })} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              )}
            />
          </CollapsibleSection>
          )}

          {showActividad && (
          <CollapsibleSection
            icon={Clipboard}
            title="Técnico a Actividad"
            subtitle="Consulta, edita o desactiva asignaciones de actividades."
            isOpen={openSections.tecnicoActividad}
            onToggle={() => setOpenSections((prev) => ({ ...prev, tecnicoActividad: !prev.tecnicoActividad }))}
          >
            <Table
              columns={[
                { key: 'tecnico', header: 'Técnico', render: (row: typeof asignacionesActividad[0]) => <span style={{ fontWeight: 600 }}>{row.tecnico_id ? tecnicoMap.get(String(row.tecnico_id)) ?? row.tecnico_id : '—'}</span> },
                { key: 'actividad', header: 'Actividad', render: (row: typeof asignacionesActividad[0]) => row.actividad_id ? actividadMap.get(String(row.actividad_id)) ?? row.actividad_id : '—' },
                { key: 'asignado_en', header: 'Asignado', render: (row: typeof asignacionesActividad[0]) => formatDateTime(row.asignado_en) },
                { key: 'removido_en', header: 'Removido', render: (row: typeof asignacionesActividad[0]) => formatDateTime(row.removido_en) },
                { key: 'activo', header: 'Estado', render: (row: typeof asignacionesActividad[0]) => <span className={`badge badge-${isActive(row.activo) ? 'success' : 'gray'}`}>{isActive(row.activo) ? 'Activa' : 'Inactiva'}</span> },
              ]}
              data={asignacionesActividad}
              keyField="id"
              loading={loadingTables}
              emptyMessage="Sin asignaciones técnico-actividad"
              pageSize={5}
              renderActions={(row: typeof asignacionesActividad[0]) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditState({ kind: 'actividad', row })} title="Editar"><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={() => confirm(`¿Eliminar la asignación de ${row.actividad_id}?`) && deleteMutation.mutate({ kind: 'actividad', id: row.id })} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              )}
            />
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
          toast={toast}
        />
      )}
    </div>
  )
}
