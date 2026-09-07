import { NavLink } from 'react-router-dom'
import { ENLACES } from '@/components/layout/navegacion'

/** Navegación principal en móvil. Se oculta a partir de `lg`. */
export default function BarraInferior() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md">
        {ENLACES.map(({ a, etiqueta, icono: Icono, exacto }) => (
          <NavLink
            key={a}
            to={a}
            end={exacto}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-marca-700' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icono
                  className={`size-5 ${isActive ? 'stroke-[2.3]' : ''}`}
                  aria-hidden="true"
                />
                {etiqueta}
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Espacio para la barra de gestos en iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
