import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tecnicosService, type CreateTecnicoPayload } from '../lib/servicios/tecnicos'
import { coordinadoresService } from '../lib/servicios/coordinadores'
import { getApiErrorMessage } from '../lib/axios'
import { canManageTecnicos } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import { useToast } from '../hooks/useToast'
import { Table } from '../components/ui/Table'
import { Plus, RefreshCw, Copy, Check, X } from 'lucide-react'

interface Tecnico {
  id: number | string
  nombre: string
  correo: string
  telefono?: string
  coordinador_id?: string
  fecha_limite?: string
  codigo_acceso?: string
  estado_corte?: string
  activo?: boolean
}

interface FormData {
  nombre: string
  correo: string
  telefono: string
  coordinador_id: string
  fecha_limite: string
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function toIsoDateTime(value: string): string | undefined {
  if (!value.trim()) return undefined
  return new Date(`${value}T00:00:00`).toISOString()
}

function CodigoAcceso({ codigo, id, canManage }: { codigo: string; id: string | number; canManage: boolean }) {
  const [copied, setCopied] = useState(false)
  const qc = useQueryClient()
  const regen = useMutation({
    mutationFn: () => tecnicosService.generarCodigoAcceso(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tecnicos'] }),
  })

  const copy = () => {
    navigator.clipboard.writeText(codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, background: 'var(--guinda-50)', color: 'var(--guinda)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em' }}>{codigo}</code>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={copy} title="Copiar">
        {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
      </button>
      {canManage && (
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => regen.mutate()} disabled={regen.isPending} title="Regenerar">
          <RefreshCw size={13} style={{ animation: regen.isPending ? 'spin 0.7s linear infinite' : 'none' }} />
        </button>
      )}
    </div>
  )
}

function TecnicoModal({ tecnico, coordinadores, onClose, toast }: { tecnico?: Tecnico; coordinadores: { id: string; nombre: string }[]; onClose: () => void; toast: { success: (m: string) => void; error: (m: string) => void } }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormData>({
    nombre: tecnico?.nombre ?? '',
    correo: tecnico?.correo ?? '',
    telefono: tecnico?.telefono ?? '',
    coordinador_id: tecnico?.coordinador_id ?? '',
    fecha_limite: tecnico?.fecha_limite?.slice(0, 10) ?? '',
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => {
      const payload: CreateTecnicoPayload = {
        nombre: form.nombre,
        correo: form.correo,
        telefono: form.telefono || undefined,
        coordinador_id: form.coordinador_id || undefined,
        fecha_limite: toIsoDateTime(form.fecha_limite) || undefined,
      }
      if (tecnico) {
        return tecnicosService.update(tecnico.id, payload)
      }
      return tecnicosService.create(payload)
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['tecnicos'] })
      toast.success(tecnico ? 'Técnico actualizado correctamente.' : 'Técnico creado correctamente.')
      onClose() 
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  const handleSave = () => {
    if (!form.nombre.trim() || !form.correo.trim()) {
      setErr('Nombre y correo son obligatorios.')
      return
    }
    if (!form.coordinador_id.trim()) {
      setErr('Selecciona un coordinador.')
      return
    }
    if (!form.fecha_limite.trim()) {
      setErr('La fecha límite es obligatoria.')
      return
    }
    setErr('')
    save.mutate()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{tecnico ? 'Editar técnico' : 'Nuevo técnico'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="input" type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="input" type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono (opcional)</label>
            <input className="input" type="text" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Coordinador</label>
            <select className="input" value={form.coordinador_id} onChange={e => setForm(p => ({ ...p, coordinador_id: e.target.value }))}>
              <option value="">Selecciona un coordinador</option>
              {coordinadores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha límite de acceso</label>
            <input className="input" type="date" value={form.fecha_limite} onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value }))} />
          </div>
          {err && <div className="feedback-banner feedback-error feedback-compact">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? <><span className="spinner" />Guardando...</> : tecnico ? 'Guardar' : 'Crear técnico'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TecnicosPage() {
  const { user } = useAuth()
  const canManage = canManageTecnicos(user?.rol)
  const qc = useQueryClient()
  const toast = useToast()
  const [modal, setModal] = useState<Tecnico | 'new' | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosService.list().then(r => r.data),
    staleTime: 30000,
  })

  const { data: coordsData } = useQuery({
    queryKey: ['coordinadores'],
    queryFn: () => coordinadoresService.list().then(r => r.data),
  })

  const coordinadores = pickArray<{ id: string; nombre: string; rol?: string }>(coordsData, ['coordinadores', 'rows', 'data']).filter(c => c.rol === 'coordinador')

  const aplicarCortes = useMutation({
    mutationFn: () => tecnicosService.aplicarCortes(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tecnicos'] })
      toast.success('Cortes aplicados correctamente.')
    },
    onError: (e: unknown) => toast.error(toErrorMessage(e, 'No se pudieron aplicar cortes.')),
  })

  const tecnicosData = pickArray<Tecnico>(data, ['tecnicos', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Técnicos</h1>
          <p className="page-subtitle">{tecnicosData.length} técnico{tecnicosData.length !== 1 ? 's' : ''} registrado{tecnicosData.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15} /> Nuevo técnico
          </button>
        )}
      </div>

      {canManage && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => aplicarCortes.mutate()} disabled={aplicarCortes.isPending}>
            {aplicarCortes.isPending ? <><span className="spinner" />Aplicando...</> : 'Aplicar cortes'}
          </button>
        </div>
      )}

      <Table
        columns={[
          { key: 'index', header: '#', className: 'w-16' },
          { key: 'nombre', header: 'Nombre' },
          { key: 'correo', header: 'Correo', truncate: true, tooltip: true },
          { key: 'telefono', header: 'Teléfono', render: (t: Tecnico) => t.telefono ?? '—' },
          { 
            key: 'codigo_acceso', 
            header: 'Código', 
            render: (t: Tecnico) => t.codigo_acceso ? <CodigoAcceso codigo={t.codigo_acceso} id={t.id} canManage={canManage} /> : <span style={{ color: 'var(--gray-400)' }}>—</span> 
          },
          { 
            key: 'estado_corte', 
            header: 'Corte', 
            render: (t: Tecnico) => (
              <span className={`badge badge-${t.estado_corte === 'corte_aplicado' ? 'warning' : 'success'}`}>
                {t.estado_corte ?? 'en_servicio'}
              </span>
            )
          },
          { 
            key: 'activo', 
            header: 'Estado', 
            render: (t: Tecnico) => (
              <span className={`badge badge-${t.activo !== false ? 'success' : 'gray'}`}>
                {t.activo !== false ? 'Activo' : 'Inactivo'}
              </span>
            )
          },
        ]}
        data={tecnicosData}
        keyField="id"
        loading={isLoading}
        emptyMessage="Sin técnicos"
        searchable
        searchPlaceholder="Buscar técnico..."
        pageSize={5}
      />

      {modal && canManage && <TecnicoModal tecnico={modal === 'new' ? undefined : modal} coordinadores={coordinadores} onClose={() => setModal(null)} toast={toast} />}
    </div>
  )
}
