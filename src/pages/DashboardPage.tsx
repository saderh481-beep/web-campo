import { useQuery } from '@tanstack/react-query'
import { reportesApi, bitacorasApi, tecnicosApi, beneficiariosApi } from '../lib/api'
import { pickArray, pickNumber } from '../lib/normalize'
import { FileText, Users, UserCheck, TrendingUp, Activity, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  bgColor: string
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

function StatCard({ label, value, icon: Icon, color, bgColor, loading }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: bgColor }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div style={styles.statContent}>
        <div style={styles.statLabel}>{label}</div>
        {loading ? (
          <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 6 }} />
        ) : (
          <div style={styles.statValue}>{value ?? '—'}</div>
        )}
      </div>
      <div style={styles.statArrow}>
        <ArrowUpRight size={16} style={{ opacity: 0.3 }} />
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

  const tecs = pickArray<TecnicoSummary>(tecnicosData, ['tecnicos', 'data', 'rows'])
  const totalBenef = Array.isArray(benefData)
    ? benefData.length
    : pickNumber(benefData, ['total'], pickArray(benefData, ['beneficiarios', 'rows', 'data']).length)
  const bitacorasRows = pickArray<BitacoraSummary>(bitacorasData, ['bitacoras', 'data', 'rows'])
  const totalBit = Array.isArray(bitacorasData) ? bitacorasData.length : pickNumber(bitacorasData, ['total'], bitacorasRows.length)
  const totalTecs = tecs.length
  const reporteRows = pickArray<ReporteRow>(reporteData, ['tecnicos', 'reporte', 'rows', 'data'])

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Resumen operativo — {hoy.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard 
          label="Tecnicos activos" 
          value={totalTecs} 
          icon={UserCheck} 
          color="var(--primary)" 
          bgColor="var(--primary-50)"
          loading={tLoad} 
        />
        <StatCard 
          label="Beneficiarios" 
          value={totalBenef} 
          icon={Users} 
          color="var(--success)" 
          bgColor="var(--success-bg)"
          loading={bLoad} 
        />
        <StatCard 
          label="Bitacoras" 
          value={totalBit} 
          icon={FileText} 
          color="var(--warning)" 
          bgColor="var(--warning-bg)"
          loading={biLoad} 
        />
        <StatCard
          label="Avance mensual"
          value={reporteData?.avance_global != null ? `${reporteData.avance_global}%` : (reporteRows.length > 0 ? 'Ver detalle' : '—')}
          icon={TrendingUp}
          color="var(--info)"
          bgColor="var(--info-bg)"
          loading={rLoad}
        />
      </div>

      {/* Activity Grid */}
      <div style={styles.activityGrid}>
        {/* Tecnicos Activity */}
        <div style={styles.activityCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardHeaderIcon}>
              <Activity size={18} />
            </div>
            <span style={styles.cardTitle}>Actividad por tecnico</span>
          </div>
          
          {rLoad ? (
            <div style={styles.loadingContainer}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
              ))}
            </div>
          ) : reporteRows.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 20px' }}>
              <UserCheck size={32} />
              <p>Sin datos de actividad</p>
            </div>
          ) : (
            <div style={styles.activityList}>
              {reporteRows.slice(0, 6).map((row, i) => {
                const pct = Math.min(100, row.avance ?? row.porcentaje ?? 0)
                return (
                  <div key={i} style={styles.activityItem}>
                    <div style={styles.activityItemHeader}>
                      <div style={styles.activityAvatar}>
                        {(row.nombre ?? row.tecnico)?.[0]?.toUpperCase() ?? 'T'}
                      </div>
                      <div style={styles.activityInfo}>
                        <span style={styles.activityName}>{row.nombre ?? row.tecnico}</span>
                        <span style={styles.activityMeta}>{row.total_visitas ?? row.visitas ?? 0} visitas</span>
                      </div>
                      <span style={styles.activityPct}>{pct}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div 
                        style={{ 
                          ...styles.progressFill, 
                          width: `${pct}%`,
                        }} 
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Bitacoras */}
        <div style={styles.activityCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardHeaderIcon}>
              <FileText size={18} />
            </div>
            <span style={styles.cardTitle}>Bitacoras recientes</span>
          </div>
          
          {biLoad ? (
            <div style={styles.loadingContainer}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
              ))}
            </div>
          ) : bitacorasRows.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 20px' }}>
              <FileText size={32} />
              <p>Sin bitacoras aun</p>
            </div>
          ) : (
            <div style={styles.activityList}>
              {bitacorasRows.slice(0, 6).map((b) => (
                <div key={b.id} style={styles.bitacoraItem}>
                  <div style={styles.bitacoraContent}>
                    <div style={styles.bitacoraTitle}>
                      {b.beneficiario_nombre ?? b.beneficiario ?? `Bitacora #${b.id}`}
                    </div>
                    <div style={styles.bitacoraMeta}>
                      {b.tecnico_nombre ?? b.tecnico} • {b.fecha ? new Date(b.fecha).toLocaleDateString('es-MX') : ''}
                    </div>
                  </div>
                  <span 
                    className={`badge badge-${b.estado === 'firmada' ? 'green' : b.estado === 'borrador' ? 'amber' : 'gray'}`}
                  >
                    {b.estado ?? 'borrador'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 20,
    marginBottom: 28,
  },
  
  statCard: {
    background: 'white',
    borderRadius: 14,
    padding: '22px 24px',
    border: '1px solid var(--gray-200)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--gray-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--gray-900)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  statArrow: {
    alignSelf: 'flex-start',
  },
  
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 20,
  },
  
  activityCard: {
    background: 'white',
    borderRadius: 14,
    border: '1px solid var(--gray-200)',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 24px',
    borderBottom: '1px solid var(--gray-100)',
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--primary-50)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 15,
    color: 'var(--gray-900)',
  },
  
  loadingContainer: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  
  activityList: {
    padding: '12px 16px',
  },
  
  activityItem: {
    padding: '14px 8px',
    borderBottom: '1px solid var(--gray-100)',
  },
  activityItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--gray-100)',
    color: 'var(--gray-600)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  activityInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  activityName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--gray-900)',
  },
  activityMeta: {
    fontSize: 12,
    color: 'var(--gray-400)',
  },
  activityPct: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--primary)',
  },
  progressBar: {
    height: 6,
    background: 'var(--gray-100)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  
  bitacoraItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 8px',
    borderBottom: '1px solid var(--gray-100)',
  },
  bitacoraContent: {
    flex: 1,
    minWidth: 0,
  },
  bitacoraTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--gray-900)',
    marginBottom: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bitacoraMeta: {
    fontSize: 12,
    color: 'var(--gray-400)',
  },
}
