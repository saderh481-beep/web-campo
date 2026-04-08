import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../lib/servicios/auth'
import { getApiErrorMessage } from '../lib/axios'
import { canAccessWebApp, normalizeRole } from '../lib/authz'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [correo, setCorreo] = useState('')
  const [codigoAcceso, setCodigoAcceso] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const code = codigoAcceso.replace(/\D/g, '')
    if (code.length < 5 || code.length > 6) {
      setError('El código debe tener 5 o 6 dígitos')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await authService.login(correo.trim(), code)
      const usuario = result.usuario
      const role = usuario?.rol as string

      if (!canAccessWebApp(role)) {
        await authService.logout()
        const roleLabel = normalizeRole(role) || 'sin rol habilitado'
        setError(`El rol ${roleLabel} no tiene acceso a la aplicación web.`)
        return
      }

      login(usuario)
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
          <div className="login-left-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/Mesa de trabajo 2_1.svg" alt="Logo CAMPO" className="login-logo" style={{ alignSelf: 'center' }} />
            <p className="login-brand-sub">Sistema de Gestión de Técnicos y Beneficiarios</p>
            <div className="login-divider" />
            <p className="login-org">Secretaría de Desarrollo Agropecuario</p>
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
