/**
 * NOTA: El registro público de usuarios NO está disponible en este sistema.
 * El backend no expone endpoints de registro público (register, verify-email,
 * resend-verification).
 *
 * El flujo correcto de acceso es:
 *   1. El administrador crea el usuario desde la sección /usuarios
 *   2. El usuario recibe su código de acceso (numérico)
 *   3. El usuario inicia sesión en /login con correo + código de acceso
 */

import { useNavigate } from 'react-router-dom'

export default function RegistroPage() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="card-title text-2xl mb-4 justify-center">Registro no disponible</h2>

          <div className="alert alert-warning mb-4">
            <p>
              El registro público no está habilitado en este sistema. Para obtener acceso,
              contacta a tu administrador o coordinador.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Si ya tienes un código de acceso asignado, inicia sesión con tu correo y código.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary w-full"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
