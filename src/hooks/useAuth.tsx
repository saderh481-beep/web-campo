import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../lib/api'

interface User {
  id: number
  nombre: string
  correo: string
  rol: string
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me()
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (u: User) => setUser(u)

  const logout = async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
    window.location.href = '/login'
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
