import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { canAccessWebApp, type NormalizedRole } from '../../lib/authz'
import { Loader } from '../ui'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user: usuario, loading: isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!canAccessWebApp(usuario.rol)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: NormalizedRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user: usuario, loading: isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  if (!usuario || !allowedRoles.includes(usuario.rol as NormalizedRole)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return <>{children}</>
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['administrador']}>{children}</RoleGuard>
}

export function CoordinatorOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['administrador', 'coordinador']}>{children}</RoleGuard>
}