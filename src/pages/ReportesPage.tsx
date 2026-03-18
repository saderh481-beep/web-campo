import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportesApi } from '../lib/api'
import { Download } from 'lucide-react'

export default function ReportesPage() {
  const hoy = new Date()
  const [mes, setMes] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`)

  const { data, isLoading } = useQuery({
    queryKey: ['reporte', mes],
    queryFn: () => reportesApi.mensual({ mes }).then(r => r.data),
    staleTime: 60000,
  })

  const rows: any[] = data?.tecnicos ?? data?.reporte ?? []
  const maxVisitas = Math.max(...rows.map(r => r.total_visitas ?? r.visitas ?? 0), 1)

  const exportCSV = () => {
    const header = 'Técnico,Visitas,Beneficiarios,Avance %\n'
    const csv = rows.map(r =>
      `"${r.nombre ?? r.tecnico}",${r.total_visitas ?? r.visitas ?? 0},${r.beneficiarios ?? 0},${r.avance ?? r.porcentaje ?? 0}`
    ).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([header + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `reporte-campo-${mes}.csv`
    a.click()
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes mensuales</h1>
          <p className="page-subtitle">Actividad por técnico</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="input" type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-secondary" onClick={exportCSV} disabled={rows.length === 0}>
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!isLoading && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total visitas', value: rows.reduce((s, r) => s + (r.total_visitas ?? r.visitas ?? 0), 0) },
            { label: 'Técnicos activos', value: rows.length },
            { label: 'Beneficiarios atendidos', value: rows.reduce((s, r) => s + (r.beneficiarios ?? 0), 0) },
            { label: 'Avance promedio', value: `${Math.round(rows.reduce((s, r) => s + (r.avance ?? r.porcentaje ?? 0), 0) / rows.length)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--guinda)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      {!isLoading && rows.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--gray-700)' }}>Visitas por técnico</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.sort((a, b) => (b.total_visitas ?? 0) - (a.total_visitas ?? 0)).map((r, i) => {
              const v = r.total_visitas ?? r.visitas ?? 0
              const pct = (v / maxVisitas) * 100
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 50px', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre ?? r.tecnico}</span>
                  <div style={{ height: 24, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--guinda), var(--guinda-light))`, borderRadius: 4, transition: 'width 0.6s ease', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                      {pct > 20 && <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{v}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{v}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Técnico</th><th>Visitas</th><th>Beneficiarios</th><th>Avance</th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}>{Array(4).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : rows.length === 0 ? (
              <tr><td colSpan={4}><div className="empty-state"><p>Sin datos para el mes seleccionado</p></div></td></tr>
            ) : rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.nombre ?? r.tecnico}</td>
                <td>{r.total_visitas ?? r.visitas ?? 0}</td>
                <td>{r.beneficiarios ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--gray-100)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, r.avance ?? r.porcentaje ?? 0)}%`, background: 'var(--guinda)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{r.avance ?? r.porcentaje ?? 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
