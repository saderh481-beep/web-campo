import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { cadenasApi } from '../lib/api'
import { pickArray } from '../lib/normalize'
import { Plus, Pencil, X, Layers, AlertCircle } from 'lucide-react'

interface Cadena {
  id: number
  nombre: string
  descripcion?: string
  total_beneficiarios?: number
}

interface CadenasResponse {
  cadenas?: Cadena[]
}

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function CadenaModal({ cadena, onClose }: { cadena?: Cadena; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ nombre: cadena?.nombre ?? '', descripcion: cadena?.descripcion ?? '' })
  const [err, setErr] = useState('')
  const save = useMutation({
    mutationFn: () => cadena ? cadenasApi.update(cadena.id, form) : cadenasApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cadenas'] }); onClose() },
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
              background: 'var(--accent-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-dark)',
            }}>
              <Layers size={20} />
            </div>
            <h3>{cadena ? 'Editar cadena' : 'Nueva cadena productiva'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} style={{ opacity: 0.5 }} />
              Nombre de la cadena
            </label>
            <input 
              className="input" 
              value={form.nombre} 
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej: Apicultura, Ganaderia..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripcion</label>
            <textarea 
              className="input" 
              rows={3} 
              value={form.descripcion} 
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripcion de la cadena productiva..."
              style={{ resize: 'vertical' }}
            />
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
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button 
            className="btn btn-primary" 
            onClick={() => save.mutate()} 
            disabled={save.isPending || !form.nombre}
          >
            {save.isPending ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Guardando...
              </>
            ) : (
              'Guardar cadena'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CadenasPage() {
  const [modal, setModal] = useState<'new' | Cadena | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['cadenas'],
    queryFn: () => cadenasApi.list().then(r => r.data),
    staleTime: 60000,
  })
  const cadenasData = data as CadenasResponse | Cadena[] | undefined
  const cadenas = pickArray<Cadena>(cadenasData, ['cadenas', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadenas Productivas</h1>
          <p className="page-subtitle">{cadenas.length} cadena{cadenas.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15} /> Nueva cadena</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {isLoading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="card"><div className="skeleton" style={{ height: 24, marginBottom: 8 }} /><div className="skeleton" style={{ height: 40 }} /></div>
        )) : cadenas.map((c) => (
          <div key={c.id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.5 }}>{c.descripcion ?? 'Sin descripción'}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ flexShrink: 0 }} onClick={() => setModal(c)}><Pencil size={13} /></button>
            </div>
            {c.total_beneficiarios !== undefined && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-100)', fontSize: 12, color: 'var(--gray-500)' }}>
                <span className="badge badge-guinda">{c.total_beneficiarios} beneficiarios</span>
              </div>
            )}
          </div>
        ))}
        {!isLoading && cadenas.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}><p>Sin cadenas productivas</p></div>
        )}
      </div>
      {modal && <CadenaModal cadena={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
