import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../lib/api'

interface User {
  id: number | string
  nombre: string
  correo: string
  rol: string
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (user: unknown) => void
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeUser(value: unknown): User | null {
  if (!isRecord(value)) return null

  const container = isRecord(value.usuario)
    ? value.usuario
    : isRecord(value.user)
      ? value.user
      : value

  const rawId = container.id
  const rawNombre = container.nombre ?? container.name
  const rawCorreo = container.correo ?? container.email
  const rawRol = container.rol ?? container.role

  if ((typeof rawId !== 'number' && typeof rawId !== 'string') || typeof rawNombre !== 'string') {
    return null
  }

  return {
    id: typeof rawId === 'string' ? rawId : Number(rawId),
    nombre: rawNombre,
    correo: typeof rawCorreo === 'string' ? rawCorreo : '',
    rol: typeof rawRol === 'string' ? rawRol : '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me()
      .then((r) => setUser(normalizeUser(r.data)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (u: unknown) => setUser(normalizeUser(u))

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
