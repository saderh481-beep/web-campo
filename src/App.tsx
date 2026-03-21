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
import UsuariosPage from './pages/UsuariosPage'
import AppErrorBoundary from './components/common/AppErrorBoundary'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30000,
    },
  },
})

function getRoleHomePath(role?: string | null) {
  const normalizedRole = role?.trim().toLowerCase()

  switch (normalizedRole) {
    case 'admin':
    case 'administrador':
      return '/usuarios'
    case 'tecnico':
    case 'técnico':
      return '/bitacoras'
    case 'coordinador':
    default:
      return '/dashboard'
  }
}

function FullScreenLoader() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'column', 
      gap: 20, 
      background: 'var(--primary)',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <img 
          src="/Mesa de trabajo 3.svg" 
          alt="CAMPO" 
          style={{ 
            width: 40, 
            height: 40, 
            filter: 'brightness(0) invert(1)', 
            opacity: 0.9,
          }} 
        />
      </div>
      <div style={{ 
        width: 28, 
        height: 28, 
        border: '2.5px solid rgba(255,255,255,0.15)', 
        borderTopColor: 'rgba(255,255,255,0.8)', 
        borderRadius: '50%', 
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ 
        color: 'rgba(255,255,255,0.6)', 
        fontSize: 11, 
        fontWeight: 500, 
        letterSpacing: '0.12em', 
        textTransform: 'uppercase',
      }}>
        Cargando...
      </span>
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
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="tecnicos" element={<TecnicosPage />} />
                <Route path="beneficiarios" element={<BeneficiariosPage />} />
                <Route path="bitacoras" element={<BitacorasPage />} />
                <Route path="cadenas" element={<CadenasPage />} />
                <Route path="reportes" element={<ReportesPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
              </Route>
              <Route path="*" element={<RoleHomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </AppErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  )
}
