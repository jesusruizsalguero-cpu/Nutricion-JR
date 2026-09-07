import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Cargando from '@/components/ui/Cargando'

/**
 * Exige sesión iniciada. Además fuerza el onboarding hasta que el perfil
 * esté completo, porque sin peso/altura/edad no hay metas que mostrar.
 */
export default function RutaProtegida() {
  const { autenticado, cargando, perfilCompleto } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <Cargando pantallaCompleta mensaje="Cargando tu cuenta…" />

  if (!autenticado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />
  }

  const enOnboarding = ubicacion.pathname === '/bienvenida'
  if (!perfilCompleto && !enOnboarding) {
    return <Navigate to="/bienvenida" replace />
  }
  if (perfilCompleto && enOnboarding) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
