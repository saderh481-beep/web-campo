import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [correo, setCorreo] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
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

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!correo) return
    setLoading(true); setError('')
    try {
      await authApi.requestOTP(correo)
      setStep('otp')
    } catch {
      setError('No se pudo enviar el código. Verifica el correo.')
    } finally { setLoading(false) }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKey = (i: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return
    setLoading(true); setError('')
    try {
      const r = await authApi.login(correo, code)
      login(r.data.usuario ?? r.data)
      nav('/')
    } catch {
      setError('Código incorrecto o expirado.')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  return (
    <div style={{ ...styles.wrap, ...(isMobile ? styles.wrapMobile : {}) }}>
      {/* Left panel */}
      <div style={{ ...styles.left, ...(isMobile ? styles.leftMobile : {}) }}>
        <div style={{ ...styles.leftInner, ...(isMobile ? styles.leftInnerMobile : {}) }}>
           <div style={styles.logoWrap}>
             <img src="/Mesa de trabajo 3.svg" alt="Mesa de trabajo 3" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
           </div>
          <h1 style={styles.brand}>CAMPO</h1>
          <p style={styles.brandSub}>Sistema de Gestión de Técnicos y Beneficiarios</p>
          <div style={styles.divider} />
          <p style={styles.org}>Secretaría de Desarrollo Agropecuario</p>
          <p style={styles.gov}>Gobierno del Estado de Hidalgo 2022–2028</p>
          {!isMobile && <div style={styles.decorCircle} />}
          {!isMobile && <div style={styles.decorCircle2} />}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ ...styles.right, ...(isMobile ? styles.rightMobile : {}) }}>
        <div style={{ ...styles.formCard, ...(isMobile ? styles.formCardMobile : {}) }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={styles.title}>
              {step === 'email' ? 'Iniciar sesión' : 'Verificar código'}
            </h2>
            <p style={styles.subtitle}>
              {step === 'email'
                ? 'Ingresa tu correo institucional para recibir el código OTP'
                : `Código enviado a ${correo}`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmail}>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@hidalgo.gob.mx"
                  required autoFocus
                />
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: 44, fontSize: 14 }}>
                {loading ? <><span className="spinner" />Enviando...</> : 'Enviar código OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Código de 6 dígitos</label>
                <div style={{ ...styles.otpRow, ...(isMobile ? styles.otpRowMobile : {}) }} onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      style={{ ...styles.otpInput, ...(isMobile ? styles.otpInputMobile : {}), ...(d ? styles.otpFilled : {}) }}
                      value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      maxLength={1}
                      inputMode="numeric"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button className="btn btn-primary" type="submit"
                disabled={loading || otp.join('').length < 6}
                style={{ width: '100%', height: 44, fontSize: 14 }}>
                {loading ? <><span className="spinner" />Verificando...</> : 'Acceder al sistema'}
              </button>
              <button type="button" className="btn btn-ghost"
                onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']) }}
                style={{ width: '100%', marginTop: 8 }}>
                ← Cambiar correo
              </button>
            </form>
          )}
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
  leftMobile: { width: '100%', minHeight: 240 },
  leftInner: {
    position: 'relative', zIndex: 1, padding: '60px 48px', color: 'white',
  },
  leftInnerMobile: { padding: '28px 20px' },
  logoWrap: {
    width: 64, height: 64, borderRadius: 16,
    background: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, fontSize: 32,
    border: '1.5px solid rgba(212,193,156,0.4)',
  },
  logoIcon: { lineHeight: 1 },
  brand: {
    fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em',
    color: 'white', marginBottom: 8,
  },
  brandSub: {
    fontSize: 13, color: 'rgba(212,193,156,0.9)',
    lineHeight: 1.5, maxWidth: 240, fontWeight: 400,
  },
  divider: {
    width: 40, height: 2, background: 'var(--dorado)',
    borderRadius: 1, margin: '24px 0',
  },
  org: { fontSize: 12, fontWeight: 700, color: 'var(--dorado)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 },
  gov: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 },
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
  title: { fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'var(--gray-400)' },
  otpRow: { display: 'flex', gap: 8 },
  otpRowMobile: { gap: 6 },
  otpInput: {
    flex: 1, height: 56, borderRadius: 10, border: '2px solid var(--gray-200)',
    textAlign: 'center', fontSize: 22, fontWeight: 700,
    fontFamily: 'Montserrat, monospace', color: 'var(--guinda)',
    outline: 'none', transition: 'all 0.15s',
    background: 'var(--guinda-50)',
  },
  otpInputMobile: { height: 50, fontSize: 20 },
  otpFilled: { borderColor: 'var(--guinda)', background: 'var(--guinda-100)' },
  err: { fontSize: 12, color: 'var(--danger)', marginBottom: 14, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 6 },
}
