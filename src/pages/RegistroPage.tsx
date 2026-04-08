/**
 * Página de Registro Público de Usuarios
 * Ruta: /registro
 * SIN autenticación requerida - Públicamente accesible
 * 
 * Funcionalidades:
 * - Formulario de registro para nuevos usuarios
 * - Validación de contraseña
 * - Verificación de email
 * - Reenvío de correo de verificación
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { registroService } from '../lib/servicios/registro'
import { getApiErrorMessage } from '../lib/axios'
import FeedbackBanner from '../components/common/FeedbackBanner'

interface RegistroForm {
  nombre: string
  correo: string
  password: string
  passwordConfirm: string
  telefono: string
  aceptaTerminos: boolean
}

const INITIAL_FORM_STATE: RegistroForm = {
  nombre: '',
  correo: '',
  password: '',
  passwordConfirm: '',
  telefono: '',
  aceptaTerminos: false,
}

export default function RegistroPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegistroForm>(INITIAL_FORM_STATE)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [registroExitoso, setRegistroExitoso] = useState(false)
  const [emailVerificacion, setEmailVerificacion] = useState('')

  // Mutation para registrar usuario
  const registerMutation = useMutation({
    mutationFn: async (data: RegistroForm) => {
      // Validaciones de cliente
      if (data.password !== data.passwordConfirm) {
        throw new Error('Las contraseñas no coinciden')
      }

      if (data.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres')
      }

      if (!data.aceptaTerminos) {
        throw new Error('Debe aceptar los términos y condiciones')
      }

      return registroService.register({
        nombre: data.nombre,
        correo: data.correo,
        password: data.password,
        telefono: data.telefono || undefined,
      })
    },
    onSuccess: () => {
      setEmailVerificacion(form.correo)
      setRegistroExitoso(true)
      setFeedback({
        type: 'success',
        message: 'Registro completado. Verifica tu correo para activar tu cuenta.',
      })
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, 'Error al registrar usuario')
      setFeedback({ type: 'error', message })
    },
  })

  // Mutation para reenviar correo de verificación
  const resendMutation = useMutation({
    mutationFn: () =>
      registroService.resendVerification({
        correo: emailVerificacion,
      }),
    onSuccess: () => {
      setFeedback({
        type: 'success',
        message: 'Correo de verificación reenviado',
      })
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, 'Error al reenviar correo')
      setFeedback({ type: 'error', message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate(form)
  }

  if (registroExitoso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">¡Registro Exitoso!</h2>

            <div className="alert alert-info mb-4">
              <div>
                <p>Se ha enviado un correo de verificación a:</p>
                <p className="font-bold">{emailVerificacion}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Por favor, verifica tu correo electrónico para activar tu cuenta. Si no ves el correo,
              revisa tu carpeta de spam.
            </p>

            {feedback && (
              <FeedbackBanner
                kind={feedback.type}
                message={feedback.message}
              />
            )}

            <div className="space-y-2">
              <button
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                className="btn btn-outline btn-block"
              >
                Reenviar Correo de Verificación
              </button>

              <button onClick={() => navigate('/login')} className="btn btn-primary btn-block">
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Crear Nueva Cuenta</h2>

          {feedback && (
            <FeedbackBanner
              kind={feedback.type}
              message={feedback.message}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Nombre Completo *</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Correo Electrónico *</span>
              </label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                className="input input-bordered w-full"
                placeholder="juan@example.com"
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Teléfono (Opcional)</span>
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Ej: 3001234567"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Contraseña *</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Mínimo 8 caracteres"
                required
              />
              <label className="label">
                <span className="label-text-alt text-xs text-gray-500">
                  Mínimo 8 caracteres, incluye mayúsculas y números
                </span>
              </label>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Confirmar Contraseña *</span>
              </label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                className="input input-bordered w-full"
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <div>
              <label className="label cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.aceptaTerminos}
                  onChange={(e) => setForm({ ...form, aceptaTerminos: e.target.checked })}
                  className="checkbox"
                  required
                />
                <span className="label-text ml-3">
                  Acepto los términos y condiciones *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn btn-primary w-full"
            >
              {registerMutation.isPending ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <div className="divider">O</div>

          <p className="text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="link link-primary">
              Inicia Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
