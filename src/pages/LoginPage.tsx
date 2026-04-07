import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, getApiErrorMessage } from '../lib/api'
import { canAccessWebApp, normalizeRole } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [correo, setCorreo] = useState('')
  const [codigoAcceso, setCodigoAcceso] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  const loginCodeHelp = 'Administradores y coordinadores usan 6 dígitos; técnicos usan 5.'

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const code = codigoAcceso.replace(/\D/g, '')
    if (code.length < 5 || code.length > 6) {
      setError(loginCodeHelp)
      return
    }

    setLoading(true)
    setError('')
    try {
      const r = await authApi.login(correo.trim(), code)
      const rawUser = (r.data as { usuario?: { rol?: string }; user?: { rol?: string; role?: string }; rol?: string; role?: string }) ?? {}
      const role = rawUser.usuario?.rol ?? rawUser.user?.rol ?? rawUser.user?.role ?? rawUser.rol ?? rawUser.role

      if (!canAccessWebApp(role)) {
        await authApi.logout().catch(() => {})
        const roleLabel = normalizeRole(role) || 'sin rol habilitado'
        setError(`El rol ${roleLabel} no tiene acceso a la aplicación web.`)
        return
      }

      login(r.data)
      nav('/')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Correo o código de acceso inválidos.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <a href="#main-content" className="skip-nav">Saltar al contenido</a>
      <div className="login-wrap animate-slide-in">
        <div className="login-left">
          <div className="login-left-inner">
            <img src="/Mesa de trabajo 2_1.svg" alt="Logo CAMPO" className="login-logo" />
            <h1 className="login-brand">CAMPO</h1>
            <p className="login-brand-sub">Sistema de Gestión de Técnicos y Beneficiarios</p>
            <div className="login-divider" />
            <p className="login-org">Secretaría de Desarrollo Agropecuario — CAMPO</p>
            <p className="login-gov">Gobierno del Estado de Hidalgo</p>
            <p className="login-motto">Primero el Pueblo 2022-2028</p>
            <div className="login-decor1" />
            <div className="login-decor2" />
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-card">
            <div style={{ marginBottom: 32 }}>
              <h2 className="login-title">Iniciar sesión</h2>
              <p className="login-subtitle">Ingresa tu correo y tu código de acceso</p>
              <p className="login-subtitle" style={{ marginTop: 6, marginBottom: 0 }}>{loginCodeHelp}</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@hidalgo.gob.mx"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Código de acceso</label>
                <input
                  className="input"
                  type="password"
                  value={codigoAcceso}
                  onChange={e => setCodigoAcceso(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  inputMode="numeric"
                  pattern="[0-9]{5,6}"
                  maxLength={6}
                  autoComplete="current-password"
                  required
                />
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>{loginCodeHelp}</div>
              </div>

{error && <div className="login-err" id="main-content">{error}</div>}

              <button
                className="btn btn-primary login-btn"
                type="submit"
                disabled={loading || correo.trim().length === 0 || codigoAcceso.length < 5 || codigoAcceso.length > 6}
              >
                {loading ? <><span className="spinner" />Ingresando...</> : 'Acceder al sistema'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}


