import { useId } from 'react'
import { Check } from 'lucide-react'

/**
 * Listas de opciones en forma de tarjeta, más cómodas de tocar en móvil que
 * un radio o un checkbox sueltos. `opciones` es [{ valor, etiqueta, descripcion }].
 */
export function GrupoRadio({ leyenda, opciones, valor, onChange, columnas = 1 }) {
  const nombre = useId()

  return (
    <fieldset>
      {leyenda && <legend className="etiqueta-campo">{leyenda}</legend>}
      <div className={`grid gap-2 ${columnas === 2 ? 'sm:grid-cols-2' : ''}`}>
        {opciones.map((opcion) => {
          const activa = valor === opcion.valor
          return (
            <label
              key={opcion.valor}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                activa ? 'border-marca-500 bg-marca-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={nombre}
                value={opcion.valor}
                checked={activa}
                onChange={() => onChange(opcion.valor)}
                className="mt-0.5 size-4 shrink-0 text-marca-600 focus:ring-marca-500"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-800">{opcion.etiqueta}</span>
                {opcion.descripcion && (
                  <span className="mt-0.5 block text-xs text-slate-500">{opcion.descripcion}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Selección múltiple. `valores` es un array de claves activas. */
export function GrupoCasillas({ leyenda, ayuda, opciones, valores = [], onChange, columnas = 2 }) {
  function alternar(clave) {
    onChange(valores.includes(clave) ? valores.filter((v) => v !== clave) : [...valores, clave])
  }

  return (
    <fieldset>
      {leyenda && <legend className="etiqueta-campo">{leyenda}</legend>}
      {ayuda && <p className="mb-2 -mt-1 text-xs text-slate-500">{ayuda}</p>}

      <div className={`grid gap-2 ${columnas === 2 ? 'sm:grid-cols-2' : ''}`}>
        {opciones.map((opcion) => {
          const activa = valores.includes(opcion.valor)
          return (
            <label
              key={opcion.valor}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                activa ? 'border-marca-500 bg-marca-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={activa}
                onChange={() => alternar(opcion.valor)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                  activa ? 'border-marca-600 bg-marca-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {activa && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-800">{opcion.etiqueta}</span>
                {opcion.descripcion && (
                  <span className="mt-0.5 block text-xs text-slate-500">{opcion.descripcion}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
