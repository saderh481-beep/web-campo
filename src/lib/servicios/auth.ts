import { api, saveAuthFromResponse, clearAuthStorage, setStoredToken, setStoredUser, getStoredToken, extractToken, extractUser, clearStoredToken, clearStoredUser, clearCsrfToken } from '../axios'

export const authService = {
  /**
   * Solicitar código de acceso por correo
   * POST /auth/request-codigo-acceso
   */
  requestCodigoAcceso: async (correo: string) => {
    return api.post('/auth/request-codigo-acceso', { correo })
  },

  /**
   * Verificar código de acceso y obtener token
   * POST /auth/verify-codigo-acceso
   */
  verifyCodigoAcceso: async (correo: string, codigo_acceso: string) => {
    const response = await api.post('/auth/verify-codigo-acceso', { correo, codigo_acceso })
    saveAuthFromResponse(response.data)
    const user = extractUser(response.data)
    return { token: extractToken(response.data), usuario: user }
  },

  /**
   * Login (alias de verify-codigo-acceso)
   * POST /auth/login
   */
  login: async (correo: string, codigo_acceso: string) => {
    const response = await api.post('/auth/login', { correo, codigo_acceso })
    saveAuthFromResponse(response.data)
    const user = extractUser(response.data)
    return { token: extractToken(response.data), usuario: user }
  },

  /**
   * Obtener usuario actual autenticado
   * GET /auth/me
   */
  me: async () => {
    const response = await api.get('/auth/me')
    saveAuthFromResponse(response.data)
    return extractUser(response.data)
  },

  /**
   * Cerrar sesión
   * POST /auth/logout
   */
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuthStorage()
    }
  },

  getToken: () => getStoredToken(),

  setToken: (token: string) => setStoredToken(token),

  setUser: (user: unknown) => setStoredUser(user),

  clearAuth: () => {
    clearStoredToken()
    clearStoredUser()
    clearCsrfToken()
  },
}
