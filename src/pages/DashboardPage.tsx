import { useQuery } from '@tanstack/react-query'
import { reportesApi, bitacorasApi, tecnicosApi, beneficiariosApi } from '../lib/api'
import { FileText, Users, UserCheck, TrendingUp, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  loading: boolean
}

interface TecnicoSummary {
  id: number
}

interface TecnicosResponse {
  tecnicos?: TecnicoSummary[]
}

interface BeneficiariosResponse {
  total?: number
  beneficiarios?: unknown[]
}

interface BitacoraSummary {
  id: number
  beneficiario_nombre?: string
  beneficiario?: string
  tecnico_nombre?: string
  tecnico?: string
  fecha?: string
  estado?: string
}

interface BitacorasResponse {
  total?: number
  bitacoras?: BitacoraSummary[]
}

interface ReporteRow {
  nombre?: string
  tecnico?: string
  avance?: number
  porcentaje?: number
  total_visitas?: number
  visitas?: number
}

interface ReporteResponse {
  tecnicos?: ReporteRow[]
  reporte?: ReporteRow[]
  avance_global?: number
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
        {loading
          ? <div className="skeleton" style={{ width: 60, height: 28 }} />
          : <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1 }}>{value ?? '—'}</div>
        }
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const hoy = new Date()
  const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  const { data: reporte, isLoading: rLoad } = useQuery({
    queryKey: ['reporte', mes],
    queryFn: () => reportesApi.mensual({ mes }).then(r => r.data),
    staleTime: 60000,
  })

  const { data: tecnicos, isLoading: tLoad } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosApi.list().then(r => r.data),
    staleTime: 60000,
  })

  const { data: benef, isLoading: bLoad } = useQuery({
    queryKey: ['beneficiarios', { page: 1 }],
    queryFn: () => beneficiariosApi.list({ page: 1 }).then(r => r.data),
    staleTime: 60000,
  })

  const { data: bitacoras, isLoading: biLoad } = useQuery({
    queryKey: ['bitacoras', {}],
    queryFn: () => bitacorasApi.list().then(r => r.data),
    staleTime: 60000,
  })

  const tecnicosData = tecnicos as TecnicosResponse | TecnicoSummary[] | undefined
  const benefData = benef as BeneficiariosResponse | unknown[] | undefined
  const bitacorasData = bitacoras as BitacorasResponse | BitacoraSummary[] | undefined
  const reporteData = reporte as ReporteResponse | undefined

  const tecs = Array.isArray(tecnicosData) ? tecnicosData : (tecnicosData?.tecnicos ?? [])
  const totalBenef = Array.isArray(benefData) ? benefData.length : (benefData?.total ?? benefData?.beneficiarios?.length ?? 0)
  const bitacorasRows: BitacoraSummary[] = Array.isArray(bitacorasData)
    ? bitacorasData
    : (bitacorasData?.bitacoras ?? [])
  const totalBit = Array.isArray(bitacorasData) ? bitacorasData.length : (bitacorasData?.total ?? bitacorasRows.length)
  const totalTecs = tecs.length
  const reporteRows: ReporteRow[] = reporteData?.tecnicos ?? reporteData?.reporte ?? []

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen operativo — {hoy.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Técnicos activos" value={totalTecs} icon={UserCheck} color="var(--guinda)" loading={tLoad} />
        <StatCard label="Beneficiarios" value={totalBenef} icon={Users} color="var(--success)" loading={bLoad} />
        <StatCard label="Bitácoras" value={totalBit} icon={FileText} color="var(--warning)" loading={biLoad} />
        <StatCard
          label="Avance mensual"
          value={reporteData?.avance_global != null ? `${reporteData.avance_global}%` : (reporteRows.length > 0 ? 'Ver detalle' : '—')}
          icon={TrendingUp}
          color="var(--info)"
          loading={rLoad}
        />
      </div>

      {/* Recent bitácoras + técnicos table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Técnicos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--guinda)' }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Actividad por técnico</span>
          </div>
          {rLoad ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 6 }} />)}
            </div>
          ) : reporteRows.length === 0 ? (
            <div className="empty-state"><UserCheck size={32} /><p>Sin datos de actividad</p></div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {reporteRows.slice(0, 8).map((row, i) => {
                const pct = Math.min(100, row.avance ?? row.porcentaje ?? 0)
                return (
                  <div key={i} style={{ padding: '10px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{row.nombre ?? row.tecnico}</span>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.total_visitas ?? row.visitas ?? 0} visitas</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--guinda-light), var(--guinda))', borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bitácoras recientes */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} style={{ color: 'var(--guinda)' }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Bitácoras recientes</span>
          </div>
          {biLoad ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 6 }} />)}
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {bitacorasRows.slice(0, 8).map((b) => (
                <div key={b.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{b.beneficiario_nombre ?? b.beneficiario ?? `Bitácora #${b.id}`}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{b.tecnico_nombre ?? b.tecnico} · {b.fecha ? new Date(b.fecha).toLocaleDateString('es-MX') : ''}</div>
                  </div>
                  <span className={`badge badge-${b.estado === 'firmada' ? 'green' : b.estado === 'borrador' ? 'amber' : 'gray'}`}>
                    {b.estado ?? 'borrador'}
                  </span>
                </div>
              ))}
              {bitacorasRows.length === 0 && (
                <div className="empty-state"><FileText size={28} /><p>Sin bitácoras aún</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
