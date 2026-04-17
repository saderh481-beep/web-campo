import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../lib/servicios/extra'
import { pickArray } from '../lib/normalize'
import { Table } from '../components/ui/Table'
import { Download } from 'lucide-react'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface ReporteRow {
  nombre?: string
  tecnico?: string
  cerradas?: number
  borradores?: number
  total?: number
  total_visitas?: number
  visitas?: number
}

interface ReportesResponse {
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

function getBorradores(row: ReporteRow): number {
  return row.borradores ?? 0
}

function getPorcentaje(row: ReporteRow): number {
  const total = getTotal(row)
  if (total <= 0) return 0
  return Math.round((getCerradas(row) / total) * 100)
}

export default function ReportesPage() {
  const hoy = new Date()
  const [mes, setMes] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'warning' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reporte', mes],
    queryFn: () => {
      const [anio, mesNum] = mes.split('-').map(Number)
      return reportesService.mensual({ mes: mesNum, anio }).then(r => r.data)
    },
    staleTime: 60000,
  })

  const reporteData = data as ReportesResponse | undefined
  const rows = pickArray<ReporteRow>(reporteData, ['tecnicos', 'reporte', 'rows', 'data'])
  const maxTotal = Math.max(...rows.map(getTotal), 1)

  const exportCSV = () => {
    if (rows.length === 0) {
      setFeedback({ kind: 'warning', message: 'No hay datos para exportar en el periodo seleccionado.' })
      return
    }

    const header = 'Técnico,Total,Cerradas,Borradores,Cierre %\n'
    const csv = rows.map(r =>
      `"${getNombre(r)}",${getTotal(r)},${getCerradas(r)},${getBorradores(r)},${getPorcentaje(r)}`
    ).join('\n')
    try {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([header + csv], { type: 'text/csv;charset=utf-8;' }))
      a.download = `reporte-campo-${mes}.csv`
      a.click()
      setFeedback({ kind: 'success', message: 'Reporte CSV generado correctamente.' })
    } catch {
      setFeedback({ kind: 'error', message: 'No se pudo generar el archivo CSV.' })
    }
  }

  const totalBitacoras = rows.reduce((sum, row) => sum + getTotal(row), 0)
  const totalCerradas = rows.reduce((sum, row) => sum + getCerradas(row), 0)
  const totalBorradores = rows.reduce((sum, row) => sum + getBorradores(row), 0)
  const cierrePromedio = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + getPorcentaje(row), 0) / rows.length) : 0

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes mensuales</h1>
          <p className="page-subtitle">Resumen por técnico</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="input" type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-secondary" onClick={exportCSV} disabled={rows.length === 0}>
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {feedback && <div style={{ marginBottom: 14 }}><FeedbackBanner kind={feedback.kind} message={feedback.message} /></div>}

      {!isLoading && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total bitácoras', value: totalBitacoras },
            { label: 'Técnicos activos', value: rows.length },
            { label: 'Cerradas', value: totalCerradas },
            { label: 'Borradores', value: totalBorradores },
            { label: 'Cierre promedio', value: `${cierrePromedio}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--guinda)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--gray-700)' }}>Bitácoras por técnico</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...rows].sort((a, b) => getTotal(b) - getTotal(a)).map((r, i) => {
              const total = getTotal(r)
              const pct = (total / maxTotal) * 100
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 1.2fr) minmax(110px, 2fr) 52px', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getNombre(r)}</span>
                  <div style={{ height: 24, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--guinda), var(--guinda-light))`, borderRadius: 4, transition: 'width 0.6s ease', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                      {pct > 20 && <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{total}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{total}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Table
        columns={[
          { key: 'nombre', header: 'Técnico', render: (r: ReporteRow) => <span style={{ fontWeight: 600 }}>{getNombre(r)}</span> },
          { key: 'total', header: 'Total', render: (r: ReporteRow) => getTotal(r) },
          { key: 'cerradas', header: 'Cerradas', render: (r: ReporteRow) => getCerradas(r) },
          { key: 'borradores', header: 'Borradores', render: (r: ReporteRow) => getBorradores(r) },
          { key: 'cierre', header: 'Cierre', render: (r: ReporteRow) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--gray-100)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${Math.min(100, getPorcentaje(r))}%`, background: 'var(--guinda)', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{getPorcentaje(r)}%</span>
            </div>
          )},
        ]}
        data={rows}
        keyField="tecnico"
        loading={isLoading}
        emptyMessage="Sin datos para el mes seleccionado"
        pageSize={5}
      />
    </div>
  )
}
