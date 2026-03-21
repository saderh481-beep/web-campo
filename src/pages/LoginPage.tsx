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
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  )
  const { login } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 960)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const code = codigoAcceso.replace(/\D/g, '')
    if (code.length !== 6) {
      setError('El codigo de acceso debe tener 6 digitos.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const r = await authApi.login(correo.trim(), code)
      login(r.data)
      nav('/')
    } catch {
      setError('Correo o codigo de acceso invalidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrap}>
      {/* Left Brand Panel */}
      <div style={{ ...styles.left, ...(isMobile ? styles.leftMobile : {}) }}>
        <div style={styles.leftContent}>
          {/* Prominent Logo */}
          <div style={styles.logoContainer}>
            <img 
              src="/Mesa de trabajo 3.svg" 
              alt="Logo CAMPO" 
              style={{ ...styles.logo, ...(isMobile ? styles.logoMobile : {}) }} 
            />
          </div>
          
          <h1 style={{ ...styles.brand, ...(isMobile ? styles.brandMobile : {}) }}>CAMPO</h1>
          <p style={styles.brandSub}>Sistema de Gestion de Tecnicos y Beneficiarios</p>
          
          <div style={styles.divider} />
          
          <div style={styles.orgInfo}>
            <p style={styles.org}>Secretaria de Desarrollo Agropecuario</p>
            <p style={styles.gov}>Gobierno del Estado de Hidalgo 2022-2028</p>
          </div>
        </div>

        {/* Decorative circles */}
        {!isMobile && (
          <>
            <div style={styles.decorCircle1} />
            <div style={styles.decorCircle2} />
            <div style={styles.decorCircle3} />
            <div style={styles.decorCircle4} />
            <div style={styles.decorCircle5} />
            <div style={styles.decorCircle6} />
          </>
        )}
      </div>

      {/* Right Login Panel */}
      <div style={{ ...styles.right, ...(isMobile ? styles.rightMobile : {}) }}>
        <div style={{ ...styles.formContainer, ...(isMobile ? styles.formContainerMobile : {}) }}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.title}>Bienvenido</h2>
              <p style={styles.subtitle}>Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo electronico</label>
                <input
                  style={styles.input}
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@hidalgo.gob.mx"
                  autoComplete="username"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Codigo de acceso</label>
                <input
                  style={styles.input}
                  type="password"
                  value={codigoAcceso}
                  onChange={e => setCodigoAcceso(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="current-password"
                  required
                />
                <span style={styles.hint}>Ingresa los 6 digitos de tu codigo</span>
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || correo.trim().length === 0 || codigoAcceso.length !== 6}
                style={{
                  ...styles.submitBtn,
                  ...(loading || correo.trim().length === 0 || codigoAcceso.length !== 6 
                    ? styles.submitBtnDisabled : {})
                }}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner} />
                    Verificando...
                  </>
                ) : (
                  'Acceder al sistema'
                )}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                Problemas para acceder? Contacta al administrador
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  
  // Left Panel
  left: {
    width: '45%',
    background: 'var(--primary)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 48px',
  },
  leftMobile: {
    width: '100%',
    minHeight: 'auto',
    padding: '48px 24px 40px',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    maxWidth: 400,
  },
  
  // Logo
  logoContainer: {
    marginBottom: 48,
    padding: 32,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 32,
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  logo: {
    width: 220,
    height: 220,
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)',
    opacity: 0.95,
  },
  logoMobile: {
    width: 140,
    height: 140,
  },
  
  // Brand text
  brand: {
    fontSize: 56,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'white',
    marginBottom: 16,
    lineHeight: 1,
  },
  brandMobile: {
    fontSize: 36,
  },
  brandSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.6,
    fontWeight: 400,
    maxWidth: 320,
    margin: '0 auto',
  },
  
  // Divider
  divider: {
    width: 48,
    height: 2,
    background: 'var(--accent)',
    margin: '40px auto',
    borderRadius: 1,
  },
  
  // Organization info
  orgInfo: {
    marginTop: 8,
  },
  org: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--accent)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  gov: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // Decorative circles
  decorCircle1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: '1px solid rgba(201,169,98,0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    top: '20%',
    right: '8%',
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(201,169,98,0.08)',
  },
  decorCircle3: {
    position: 'absolute',
    bottom: '25%',
    left: '10%',
    width: 60,
    height: 60,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  decorCircle4: {
    position: 'absolute',
    bottom: '10%',
    right: '15%',
    width: 140,
    height: 140,
    borderRadius: '50%',
    border: '1px solid rgba(201,169,98,0.12)',
  },
  decorCircle5: {
    position: 'absolute',
    top: '50%',
    left: '-30px',
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'rgba(201,169,98,0.06)',
  },
  decorCircle6: {
    position: 'absolute',
    bottom: '5%',
    left: '30%',
    width: 50,
    height: 50,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  
  // Right Panel
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-50)',
    padding: 40,
  },
  rightMobile: {
    padding: 24,
  },
  
  // Form container
  formContainer: {
    width: '100%',
    maxWidth: 420,
  },
  formContainerMobile: {
    maxWidth: '100%',
  },
  
  // Form card
  formCard: {
    background: 'white',
    borderRadius: 16,
    padding: '48px 40px',
    border: '1px solid var(--gray-200)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05)',
  },
  
  // Form header
  formHeader: {
    marginBottom: 36,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--gray-900)',
    marginBottom: 8,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--gray-500)',
    lineHeight: 1.5,
  },
  
  // Form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--gray-700)',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    border: '1px solid var(--gray-300)',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--gray-900)',
    background: 'white',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  hint: {
    display: 'block',
    fontSize: 12,
    color: 'var(--gray-400)',
    marginTop: 6,
  },
  
  // Error
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'var(--danger-bg)',
    border: '1px solid var(--danger-border)',
    borderRadius: 10,
    color: 'var(--danger)',
    fontSize: 13,
    marginBottom: 20,
  },
  
  // Submit button
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 2px 4px rgba(26,26,46,0.15)',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  
  // Spinner
  spinner: {
    width: 18,
    height: 18,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  
  // Footer
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: '1px solid var(--gray-100)',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'var(--gray-400)',
  },
}
