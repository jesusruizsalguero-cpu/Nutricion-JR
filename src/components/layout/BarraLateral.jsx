import { NavLink } from 'react-router-dom'
import { LogOut, Salad, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cerrarSesion } from '@/services/autenticacion'
import { ENLACES } from '@/components/layout/navegacion'

export default function BarraLateral() {
  const { datos, esAdmin } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="rounded-xl bg-marca-600 p-2">
          <Salad className="size-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-slate-900">Nutrición JR</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {ENLACES.map(({ a, etiqueta, icono: Icono, exacto }) => (
          <NavLink
            key={a}
            to={a}
            end={exacto}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-marca-50 text-marca-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icono className="size-5" aria-hidden="true" />
            {etiqueta}
          </NavLink>
        ))}

        {esAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-marca-50 text-marca-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <ShieldCheck className="size-5" aria-hidden="true" />
            Administración
          </NavLink>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marca-100 text-sm font-semibold text-marca-700">
            {datos?.nombre?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{datos?.nombre}</p>
            <p className="truncate text-xs text-slate-500">{datos?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
