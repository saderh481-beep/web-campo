export type NormalizedRole = 'administrador' | 'coordinador' | 'tecnico' | ''

export function normalizeRole(role?: string | null): NormalizedRole {
  const normalized = role?.trim().toLowerCase()

  switch (normalized) {
    case 'admin':
    case 'administrador':
      return 'administrador'
    case 'coordinador':
      return 'coordinador'
    case 'tecnico':
    case 'técnico':
      return 'tecnico'
    default:
      return ''
  }
}

export function isAdmin(role?: string | null): boolean {
  return normalizeRole(role) === 'administrador'
}

export function isCoordinator(role?: string | null): boolean {
  return normalizeRole(role) === 'coordinador'
}

export function isTecnico(role?: string | null): boolean {
  return normalizeRole(role) === 'tecnico'
}

export function canManageUsers(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewDashboard(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewTecnicos(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageTecnicos(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewBeneficiarios(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageBeneficiarios(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canAssignBeneficiarioCadenas(role?: string | null): boolean {
  return isAdmin(role)
}

export function canUploadBeneficiarioDocumentos(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canViewCadenas(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageCadenas(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewBitacoras(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageBitacoras(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewReports(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canViewActividades(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageActividades(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewAsignaciones(role?: string | null): boolean {
  return isAdmin(role)
}

export function canManageAsignaciones(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewNotifications(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role) || isTecnico(role)
}

export function canViewLocalidades(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageLocalidades(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewConfiguraciones(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageConfiguraciones(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewDocumentosPlantilla(role?: string | null): boolean {
  return isAdmin(role) || isCoordinator(role)
}

export function canManageDocumentosPlantilla(role?: string | null): boolean {
  return isAdmin(role)
}

export function canViewArchive(role?: string | null): boolean {
  return isAdmin(role)
}

export function getRoleHomePath(role?: string | null): string {
  switch (normalizeRole(role)) {
    case 'administrador':
      return '/usuarios'
    case 'coordinador':
      return '/tecnicos'
    case 'tecnico':
      return '/sin-acceso'
    default:
      return '/login'
  }
}
