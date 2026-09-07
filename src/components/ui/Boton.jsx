import { Loader2 } from 'lucide-react'

const VARIANTES = {
  primario:
    'bg-marca-600 text-white hover:bg-marca-700 active:bg-marca-800 disabled:bg-marca-300',
  secundario:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  fantasma: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  peligro: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
}

const TAMANOS = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
}

export default function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  anchoCompleto = false,
  icono: Icono,
  children,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center rounded-xl font-medium
                  transition-colors disabled:cursor-not-allowed disabled:opacity-70
                  ${VARIANTES[variante]} ${TAMANOS[tamano]}
                  ${anchoCompleto ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {cargando ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icono && <Icono className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
