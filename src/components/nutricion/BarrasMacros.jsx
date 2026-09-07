import { decimal, porcentaje } from '@/utils/formato'

const MACROS = [
  { clave: 'proteinas', etiqueta: 'Proteínas', color: 'bg-[var(--color-proteina)]' },
  { clave: 'carbohidratos', etiqueta: 'Carbohidratos', color: 'bg-[var(--color-carbo)]' },
  { clave: 'grasas', etiqueta: 'Grasas', color: 'bg-[var(--color-grasa)]' },
]

/** Tres barras de progreso, una por macronutriente. */
export default function BarrasMacros({ totales, metas, compacto = false }) {
  return (
    <div className={compacto ? 'space-y-2.5' : 'space-y-4'}>
      {MACROS.map(({ clave, etiqueta, color }) => {
        const consumido = totales?.[clave] ?? 0
        const meta = metas?.[clave] ?? 0
        const pct = porcentaje(consumido, meta)
        const excedido = meta > 0 && consumido > meta

        return (
          <div key={clave}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">{etiqueta}</span>
              <span className="tabular-nums text-slate-500">
                <span className={excedido ? 'font-semibold text-red-600' : 'text-slate-900'}>
                  {decimal(consumido)}
                </span>
                {meta > 0 && ` / ${decimal(meta)} g`}
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={etiqueta}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  excedido ? 'bg-red-500' : color
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
