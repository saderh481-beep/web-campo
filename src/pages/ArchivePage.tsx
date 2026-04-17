import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { archiveService } from '../lib/servicios/extra'
import { getApiErrorMessage } from '../lib/axios'
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react'
import { pickArray } from '../lib/normalize'
import { Table } from '../components/ui/Table'
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

      <Table
        columns={[
          { key: 'periodo', header: 'Periodo', render: (row: ArchiveRow) => <span style={{ fontWeight: 600 }}>{row.periodo}</span> },
          { key: 'estado', header: 'Estado', render: (row: ArchiveRow) => <span className="badge badge-info">{row.estado ?? 'sin estado'}</span> },
          { key: 'created_at', header: 'Creado', render: (row: ArchiveRow) => row.created_at ? new Date(row.created_at).toLocaleString('es-MX') : '—' },
          { key: 'descarga', header: 'Descarga', render: (row: ArchiveRow) => (
            <button className="btn btn-ghost btn-sm" disabled={descargar.isPending} onClick={() => descargar.mutate(row.periodo)}>
              <Download size={13} /> Descargar
            </button>
          )},
          { key: 'acciones', header: 'Acciones', render: (row: ArchiveRow) => (
            <button className="btn btn-ghost btn-sm" disabled={confirmar.isPending} onClick={() => confirm(`¿Confirmar archivado para ${row.periodo}?`) && confirmar.mutate(row.periodo)}>
              <CheckCircle2 size={13} /> Confirmar
            </button>
          )},
        ]}
        data={rowsFiltradas}
        keyField="periodo"
        loading={isLoading}
        emptyMessage="Sin registros de archive"
        pageSize={5}
        searchable
        searchPlaceholder="Filtrar por periodo o estado..."
      />
    </div>
  )
}
