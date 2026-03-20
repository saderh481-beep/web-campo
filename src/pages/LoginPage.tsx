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
          <div style={styles.formLogoWrap}>
            <img src="/Mesa de trabajo 3.svg" alt="Logo CAMPO" style={styles.formLogoImg} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={styles.title}>Iniciar sesión</h2>
            <p style={styles.subtitle}>Ingresa tu correo y tu código de acceso en un solo paso</p>
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
    width: '42%', background: 'var(--guinda)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  leftMobile: { width: '100%', minHeight: 220 },
  leftInner: {
    position: 'relative', zIndex: 1, padding: '56px 44px', color: 'white',
  },
  leftInnerMobile: { padding: '24px 20px' },
  brand: {
    fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em',
    color: 'white', marginBottom: 8,
  },
  brandSub: {
    fontSize: 13, color: 'rgba(212,193,156,0.9)',
    lineHeight: 1.5, maxWidth: 260, fontWeight: 400,
  },
  divider: {
    width: 40, height: 2, background: 'var(--dorado)',
    borderRadius: 1, margin: '24px 0',
  },
  org: { fontSize: 12, fontWeight: 700, color: 'var(--dorado)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 },
  gov: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 400 },
  decorCircle: {
    position: 'absolute', bottom: -80, right: -80,
    width: 300, height: 300, borderRadius: '50%',
    border: '1px solid rgba(212,193,156,0.12)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -40, right: -40,
    width: 180, height: 180, borderRadius: '50%',
    background: 'rgba(212,193,156,0.05)',
    border: '1px solid rgba(212,193,156,0.1)',
  },
  right: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--gray-50)', padding: 24,
  },
  rightMobile: { padding: 14 },
  formCard: {
    background: 'white', borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 420,
    border: '1px solid var(--gray-200)',
    boxShadow: '0 4px 24px rgba(98,17,50,0.08)',
  },
  formCardMobile: { padding: '24px 16px', maxWidth: '100%' },
  formLogoWrap: {
    width: 88,
    height: 88,
    margin: '0 auto 18px',
    borderRadius: 18,
    border: '1.5px solid var(--dorado-light)',
    background: 'var(--guinda-50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLogoImg: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'var(--gray-500)' },
  err: { fontSize: 12, color: 'var(--danger)', marginBottom: 14, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 6 },
}
