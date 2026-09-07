import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Salad } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import { iniciarSesion, iniciarSesionConGoogle, recuperarPassword } from '@/services/autenticacion'
import { mensajeErrorAuth } from '@/utils/formato'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await iniciarSesion({ email, password })
      // La redirección la hace <RutaPublica> al detectar la sesión.
    } catch (e) {
      setError(mensajeErrorAuth(e.code))
    } finally {
      setCargando(false)
    }
  }

  async function entrarConGoogle() {
    setError(null)
    setCargando(true)
    try {
      await iniciarSesionConGoogle()
    } catch (e) {
      setError(mensajeErrorAuth(e.code))
    } finally {
      setCargando(false)
    }
  }

  async function restablecer() {
    if (!email) {
      setError('Escribe tu correo para enviarte el enlace de recuperación.')
      return
    }
    try {
      await recuperarPassword(email)
      setAviso('Te hemos enviado un correo para restablecer la contraseña.')
      setError(null)
    } catch (e) {
      setError(mensajeErrorAuth(e.code))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 rounded-2xl bg-marca-600 p-3">
            <Salad className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nutrición JR</h1>
          <p className="mt-1 text-sm text-slate-500">Entra para seguir tu progreso</p>
        </div>

        <form onSubmit={enviar} className="tarjeta space-y-4">
          <Campo
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />

          <div>
            <Campo
              etiqueta="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={restablecer}
              className="mt-2 text-xs font-medium text-marca-700 hover:underline"
            >
              ¿Has olvidado tu contraseña?
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {aviso && (
            <p role="status" className="rounded-lg bg-marca-50 px-3 py-2 text-sm text-marca-800">
              {aviso}
            </p>
          )}

          <Boton type="submit" anchoCompleto cargando={cargando}>
            Iniciar sesión
          </Boton>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">o</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Boton variante="secundario" anchoCompleto onClick={entrarConGoogle} disabled={cargando}>
            Continuar con Google
          </Boton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-marca-700 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
