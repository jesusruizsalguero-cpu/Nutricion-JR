import { Plus, Trash2 } from 'lucide-react'
import { decimal, entero } from '@/utils/formato'
import { sumarTotales } from '@/utils/nutricion'

/** Una comida del día (desayuno, almuerzo…) con sus alimentos registrados. */
export default function TarjetaComida({ comida, items = [], alAgregar, alEliminar }) {
  const totales = sumarTotales(items)

  return (
    <section className="tarjeta p-0">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">
            {comida.icono}
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">{comida.etiqueta}</h3>
            <p className="text-xs text-slate-500">
              {items.length === 0
                ? 'Sin registrar'
                : `${entero(totales.kcal)} kcal · ${items.length} ${
                    items.length === 1 ? 'alimento' : 'alimentos'
                  }`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alAgregar(comida.id)}
          className="rounded-xl bg-marca-50 p-2 text-marca-700 transition-colors hover:bg-marca-100"
          aria-label={`Añadir alimento a ${comida.etiqueta}`}
        >
          <Plus className="size-5" />
        </button>
      </header>

      {items.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{item.nombre}</p>
                <p className="text-xs text-slate-500">
                  {decimal(item.gramos)} {item.unidad} · P {decimal(item.proteinas)} · C{' '}
                  {decimal(item.carbohidratos)} · G {decimal(item.grasas)}
                </p>
              </div>

              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                {entero(item.kcal)}
              </span>

              <button
                type="button"
                onClick={() => alEliminar(item.id)}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:text-red-600 lg:opacity-0 lg:group-hover:opacity-100"
                aria-label={`Eliminar ${item.nombre}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
