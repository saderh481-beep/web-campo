import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { actividadesApi, asignacionesApi, beneficiariosApi, tecnicosApi } from '../lib/api'
import { canManageAsignaciones } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'
import { pickArray } from '../lib/normalize'
import { ClipboardList, Link2 } from 'lucide-react'

interface Tecnico {
  id: number | string
  nombre: string
}

interface Beneficiario {
  id: number | string
  nombre: string
}

interface Actividad {
  id: number | string
  nombre: string
}

function toErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return axiosErr.response?.data?.message ?? fallback
}

export default function AsignacionesPage() {
  const { user } = useAuth()
  const canManage = canManageAsignaciones(user?.rol)
  const [tecnicoBeneficiarioId, setTecnicoBeneficiarioId] = useState('')
  const [beneficiarioId, setBeneficiarioId] = useState('')
  const [tecnicoActividadId, setTecnicoActividadId] = useState('')
  const [actividadId, setActividadId] = useState('')
  const [beneficiarioMsg, setBeneficiarioMsg] = useState('')
  const [actividadMsg, setActividadMsg] = useState('')

  const { data: tecnicosData, isLoading: loadingTecnicos } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => tecnicosApi.list().then((r) => r.data),
    staleTime: 120000,
  })

  const { data: beneficiariosData, isLoading: loadingBeneficiarios } = useQuery({
    queryKey: ['beneficiarios', { page: 1 }],
    queryFn: () => beneficiariosApi.list({ page: 1 }).then((r) => r.data),
    staleTime: 120000,
  })

  const { data: actividadesData, isLoading: loadingActividades } = useQuery({
    queryKey: ['actividades'],
    queryFn: () => actividadesApi.list().then((r) => r.data),
    staleTime: 120000,
  })

  const asignarBeneficiario = useMutation({
    mutationFn: () => asignacionesApi.asignarBeneficiario({ tecnico_id: tecnicoBeneficiarioId, beneficiario_id: beneficiarioId }),
    onSuccess: () => {
      setBeneficiarioMsg('Beneficiario asignado correctamente.')
      setBeneficiarioId('')
    },
    onError: (e: unknown) => setBeneficiarioMsg(toErrorMessage(e, 'No se pudo asignar el beneficiario.')),
  })

  const asignarActividad = useMutation({
    mutationFn: () => asignacionesApi.asignarActividad({ tecnico_id: tecnicoActividadId, actividad_id: actividadId }),
    onSuccess: () => {
      setActividadMsg('Actividad asignada correctamente.')
      setActividadId('')
    },
    onError: (e: unknown) => setActividadMsg(toErrorMessage(e, 'No se pudo asignar la actividad.')),
  })

  const tecnicos = pickArray<Tecnico>(tecnicosData as unknown, ['tecnicos', 'rows', 'data'])
  const beneficiarios = pickArray<Beneficiario>(beneficiariosData as unknown, ['beneficiarios', 'rows', 'data'])
  const actividades = pickArray<Actividad>(actividadesData as unknown, ['actividades', 'rows', 'data'])

  const loading = loadingTecnicos || loadingBeneficiarios || loadingActividades

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asignaciones</h1>
          <p className="page-subtitle">Asigna beneficiarios y actividades a los técnicos visibles para tu rol.</p>
        </div>
      </div>

      {!canManage && (
        <div className="card"><p>No tienes permisos para crear asignaciones.</p></div>
      )}

      {canManage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Link2 size={16} style={{ color: 'var(--guinda)' }} />
              <h3 style={{ margin: 0 }}>Asignar beneficiario</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Técnico</label>
              <select className="input" value={tecnicoBeneficiarioId} onChange={(e) => setTecnicoBeneficiarioId(e.target.value)}>
                <option value="">Selecciona técnico</option>
                {tecnicos.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Beneficiario</label>
              <select className="input" value={beneficiarioId} onChange={(e) => setBeneficiarioId(e.target.value)}>
                <option value="">Selecciona beneficiario</option>
                {beneficiarios.map((b) => <option key={b.id} value={String(b.id)}>{b.nombre}</option>)}
              </select>
            </div>
            {beneficiarioMsg && <p className={beneficiarioMsg.includes('correctamente') ? '' : 'form-error'}>{beneficiarioMsg}</p>}
            <button className="btn btn-primary" disabled={loading || asignarBeneficiario.isPending || !tecnicoBeneficiarioId || !beneficiarioId} onClick={() => asignarBeneficiario.mutate()}>
              {asignarBeneficiario.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar beneficiario'}
            </button>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ClipboardList size={16} style={{ color: 'var(--guinda)' }} />
              <h3 style={{ margin: 0 }}>Asignar actividad</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Técnico</label>
              <select className="input" value={tecnicoActividadId} onChange={(e) => setTecnicoActividadId(e.target.value)}>
                <option value="">Selecciona técnico</option>
                {tecnicos.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Actividad</label>
              <select className="input" value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
                <option value="">Selecciona actividad</option>
                {actividades.map((a) => <option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
              </select>
            </div>
            {actividadMsg && <p className={actividadMsg.includes('correctamente') ? '' : 'form-error'}>{actividadMsg}</p>}
            <button className="btn btn-primary" disabled={loading || asignarActividad.isPending || !tecnicoActividadId || !actividadId} onClick={() => asignarActividad.mutate()}>
              {asignarActividad.isPending ? <><span className="spinner" />Asignando...</> : 'Asignar actividad'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>
          Nota: la API documentada no expone un GET de asignaciones ni el id de asignación para borrado desde esta pantalla. Por eso aquí solo se implementa alta de asignaciones conforme al contrato actual.
        </p>
      </div>
    </div>
  )
}
