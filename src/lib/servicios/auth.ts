import { api, saveAuthFromResponse, clearAuthStorage, setStoredToken, setStoredUser, getStoredToken, extractToken, extractUser, clearStoredToken, clearStoredUser, clearCsrfToken } from '../axios'

export const authService = {
  login: async (correo: string, codigo_acceso: string) => {
    const response = await api.post('/auth/verify-codigo-acceso', { correo, codigo_acceso })
    saveAuthFromResponse(response.data)
    const user = extractUser(response.data)
    return { token: extractToken(response.data), usuario: user }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuthStorage()
    }
  },
  
  me: async () => {
    const response = await api.get('/auth/me')
    saveAuthFromResponse(response.data)
    return extractUser(response.data)
  },
  
  getToken: () => getStoredToken(),
  
  setToken: (token: string) => setStoredToken(token),
  
  setUser: (user: unknown) => setStoredUser(user),
  
  clearAuth: () => {
    clearStoredToken()
    clearStoredUser()
    clearCsrfToken()
  }
}
