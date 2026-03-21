import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [correo, setCorreo] = useState('')
  const [codigoAcceso, setCodigoAcceso] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 920 : false
  )
  const { login } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 920)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const code = codigoAcceso.replace(/\D/g, '')
    if (code.length !== 6) {
      setError('El código de acceso debe tener 6 dígitos.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const r = await authApi.login(correo.trim(), code)
      login(r.data)
      nav('/')
    } catch {
      setError('Correo o código de acceso inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...styles.wrap, ...(isMobile ? styles.wrapMobile : {}) }}>
      <div style={{ ...styles.left, ...(isMobile ? styles.leftMobile : {}) }}>
        <div style={{ ...styles.leftInner, ...(isMobile ? styles.leftInnerMobile : {}) }}>
          <img src="/Mesa de trabajo 3.svg" alt="Logo CAMPO" style={styles.leftLogo} />
          <h1 style={styles.brand}>CAMPO</h1>
          <p style={styles.brandSub}>Sistema de Gestión de Técnicos y Beneficiarios</p>
          <div style={styles.divider} />
          <p style={styles.org}>Secretaría de Desarrollo Agropecuario</p>
          <p style={styles.gov}>Gobierno del Estado de Hidalgo 2022-2028</p>
          {!isMobile && <div style={styles.decorCircle} />}
          {!isMobile && <div style={styles.decorCircle2} />}
        </div>
      </div>

      <div style={{ ...styles.right, ...(isMobile ? styles.rightMobile : {}) }}>
        <div style={{ ...styles.formCard, ...(isMobile ? styles.formCardMobile : {}) }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={styles.title}>Iniciar sesión</h2>
            <p style={styles.subtitle}>Ingresa tu correo y tu código de acceso</p>
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
              <label className="form-label">Código de acceso (6 dígitos)</label>
              <input
                className="input"
                type="password"
                value={codigoAcceso}
                onChange={e => setCodigoAcceso(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p style={styles.err}>{error}</p>}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || correo.trim().length === 0 || codigoAcceso.length !== 6}
              style={{ width: '100%', height: 44, fontSize: 14 }}
            >
              {loading ? <><span className="spinner" />Ingresando...</> : 'Acceder al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif',
  },
  wrapMobile: { flexDirection: 'column' },
  left: {
    width: '46%', background: 'var(--guinda)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px',
  },
  leftMobile: { width: '100%', minHeight: 'auto', padding: '40px 24px' },
  leftInner: {
    position: 'relative', zIndex: 1, color: 'white', textAlign: 'center',
    maxWidth: 420,
  },
  leftInnerMobile: {},
  leftLogo: {
    width: 120, height: 120,
    objectFit: 'contain',
    marginBottom: 24,
  },
  brand: {
    fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em',
    color: 'white', marginBottom: 16,
  },
  brandSub: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.6, fontWeight: 400, marginBottom: 32,
  },
  divider: {
    width: 60, height: 1, background: 'rgba(212,193,156,0.4)',
    margin: '0 auto 32px',
  },
  org: { fontSize: 13, fontWeight: 600, color: 'var(--dorado)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 8 },
  gov: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 400, lineHeight: 1.5 },
  decorCircle: {
    position: 'absolute', bottom: -100, right: -100,
    width: 300, height: 300, borderRadius: '50%',
    border: '1px solid rgba(212,193,156,0.1)',
  },
  decorCircle2: {
    position: 'absolute', top: -80, left: -80,
    width: 200, height: 200, borderRadius: '50%',
    background: 'rgba(212,193,156,0.04)',
    border: '1px solid rgba(212,193,156,0.08)',
  },
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--gray-50)', padding: 32,
  },
  rightMobile: { padding: 20 },
  formCard: {
    background: 'white', borderRadius: 8, padding: '48px 40px',
    width: '100%', maxWidth: 440,
    border: '1px solid var(--gray-200)',
  },
  formCardMobile: { padding: '32px 24px', maxWidth: '100%' },
  title: { fontSize: 24, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'var(--gray-500)', textAlign: 'center', marginBottom: 8 },
  err: { fontSize: 13, color: 'var(--danger)', marginBottom: 16, padding: '10px 14px', background: 'var(--danger-bg)', borderRadius: 4, border: '1px solid var(--danger)' },
}
