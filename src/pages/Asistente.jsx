import { useState } from 'react'
import { Bot, SendHorizontal, Trash2, TriangleAlert } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Conversacion from '@/components/asistente/Conversacion'
import { useAsistente } from '@/hooks/useAsistente'
import { asistenteConfigurado } from '@/services/asistente'

const SUGERENCIAS = [
  '¿Puedo cambiar el arroz de hoy por pasta? ¿Cuánta pondría?',
  '¿Qué ceno si llego tarde de entrenar y tengo poco tiempo?',
  '¿Cómo reparto la proteína a lo largo del día?',
  'Dame una alternativa vegetariana para la comida de hoy.',
]

/** Chat con el asistente de nutrición. */
export default function Asistente() {
  const { mensajes, cargando, pensando, error, enviar, limpiar } = useAsistente()
  const [texto, setTexto] = useState('')

  if (!asistenteConfigurado) return <SinConfigurar />

  function enviarTexto(contenido) {
    enviar(contenido)
    setTexto('')
  }

  function alPulsarTecla(evento) {
    // Enter envía; Mayúsculas+Enter hace salto de línea.
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      enviarTexto(texto)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Bot className="size-5 text-marca-600" aria-hidden="true" />
            Asistente
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Conoce tu perfil, tus metas y el menú de hoy. Pregúntale lo que quieras.
          </p>
        </div>

        {mensajes.length > 0 && (
          <Boton variante="fantasma" tamano="sm" icono={Trash2} onClick={limpiar}>
            Borrar conversación
          </Boton>
        )}
      </header>

      <div className="tarjeta flex min-h-[26rem] flex-col gap-4">
        <Conversacion
          mensajes={mensajes}
          cargando={cargando}
          pensando={pensando}
          sugerencias={SUGERENCIAS}
          onElegirSugerencia={enviarTexto}
        />

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <form
          className="flex items-end gap-2 border-t border-slate-100 pt-3"
          onSubmit={(evento) => {
            evento.preventDefault()
            enviarTexto(texto)
          }}
        >
          <label htmlFor="mensaje" className="sr-only">
            Escribe tu pregunta
          </label>
          <textarea
            id="mensaje"
            rows={1}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={alPulsarTecla}
            maxLength={1000}
            placeholder="Escribe tu pregunta…"
            className="campo max-h-32 min-h-[2.75rem] flex-1 resize-y"
          />
          <Boton
            type="submit"
            icono={SendHorizontal}
            cargando={pensando}
            disabled={!texto.trim()}
            aria-label="Enviar"
          >
            <span className="hidden sm:inline">Enviar</span>
          </Boton>
        </form>
      </div>

      <p className="text-center text-xs text-slate-400">
        Las respuestas las genera un modelo de lenguaje y pueden contener errores. No sustituyen a
        tu médico ni a un dietista-nutricionista.
      </p>
    </div>
  )
}

function SinConfigurar() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto mb-4 w-fit rounded-2xl bg-amber-50 p-3">
        <TriangleAlert className="size-7 text-amber-600" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">El asistente no está configurado</h1>
      <p className="mt-2 text-sm text-slate-500">
        Falta publicar el Worker que guarda la clave de la IA y añadir su dirección en la variable{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">VITE_ASISTENTE_URL</code>. Los
        pasos están en{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">worker/README.md</code>.
      </p>
    </div>
  )
}
