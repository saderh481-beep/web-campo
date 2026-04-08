export { authService } from './auth'
export { usuariosService } from './usuarios'
export { tecnicosService } from './tecnicos'
export { beneficiariosService } from './beneficiarios'
export { asignacionesService } from './asignaciones'
export { bitacorasService } from './bitacoras'
export { cadenasService, actividadesService, localidadesService, zonasService } from './catalogos'
export {
  configuracionesService,
  notificacionesService,
  dashboardService,
  documentosPlantillaService,
  reportesService,
  archiveService,
} from './extra'

// NOTA: registroService eliminado — los endpoints de registro público
// (register, verify-email, resend-verification) no existen en el backend.
// Ver: src/lib/servicios/registro.ts
