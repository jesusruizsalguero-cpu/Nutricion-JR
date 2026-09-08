import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cerrarSesion } from '@/services/autenticacion'
import Cargando from '@/components/ui/Cargando'

/**
 * Exige sesión iniciada. Además fuerza el onboarding hasta que el perfil
 * esté completo, porque sin peso/altura/edad no hay metas que mostrar.
 */
export default function RutaProtegida() {
  const { autenticado, cargando, perfilCompleto, bloqueado } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <Cargando pantallaCompleta mensaje="Cargando tu cuenta…" />

  // La portada la enseña App al abrir la app, no esta redirección: aquí lo
  // que falta es la sesión.
  if (!autenticado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />
  }

  // Un admin lo bloqueó (colección `bloqueados`, ver firestore.rules): la
  // sesión de Google sigue siendo válida, pero la app no le deja usarla.
  if (bloqueado) return <CuentaBloqueada />

  const enOnboarding = ubicacion.pathname === '/bienvenida'
  if (!perfilCompleto && !enOnboarding) {
    return <Navigate to="/bienvenida" replace />
  }
  if (perfilCompleto && enOnboarding) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function CuentaBloqueada() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
      <div className="rounded-full bg-red-50 p-3">
        <ShieldOff className="size-6 text-red-600" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">Tu cuenta está bloqueada</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Un administrador ha bloqueado el acceso a esta cuenta. Si crees que es un error, contacta
        con quien gestiona la app.
      </p>
      <button
        type="button"
        onClick={cerrarSesion}
        className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
