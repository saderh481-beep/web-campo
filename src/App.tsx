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

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30000,
    },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--guinda-deeper)' }}>
      <div style={{ fontSize: 32 }}>🌾</div>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(212,193,156,0.2)', borderTopColor: 'var(--dorado)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'rgba(212,193,156,0.6)', fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cargando...</span>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="tecnicos" element={<TecnicosPage />} />
              <Route path="beneficiarios" element={<BeneficiariosPage />} />
              <Route path="bitacoras" element={<BitacorasPage />} />
              <Route path="cadenas" element={<CadenasPage />} />
              <Route path="reportes" element={<ReportesPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
