import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { beneficiariosApi, cadenasApi } from '../lib/api'
import { pickArray, pickNumber } from '../lib/normalize'
import { Plus, Search, X, ChevronLeft, ChevronRight, Pencil, Users, User, CreditCard, MapPin, Home, AlertCircle } from 'lucide-react'

interface Cadena {
  id: number
  nombre: string
}

type CadenaRef = Cadena | number

interface Beneficiario {
  id: number
  nombre: string
  curp?: string
  municipio?: string
  localidad?: string
  cadenas?: CadenaRef[]
}

interface BeneficiariosResponse {
  beneficiarios?: Beneficiario[]
  total?: number
  per_page?: number
}

interface CadenasResponse {
  cadenas?: Cadena[]
}

interface BeneficiarioForm {
  nombre: string
  curp: string
  municipio: string
  localidad: string
  cadenas_ids: number[]
}

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

function BeneficiarioModal({ b, cadenas, onClose }: { b?: Beneficiario; cadenas: Cadena[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<BeneficiarioForm>({
    nombre: b?.nombre ?? '', 
    curp: b?.curp ?? '',
    municipio: b?.municipio ?? '', 
    localidad: b?.localidad ?? '',
    cadenas_ids: (b?.cadenas ?? []).map((c) => typeof c === 'number' ? c : c.id),
  })
  const [err, setErr] = useState('')

  const save = useMutation({
    mutationFn: () => b ? beneficiariosApi.update(b.id, form) : beneficiariosApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiarios'] }); onClose() },
    onError: (e: unknown) => setErr(toErrorMessage(e, 'Error al guardar')),
  })

  const toggleCadena = (id: number) => setForm(p => ({
    ...p, 
    cadenas_ids: p.cadenas_ids.includes(id) 
      ? p.cadenas_ids.filter(c => c !== id) 
      : [...p.cadenas_ids, id]
  }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
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
              <Users size={20} />
            </div>
            <h3>{b ? 'Editar beneficiario' : 'Nuevo beneficiario'}</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} style={{ opacity: 0.5 }} />
                Nombre completo
              </label>
              <input 
                className="input" 
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del beneficiario"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={14} style={{ opacity: 0.5 }} />
                CURP
              </label>
              <input 
                className="input" 
                value={form.curp}
                onChange={e => setForm(p => ({ ...p, curp: e.target.value.toUpperCase() }))}
                placeholder="18 caracteres"
                maxLength={18}
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
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
                placeholder="Municipio"
              />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Home size={14} style={{ opacity: 0.5 }} />
                Localidad
              </label>
              <input 
                className="input" 
                value={form.localidad}
                onChange={e => setForm(p => ({ ...p, localidad: e.target.value }))}
                placeholder="Localidad"
              />
            </div>
          </div>
          
          {cadenas.length > 0 && (
            <div className="form-group">
              <label className="form-label">Cadenas productivas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cadenas.map((c) => (
                  <button 
                    key={c.id} 
                    type="button"
                    style={{
                      padding: '6px 14px', 
                      borderRadius: 8, 
                      fontSize: 12, 
                      fontWeight: 600,
                      border: `1.5px solid ${form.cadenas_ids.includes(c.id) ? 'var(--primary)' : 'var(--gray-200)'}`,
                      background: form.cadenas_ids.includes(c.id) ? 'var(--primary-50)' : 'white',
                      color: form.cadenas_ids.includes(c.id) ? 'var(--primary)' : 'var(--gray-500)',
                      cursor: 'pointer', 
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => toggleCadena(c.id)}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
          
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
              'Guardar beneficiario'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BeneficiariosPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'new' | Beneficiario | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiarios', { page, q }],
    queryFn: () => beneficiariosApi.list({ page, q: q || undefined }).then(r => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  })

  const { data: cadenasData } = useQuery({
    queryKey: ['cadenas'],
    queryFn: () => cadenasApi.list().then(r => r.data),
    staleTime: 300000,
  })

  const benefData = data as BeneficiariosResponse | Beneficiario[] | undefined
  const benefs = pickArray<Beneficiario>(benefData, ['beneficiarios', 'rows', 'data'])
  const total = Array.isArray(benefData) ? benefData.length : pickNumber(benefData, ['total'], benefs.length)
  const perPage = Array.isArray(benefData) ? 20 : pickNumber(benefData, ['per_page'], 20)
  const pages = Math.ceil(total / perPage) || 1

  const rawCadenas = cadenasData as CadenasResponse | Cadena[] | undefined
  const cadenas = pickArray<Cadena>(rawCadenas, ['cadenas', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficiarios</h1>
          <p className="page-subtitle">
            {total} beneficiario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo beneficiario
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
          placeholder="Buscar por nombre, CURP o municipio..." 
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }} 
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
              <th>Beneficiario</th>
              <th>CURP</th>
              <th>Municipio</th>
              <th>Localidad</th>
              <th>Cadenas</th>
              <th style={{ width: 80 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: 20, borderRadius: 6 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : benefs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ color: 'var(--gray-400)' }}>
                    <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>{q ? 'No se encontraron resultados' : 'No hay beneficiarios registrados'}</p>
                  </div>
                </td>
              </tr>
            ) : benefs.map((b, i) => (
              <tr key={b.id}>
                <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 500 }}>
                  {(page - 1) * perPage + i + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--success-bg)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      border: '1px solid var(--success-border)',
                    }}>
                      {b.nombre?.[0]?.toUpperCase() ?? 'B'}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{b.nombre}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-500)' }}>
                  {b.curp ?? <span style={{ color: 'var(--gray-300)' }}>—</span>}
                </td>
                <td>{b.municipio ?? <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                <td>{b.localidad ?? <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(b.cadenas ?? []).map((c) => (
                      <span key={typeof c === 'number' ? c : c.id} className="badge badge-dorado">
                        {typeof c === 'number' ? c : c.nombre}
                      </span>
                    ))}
                    {(!b.cadenas || b.cadenas.length === 0) && (
                      <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>—</span>
                    )}
                  </div>
                </td>
                <td>
                  <button 
                    className="btn btn-ghost btn-icon btn-sm" 
                    onClick={() => setModal(b)}
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 12, 
          marginTop: 24,
          padding: '16px 0',
        }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span style={{ 
            fontSize: 13, 
            color: 'var(--gray-500)',
            padding: '8px 16px',
            background: 'var(--gray-100)',
            borderRadius: 8,
          }}>
            Pagina {page} de {pages}
          </span>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setPage(p => Math.min(pages, p + 1))} 
            disabled={page === pages}
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      )}

      {modal && (
        <BeneficiarioModal
          b={modal === 'new' ? undefined : modal}
          cadenas={cadenas}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
