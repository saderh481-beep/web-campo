import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TecnicosPage from './pages/TecnicosPage'
import BeneficiariosPage from './pages/BeneficiariosPage'
import BitacorasPage from './pages/BitacorasPage'
import CadenasPage from './pages/CadenasPage'
import ReportesPage from './pages/ReportesPage'
import ActividadesPage from './pages/ActividadesPage'
import AsignacionesPage from './pages/AsignacionesPage'
import UsuariosPage from './pages/UsuariosPage'
import AppErrorBoundary from './components/common/AppErrorBoundary'
import {
  canViewBeneficiarios,
  canViewBitacoras,
  canViewCadenas,
  canViewDashboard,
  canViewReports,
  canViewActividades,
  canViewAsignaciones,
  canViewTecnicos,
  canManageUsers,
  getRoleHomePath,
} from './lib/authz'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30000,
    },
  },
})

function FullScreenLoader() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--guinda-deeper)' }}>
      <div style={{ fontSize: 32 }}>🌾</div>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(212,193,156,0.2)', borderTopColor: 'var(--dorado)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'rgba(212,193,156,0.6)', fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cargando...</span>
    </div>
  )
}

function NoAccessPage() {
  const { user } = useAuth()
  return (
    <div className="page animate-in">
      <div className="card" style={{ maxWidth: 640, margin: '48px auto', textAlign: 'center' }}>
        <h1 className="page-title" style={{ marginBottom: 12 }}>Sin acceso en esta aplicacion</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          El usuario {user?.correo ?? 'actual'} tiene rol {user?.rol ?? 'sin rol'} y no cuenta con vistas habilitadas en este frontend web.
        </p>
      </div>
    </div>
  )
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />

  return <Navigate to={getRoleHomePath(user.rol)} replace />
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function RoleRoute({
  allow,
  children,
}: {
  allow: (role?: string | null) => boolean
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />

  return allow(user.rol) ? <>{children}</> : <Navigate to={getRoleHomePath(user.rol)} replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return user ? <Navigate to={getRoleHomePath(user.rol)} replace /> : <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AppErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route index element={<RoleHomeRedirect />} />
                <Route path="sin-acceso" element={<NoAccessPage />} />
                <Route path="dashboard" element={<RoleRoute allow={canViewDashboard}><DashboardPage /></RoleRoute>} />
                <Route path="tecnicos" element={<RoleRoute allow={canViewTecnicos}><TecnicosPage /></RoleRoute>} />
                <Route path="beneficiarios" element={<RoleRoute allow={canViewBeneficiarios}><BeneficiariosPage /></RoleRoute>} />
                <Route path="bitacoras" element={<RoleRoute allow={canViewBitacoras}><BitacorasPage /></RoleRoute>} />
                <Route path="cadenas" element={<RoleRoute allow={canViewCadenas}><CadenasPage /></RoleRoute>} />
                <Route path="reportes" element={<RoleRoute allow={canViewReports}><ReportesPage /></RoleRoute>} />
                <Route path="actividades" element={<RoleRoute allow={canViewActividades}><ActividadesPage /></RoleRoute>} />
                <Route path="asignaciones" element={<RoleRoute allow={canViewAsignaciones}><AsignacionesPage /></RoleRoute>} />
                <Route path="usuarios" element={<RoleRoute allow={canManageUsers}><UsuariosPage /></RoleRoute>} />
              </Route>
              <Route path="*" element={<RoleHomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </AppErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  )
}
