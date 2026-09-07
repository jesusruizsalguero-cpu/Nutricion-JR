import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Cargando from '@/components/ui/Cargando'

/** Login y registro: si ya hay sesión no tiene sentido mostrarlos. */
export default function RutaPublica() {
  const { autenticado, cargando } = useAuth()

  if (cargando) return <Cargando pantallaCompleta />
  if (autenticado) return <Navigate to="/" replace />

  return <Outlet />
}
