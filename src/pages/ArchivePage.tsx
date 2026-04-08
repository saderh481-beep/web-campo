import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { archiveService } from '../lib/servicios/extra'
import { getApiErrorMessage } from '../lib/axios'
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react'
import { pickArray } from '../lib/normalize'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface ArchiveRow {
  id?: number | string
  periodo: string
  estado?: string
  r2_key_staging?: string
  created_at?: string
}

function toErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback)
}


export default function ArchivePage() {
  const qc = useQueryClient()
  const [periodo, setPeriodo] = useState('')
  const [filtro, setFiltro] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['archive'],
    queryFn: () => archiveService.list().then((r) => r.data),
    staleTime: 30000,
  })

  const forzar = useMutation({
    mutationFn: (value: string) => archiveService.forzar(value),
    onSuccess: () => {
      setFeedback({ kind: 'success', message: 'Archivado forzado enviado correctamente.' })
      qc.invalidateQueries({ queryKey: ['archive'] })
    },
    onError: (e: unknown) => {
      setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo forzar el archivado.') })
    },
  })

  const confirmar = useMutation({
    mutationFn: (value: string) => archiveService.confirmar(value),
    onSuccess: () => {
      setFeedback({ kind: 'success', message: 'Archivado confirmado correctamente.' })
      qc.invalidateQueries({ queryKey: ['archive'] })
    },
    onError: (e: unknown) => {
      setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo confirmar el archivado.') })
    },
  })

  const descargar = useMutation({
    mutationFn: async (value: string) => {
      const response = await archiveService.descargar(value)
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `archive-${value}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    },
    onError: (e: unknown) => {
      setFeedback({ kind: 'error', message: toErrorMessage(e, 'No se pudo descargar el archive.') })
    },
  })

  const rows = pickArray<ArchiveRow>(data, ['archive', 'archive_logs', 'rows', 'data'])
  const rowsFiltradas = rows.filter((row) => {
    if (!filtro.trim()) return true
    const q = filtro.toLowerCase()
    return row.periodo.toLowerCase().includes(q) || (row.estado ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Archive</h1>
          <p className="page-subtitle">Control de archivado por periodo</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ minWidth: 240 }}>
          <label className="form-label">Periodo (ej: 2026-03)</label>
          <input className="input" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Periodo" />
        </div>
        <button className="btn btn-secondary" disabled={!periodo.trim() || forzar.isPending} onClick={() => forzar.mutate(periodo.trim())}>
          {forzar.isPending ? <><span className="spinner" />Forzando...</> : <><RefreshCw size={14} /> Forzar archivado</>}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input className="input" style={{ border: 'none', padding: 0, boxShadow: 'none' }} value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por periodo o estado" />
        {filtro && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setFiltro('')}>×</button>}
      </div>

      {feedback && (
        <div style={{ marginBottom: 16 }}>
          <FeedbackBanner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Periodo</th><th>Estado</th><th>Creado</th><th>Descarga</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {isLoading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}>{Array(5).fill(0).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
            )) : rowsFiltradas.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><p>Sin registros de archive</p></div></td></tr>
            ) : rowsFiltradas.map((row) => {              const periodoRow = row.periodo
              return (
                <tr key={String(row.id ?? `${periodoRow}-${row.created_at ?? ''}`)}>
                  <td style={{ fontWeight: 600 }}>{periodoRow}</td>
                  <td><span className="badge badge-guinda">{row.estado ?? 'sin estado'}</span></td>
                  <td style={{ color: 'var(--gray-500)' }}>{row.created_at ? new Date(row.created_at).toLocaleString('es-MX') : '—'}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={descargar.isPending}
                      onClick={() => descargar.mutate(periodoRow)}
                    >
                      <Download size={13} /> Descargar
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" disabled={confirmar.isPending} onClick={() => confirm(`¿Confirmar archivado para ${periodoRow}?`) && confirmar.mutate(periodoRow)}>
                      <CheckCircle2 size={13} /> Confirmar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
