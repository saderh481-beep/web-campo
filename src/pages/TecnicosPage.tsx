import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { tecnicosApi } from '../lib/api'
import { pickArray } from '../lib/normalize'
import { Plus, RefreshCw, Copy, Check, Trash2, Pencil, X, Search, UserCheck, Mail, MapPin, AlertCircle } from 'lucide-react'

interface Tecnico { 
  id: number
  nombre: string
  correo: string
  municipio?: string
  codigo_acceso?: string
  activo?: boolean
  vencimiento_codigo?: string 
}

interface FormData { 
  nombre: string
  correo: string
  municipio: string 
}

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function CodigoAcceso({ codigo, id }: { codigo: string; id: number }) {
  const [copied, setCopied] = useState(false)
  const qc = useQueryClient()
  const regen = useMutation({
    mutationFn: () => tecnicosApi.regenerarCodigo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tecnicos'] }),
  })
  
  const copy = () => {
    navigator.clipboard.writeText(codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <code style={{ 
        fontFamily: 'monospace', 
        fontWeight: 700, 
        fontSize: 13, 
        background: 'var(--primary-50)', 
        color: 'var(--primary)', 
        padding: '4px 10px', 
        borderRadius: 6, 
        letterSpacing: '0.1em',
      }}>
        {codigo}
      </code>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={copy} title="Copiar">
        {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
      </button>
      <button 
        className="btn btn-ghost btn-icon btn-sm" 
        onClick={() => regen.mutate()} 
        disabled={regen.isPending} 
        title="Regenerar"
      >
        <RefreshCw size={14} style={{ animation: regen.isPending ? 'spin 0.7s linear infinite' : 'none' }} />
      </button>
    </div>
  )
}

function TecnicoModal({ tecnico, onClose }: { tecnico?: Tecnico; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormData>({ 
    nombre: tecnico?.nombre ?? '', 
    correo: tecnico?.correo ?? '', 
    municipio: tecnico?.municipio ?? '' 
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => tecnico ? tecnicosApi.update(tecnico.id, form) : tecnicosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tecnicos'] }); onClose() },
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
              <UserCheck size={20} />
            </div>
            <h3>{tecnico ? 'Editar tecnico' : 'Nuevo tecnico'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={14} style={{ opacity: 0.5 }} />
              Nombre completo
            </label>
            <input 
              className="input" 
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ingresa el nombre completo"
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
              <MapPin size={14} style={{ opacity: 0.5 }} />
              Municipio
            </label>
            <input 
              className="input" 
              value={form.municipio}
              onChange={e => setForm(p => ({ ...p, municipio: e.target.value }))}
              placeholder="Municipio asignado"
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
            disabled={save.isPending || !form.nombre || !form.correo}
          >
            {save.isPending ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Guardando...
              </>
            ) : (
              'Guardar tecnico'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ tecnico, onClose, onConfirm }: { 
  tecnico: Tecnico
  onClose: () => void
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
            <h3>Desactivar tecnico</h3>
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
            Estas a punto de desactivar al tecnico <strong>{tecnico.nombre}</strong>. 
            Esta accion puede revertirse mas adelante.
          </p>
          
          <div style={{
            padding: '14px 16px',
            background: 'var(--gray-50)',
            borderRadius: 10,
            border: '1px solid var(--gray-200)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 4 }}>
              {tecnico.nombre}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {tecnico.correo} • {tecnico.municipio ?? 'Sin municipio'}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Desactivar tecnico
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TecnicosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Tecnico | null>(null)
  const [deleteModal, setDeleteModal] = useState<Tecnico | null>(null)
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosApi.list().then(r => r.data),
    staleTime: 30000,
  })

  const remove = useMutation({
    mutationFn: (id: number) => tecnicosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tecnicos'] })
      setDeleteModal(null)
    },
  })

  const tecnicosData = pickArray<Tecnico>(data, ['tecnicos', 'rows', 'data'])
  const tecnicos: Tecnico[] = tecnicosData
    .filter((t: Tecnico) => !q || t.nombre?.toLowerCase().includes(q.toLowerCase()) || t.correo?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tecnicos</h1>
          <p className="page-subtitle">
            {tecnicos.length} tecnico{tecnicos.length !== 1 ? 's' : ''} registrado{tecnicos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo tecnico
        </button>
      </div>

      <div style={{ 
        marginBottom: 20, 
        padding: '12px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10,
        background: 'white',
        borderRadius: 12,
        border: '1px solid var(--gray-200)',
      }}>
        <Search size={18} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <input 
          className="input" 
          style={{ border: 'none', padding: 0, boxShadow: 'none', background: 'transparent' }}
          placeholder="Buscar tecnico por nombre o correo..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
        {q && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQ('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Tecnico</th>
              <th>Correo</th>
              <th>Municipio</th>
              <th>Codigo de acceso</th>
              <th>Estado</th>
              <th style={{ width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: 20, borderRadius: 6 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : tecnicos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ color: 'var(--gray-400)' }}>
                    <UserCheck size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>{q ? 'No se encontraron resultados' : 'No hay tecnicos registrados'}</p>
                  </div>
                </td>
              </tr>
            ) : tecnicos.map((t, i) => (
              <tr key={t.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 500 }}>{i + 1}</td>
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
                      {t.nombre?.[0]?.toUpperCase() ?? 'T'}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{t.nombre}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--gray-500)' }}>{t.correo}</td>
                <td>{t.municipio ?? <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                <td>
                  {t.codigo_acceso ? (
                    <CodigoAcceso codigo={t.codigo_acceso} id={t.id} />
                  ) : (
                    <span style={{ color: 'var(--gray-300)' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`badge badge-${t.activo !== false ? 'green' : 'gray'}`}>
                    {t.activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm" 
                      onClick={() => setModal(t)}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm" 
                      style={{ color: 'var(--danger)' }}
                      onClick={() => setDeleteModal(t)}
                      title="Desactivar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <TecnicoModal
          tecnico={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
      
      {deleteModal && (
        <DeleteConfirmModal
          tecnico={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => remove.mutate(deleteModal.id)}
        />
      )}
    </div>
  )
}
