import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Diálogo centrado; se cierra con Escape o clic en el fondo. */
export default function Modal({ abierto, alCerrar, titulo, children, ancho = 'max-w-lg' }) {
  const contenedor = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined

    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') alCerrar()
    }
    document.addEventListener('keydown', alPulsarTecla)

    // Evita que el fondo haga scroll mientras el modal está abierto.
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPulsarTecla)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto, alCerrar])

  if (!abierto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === contenedor.current) alCerrar()
      }}
      ref={contenedor}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full ${ancho} max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white
                    shadow-xl sm:rounded-2xl`}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
