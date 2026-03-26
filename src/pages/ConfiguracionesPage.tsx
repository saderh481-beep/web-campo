import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, X, Search } from 'lucide-react'
import { configuracionesApi, getApiErrorMessage } from '../lib/api'
import { canManageConfiguraciones } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface ConfigItem {
  clave: string
  valor: unknown
  descripcion?: string
  updated_at?: string
}

const PREDEFINED_KEYS = ['fecha_corte_global', 'ciclo_nombre', 'pdf_encabezado']

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}

function normalizeConfigRows(source: unknown): ConfigItem[] {
  const rows = pickArray<Record<string, unknown>>(source, ['configuraciones', 'rows', 'data'])
  return rows
    .map((r) => ({
      clave: String(r.clave ?? ''),
      valor: r.valor,
      descripcion: typeof r.descripcion === 'string' ? r.descripcion : undefined,
      updated_at: typeof r.updated_at === 'string' ? r.updated_at : undefined,
    }))
    .filter((r) => r.clave.length > 0)
}

function ConfigModal({ item, onClose }: { item: ConfigItem; onClose: () => void }) {
  const qc = useQueryClient()
  const [text, setText] = useState(() => JSON.stringify(item.valor ?? {}, null, 2))
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('JSON invalido en el valor.')
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('El valor debe ser un objeto JSON.')
      }
      return configuracionesApi.update(item.clave, parsed)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuraciones'] })
      onClose()
    },
    onError: (e: unknown) => setErr(toErrorMessage(e, (e as Error).message || 'No se pudo actualizar')),
  })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>Editar configuracion: {item.clave}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Valor (JSON)</label>
            <textarea className="input" rows={14} value={text} onChange={(e) => setText(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ marginTop: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(text)
                    setText(JSON.stringify(parsed, null, 2))
                    setErr('')
                  } catch {
                    setErr('No se pudo formatear: JSON invalido.')
                  }
                }}
              >
                Formatear JSON
              </button>
            </div>
          </div>
          {err && <FeedbackBanner kind="error" message={err} compact />}
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

export default function ConfiguracionesPage() {
  const { user } = useAuth()
  const canManage = canManageConfiguraciones(user?.rol)
  const [editing, setEditing] = useState<ConfigItem | null>(null)
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['configuraciones', canManage],
    queryFn: async () => {
      if (canManage) {
        const response = await configuracionesApi.list()
        return normalizeConfigRows(response.data)
      }

      const results = await Promise.allSettled(PREDEFINED_KEYS.map((clave) => configuracionesApi.get(clave)))
      const resolved: ConfigItem[] = []
      for (const result of results) {
        if (result.status !== 'fulfilled') continue
        const payload = result.value.data as Record<string, unknown>
        const row = (payload.configuracion ?? payload) as Record<string, unknown>
        const clave = typeof row.clave === 'string' ? row.clave : ''
        if (!clave) continue
        resolved.push({
          clave,
          valor: row.valor,
          descripcion: typeof row.descripcion === 'string' ? row.descripcion : undefined,
          updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
        })
      }
      return resolved
    },
    staleTime: 60000,
  })

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const rowsFiltradas = rows.filter((row) => {
    if (!q.trim()) return true
    const query = q.toLowerCase()
    return row.clave.toLowerCase().includes(query) || (row.descripcion ?? '').toLowerCase().includes(query)
  })

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuraciones</h1>
          <p className="page-subtitle">Catalogo global de claves y valores JSON. Mostrando {rowsFiltradas.length} de {rows.length}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={15} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <input
          className="input"
          style={{ border: 'none', padding: 0, boxShadow: 'none' }}
          placeholder="Buscar por clave o descripcion"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQ('')}><X size={14} /></button>}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Clave</th><th>Descripcion</th><th>Valor</th><th>Actualizado</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(4).fill(0).map((_, i) => (
              <tr key={i}>{Array(5).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : rowsFiltradas.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><p>Sin configuraciones visibles</p></div></td></tr>
            ) : rowsFiltradas.map((row) => (
              <tr key={row.clave}>
                <td style={{ fontWeight: 700 }}>{row.clave}</td>
                <td style={{ color: 'var(--gray-500)' }}>{row.descripcion ?? '—'}</td>
                <td>
                  <pre style={{ margin: 0, fontSize: 11, color: 'var(--gray-700)', maxWidth: 460, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(row.valor ?? {}, null, 2)}
                  </pre>
                </td>
                <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  {row.updated_at ? new Date(row.updated_at).toLocaleString('es-MX') : '—'}
                </td>
                <td>
                  {canManage && (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(row)}>
                      <Pencil size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && canManage && <ConfigModal item={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
