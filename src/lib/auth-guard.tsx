/**
 * Componente de autenticación y autorización
 * Implementa las reglas de acceso según roles
 */

import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { canAccessWebApp, getRoleHomePath, isAdmin } from './authz'

/**
 * Componente que protege rutas según roles de usuario
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return

      // Si no hay usuario y no está cargando, redirigir al login
      if (!user && !loading) {
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
        setCheckingAuth(false)
        return
      }

      // Si hay usuario pero no tiene acceso, redirigir según su rol
      if (user && !canAccessWebApp(user.rol)) {
        const homePath = getRoleHomePath(user.rol)
        if (location.pathname !== homePath) {
          navigate(homePath, { replace: true })
        }
        setCheckingAuth(false)
        return
      }

      // Si todo está bien, permitir el acceso
      setCheckingAuth(false)
    }

    checkAuth()
  }, [user, loading, navigate, location.pathname])

  // Mostrar loader mientras se verifica la autenticación
  if (checkingAuth || loading) {
    return (
      <div className="auth-guard-loading">
        <div className="spinner-large" />
        <p>Verificando autenticación...</p>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Hook para verificar permisos de administrador
 */
export function useAdminOnly() {
  const { user } = useAuth()
  
  if (!user || !isAdmin(user.rol)) {
    throw new Error('Acceso denegado: Se requiere rol de administrador')
  }

  return user
}

/**
 * Componente para páginas que solo pueden ver administradores
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  if (!user || !isAdmin(user.rol)) {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>Esta sección solo está disponible para usuarios con rol de administrador.</p>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Hook para verificar si el usuario puede crear usuarios
 */
export function useCanCreateUsers() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar usuarios
 */
export function useCanManageUsers() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede ver el dashboard
 */
export function useCanViewDashboard() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar técnicos
 */
export function useCanManageTecnicos() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar beneficiarios
 */
export function useCanManageBeneficiarios() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar cadenas productivas
 */
export function useCanManageCadenas() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar actividades
 */
export function useCanManageActividades() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar asignaciones
 */
export function useCanManageAsignaciones() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar bitácoras
 */
export function useCanManageBitacoras() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede ver reportes
 */
export function useCanViewReports() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar configuraciones
 */
export function useCanManageConfiguraciones() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar documentos plantilla
 */
export function useCanManageDocumentosPlantilla() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar el archivo
 */
export function useCanManageArchive() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar localidades
 */
export function useCanManageLocalidades() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar zonas
 */
export function useCanManageZonas() {
  const { user } = useAuth()
  return user && isAdmin(user.rol)
}

/**
 * Hook para verificar si el usuario puede ver notificaciones
 */
export function useCanViewNotifications() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}

/**
 * Hook para verificar si el usuario puede gestionar documentos PDF
 */
export function useCanManageDocumentosPdf() {
  const { user } = useAuth()
  return user && canAccessWebApp(user.rol)
}