import { useId } from 'react'

/** Input con etiqueta, sufijo opcional (kg, cm, g…) y mensaje de error. */
export default function Campo({
  etiqueta,
  error,
  ayuda,
  sufijo,
  className = '',
  id: idPropuesto,
  ...props
}) {
  const idGenerado = useId()
  const id = idPropuesto ?? idGenerado

  return (
    <div className={className}>
      {etiqueta && (
        <label htmlFor={id} className="etiqueta-campo">
          {etiqueta}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          className={`campo ${sufijo ? 'pr-12' : ''} ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error || ayuda ? `${id}-desc` : undefined}
          {...props}
        />
        {sufijo && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
            {sufijo}
          </span>
        )}
      </div>

      {(error || ayuda) && (
        <p
          id={`${id}-desc`}
          className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}
        >
          {error || ayuda}
        </p>
      )}
    </div>
  )
}

export function Selector({ etiqueta, error, opciones = [], className = '', id: idPropuesto, ...props }) {
  const idGenerado = useId()
  const id = idPropuesto ?? idGenerado

  return (
    <div className={className}>
      {etiqueta && (
        <label htmlFor={id} className="etiqueta-campo">
          {etiqueta}
        </label>
      )}
      <select id={id} className={`campo ${error ? 'border-red-400' : ''}`} {...props}>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
