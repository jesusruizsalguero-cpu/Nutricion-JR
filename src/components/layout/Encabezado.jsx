import { Link } from 'react-router-dom'
import { LogOut, Salad } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cerrarSesion } from '@/services/autenticacion'

/** Solo visible en móvil: en escritorio la identidad vive en la barra lateral. */
export default function Encabezado() {
  const { datos } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-marca-600 p-1.5">
            <Salad className="size-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">Nutrición JR</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{datos?.nombre?.split(' ')[0]}</span>
          <button
            type="button"
            onClick={cerrarSesion}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
