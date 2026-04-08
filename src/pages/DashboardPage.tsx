import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../lib/servicios/extra'
import { bitacorasService } from '../lib/servicios/bitacoras'
import { tecnicosService } from '../lib/servicios/tecnicos'
import { beneficiariosService } from '../lib/servicios/beneficiarios'
import { dashboardService } from '../lib/servicios/extra'
import { pickArray, pickNumber } from '../lib/normalize'
import { FileText, Users, UserCheck, TrendingUp, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { normalizeRole } from '../lib/authz'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  loading: boolean
}

interface TecnicoSummary {
  id: number | string
}

interface TecnicosResponse {
  tecnicos?: TecnicoSummary[]
}

interface BeneficiariosResponse {
  total?: number
  beneficiarios?: unknown[]
}

interface BitacoraSummary {
  id: number | string
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
  cerradas?: number
  borradores?: number
  total?: number
  total_visitas?: number
  visitas?: number
}

interface ReporteResponse {
  tecnicos?: ReporteRow[]
  reporte?: ReporteRow[]
}

function getNombre(row: ReporteRow): string {
  return row.nombre ?? row.tecnico ?? 'Sin nombre'
}

function getTotal(row: ReporteRow): number {
  return row.total ?? row.total_visitas ?? row.visitas ?? 0
}

function getCerradas(row: ReporteRow): number {
  return row.cerradas ?? 0
}

function getPorcentaje(row: ReporteRow): number {
  const total = getTotal(row)
  if (total <= 0) return 0
  return Math.round((getCerradas(row) / total) * 100)
}

function getDashboardResumenValue(source: unknown, key: 'tecnicos' | 'beneficiarios' | 'bitacoras'): number {
  if (!source || typeof source !== 'object') return 0
  const resumen = (source as Record<string, unknown>).resumen
  if (!resumen || typeof resumen !== 'object') return 0
  const value = (resumen as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
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
  const { user } = useAuth()
  const role = normalizeRole(user?.rol)
  const hoy = new Date()
  const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  const { data: coordinadorDashboard, isLoading: cLoad } = useQuery({
    queryKey: ['dashboard', 'coordinador'],
    queryFn: () => dashboardService.coordinador().then(r => r.data),
    staleTime: 60000,
    enabled: role === 'coordinador',
  })

  const { data: reporte, isLoading: rLoad } = useQuery({
    queryKey: ['reporte', mes],
    queryFn: () => {
      const [anio, mesNum] = mes.split('-').map(Number)
      return reportesService.mensual({ mes: mesNum, anio }).then(r => r.data)
    },
    staleTime: 60000,
  })

  const { data: tecnicos, isLoading: tLoad } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosService.list().then(r => r.data),
    staleTime: 60000,
  })

  const { data: benef, isLoading: bLoad } = useQuery({
    queryKey: ['beneficiarios', { page: 1 }],
    queryFn: () => beneficiariosService.list({ page: 1 }).then(r => r.data),
    staleTime: 60000,
  })

  const { data: bitacoras, isLoading: biLoad } = useQuery({
    queryKey: ['bitacoras', {}],
    queryFn: () => bitacorasService.list().then(r => r.data),
    staleTime: 60000,
  })

  const tecnicosData = tecnicos as TecnicosResponse | TecnicoSummary[] | undefined
  const benefData = benef as BeneficiariosResponse | unknown[] | undefined
  const bitacorasData = bitacoras as BitacorasResponse | BitacoraSummary[] | undefined
  const reporteData = reporte as ReporteResponse | undefined

  const tecs = pickArray<TecnicoSummary>(tecnicosData, ['tecnicos', 'data', 'rows'])
  const totalBenef = role === 'coordinador'
    ? getDashboardResumenValue(coordinadorDashboard, 'beneficiarios')
    : Array.isArray(benefData)
    ? benefData.length
    : pickNumber(benefData, ['total'], pickArray(benefData, ['beneficiarios', 'rows', 'data']).length)
  const bitacorasRows = pickArray<BitacoraSummary>(bitacorasData, ['bitacoras', 'data', 'rows'])
  const totalBit = role === 'coordinador'
    ? getDashboardResumenValue(coordinadorDashboard, 'bitacoras')
    : (Array.isArray(bitacorasData) ? bitacorasData.length : pickNumber(bitacorasData, ['total'], bitacorasRows.length))
  const totalTecs = role === 'coordinador' ? getDashboardResumenValue(coordinadorDashboard, 'tecnicos') : tecs.length
  const reporteRows = pickArray<ReporteRow>(reporteData, ['tecnicos', 'reporte', 'rows', 'data'])
  const cierrePromedio = reporteRows.length > 0 ? Math.round(reporteRows.reduce((sum, row) => sum + getPorcentaje(row), 0) / reporteRows.length) : 0

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen operativo — {hoy.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Técnicos activos" value={totalTecs} icon={UserCheck} color="var(--guinda)" loading={role === 'coordinador' ? cLoad : tLoad} />
        <StatCard label="Beneficiarios" value={totalBenef} icon={Users} color="var(--success)" loading={role === 'coordinador' ? cLoad : bLoad} />
        <StatCard label="Bitácoras" value={totalBit} icon={FileText} color="var(--warning)" loading={role === 'coordinador' ? cLoad : biLoad} />
        <StatCard
          label="Cierre mensual"
          value={reporteRows.length > 0 ? `${cierrePromedio}%` : '—'}
          icon={TrendingUp}
          color="var(--info)"
          loading={rLoad}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--guinda)' }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Resumen por técnico</span>
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
                const pct = Math.min(100, getPorcentaje(row))
                return (
                  <div key={i} style={{ padding: '10px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{getNombre(row)}</span>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{getTotal(row)} bitácoras</span>
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
