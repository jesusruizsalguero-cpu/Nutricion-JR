import { useState } from 'react'
import { Salad } from 'lucide-react'
import { iniciarSesionConGoogle } from '@/services/autenticacion'
import { mensajeErrorAuth } from '@/utils/formato'

export default function Login() {
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    setError(null)
    setCargando(true)
    try {
      await iniciarSesionConGoogle()
      // La redirección la hace <RutaPublica> al detectar la sesión.
    } catch (e) {
      // Cerrar la ventana de Google no es un fallo: no merece un mensaje rojo.
      if (e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-closed-by-user') {
        setError(mensajeErrorAuth(e.code))
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-marca-600 p-3.5">
            <Salad className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nutrición JR</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Tu dieta, calculada a partir de tu edad, tu peso, tu deporte y tu salud.
          </p>
        </div>

        <div className="tarjeta">
          <button
            type="button"
            onClick={entrar}
            disabled={cargando}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300
                       bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors
                       hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogoGoogle />
            {cargando ? 'Conectando…' : 'Continuar con Google'}
          </button>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-xs text-slate-400">
            La primera vez crearemos tu cuenta automáticamente.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Logo oficial de Google en SVG: evita depender de una imagen externa. */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
      />
    </svg>
  )
}
