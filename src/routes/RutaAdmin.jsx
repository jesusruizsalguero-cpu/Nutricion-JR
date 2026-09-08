import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Cargando from '@/components/ui/Cargando'

/**
 * Cierra el paso a /admin salvo que el uid esté en la whitelist admins/{uid}
 * (ver firestore.rules). Va después de <RutaProtegida>, así que aquí ya hay
 * sesión iniciada; solo falta comprobar el rol.
 */
export default function RutaAdmin() {
  const { esAdmin, cargando } = useAuth()

  if (cargando) return <Cargando pantallaCompleta mensaje="Comprobando permisos…" />

  if (!esAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
