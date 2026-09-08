import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import Cargando from '@/components/ui/Cargando'

/**
 * La conversación en sí: burbujas, indicador de escritura y pantalla inicial.
 * No sabe nada de Firestore ni del backend, solo pinta lo que recibe.
 */
export default function Conversacion({
  mensajes,
  cargando,
  pensando,
  sugerencias = [],
  onElegirSugerencia,
}) {
  const finDelChat = useRef(null)

  // Al llegar un mensaje nuevo, bajar del todo para que se vea.
  useEffect(() => {
    finDelChat.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes.length, pensando])

  return (
    <div className="flex-1 space-y-3" aria-live="polite" aria-busy={pensando}>
      {cargando ? (
        <Cargando mensaje="Cargando la conversación…" />
      ) : mensajes.length === 0 ? (
        <Bienvenida sugerencias={sugerencias} onElegir={onElegirSugerencia} />
      ) : (
        mensajes.map((mensaje) => <Burbuja key={mensaje.id} mensaje={mensaje} />)
      )}

      {pensando && <Escribiendo />}
      <div ref={finDelChat} />
    </div>
  )
}

function Burbuja({ mensaje }) {
  const esUsuario = mensaje.rol === 'usuario'

  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
          esUsuario
            ? 'rounded-br-sm bg-marca-600 text-white'
            : 'rounded-bl-sm bg-slate-100 text-slate-800'
        }`}
      >
        {mensaje.texto}
      </div>
    </div>
  )
}

function Escribiendo() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
        <span className="sr-only">El asistente está escribiendo</span>
        {[0, 150, 300].map((retraso) => (
          <span
            key={retraso}
            className="size-2 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${retraso}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function Bienvenida({ sugerencias, onElegir }) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-3 w-fit rounded-2xl bg-marca-50 p-3">
        <Sparkles className="size-6 text-marca-600" aria-hidden="true" />
      </div>
      <p className="text-sm text-slate-600">
        Puedo resolverte dudas y también cambiarte la dieta: pídeme que sustituya un
        alimento, que ajuste una cantidad o que rehaga un día entero.
      </p>

      <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
        {sugerencias.map((sugerencia) => (
          <button
            key={sugerencia}
            type="button"
            onClick={() => onElegir(sugerencia)}
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:border-marca-300 hover:bg-marca-50"
          >
            {sugerencia}
          </button>
        ))}
      </div>
    </div>
  )
}
