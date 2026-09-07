import { entero } from '@/utils/formato'

/** Una comida del plan: sus alimentos con gramaje y el ajuste frente al objetivo. */
export default function ComidaPlan({ comida }) {
  const diferencia = comida.totales.kcal - comida.objetivo.kcal
  const desviada = Math.abs(diferencia) > comida.objetivo.kcal * 0.12

  return (
    <article className="tarjeta">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <span aria-hidden="true">{comida.icono}</span>
          {comida.etiqueta}
        </h3>
        <p className="text-sm tabular-nums text-slate-500">
          <span className="font-semibold text-slate-900">{entero(comida.totales.kcal)}</span> kcal
          <span className={`ml-1.5 text-xs ${desviada ? 'text-amber-600' : 'text-slate-400'}`}>
            (objetivo {entero(comida.objetivo.kcal)})
          </span>
        </p>
      </header>

      {comida.alimentos.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay alimentos compatibles con tus restricciones para esta comida.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {comida.alimentos.map((alimento) => (
            <li key={alimento.id} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0 text-sm text-slate-800">{alimento.nombre}</span>
              <span className="shrink-0 text-sm tabular-nums text-slate-500">
                <span className="font-medium text-slate-900">{entero(alimento.gramos)} g</span>
                <span className="ml-2 text-xs">{entero(alimento.kcal)} kcal</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs tabular-nums text-slate-500">
        P {entero(comida.totales.proteinas)} g · C {entero(comida.totales.carbohidratos)} g · G{' '}
        {entero(comida.totales.grasas)} g
      </p>
    </article>
  )
}
