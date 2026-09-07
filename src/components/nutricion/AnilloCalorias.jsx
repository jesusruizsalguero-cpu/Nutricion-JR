import { entero } from '@/utils/formato'

const RADIO = 70
const GROSOR = 12
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/** Anillo de progreso de calorías con el restante en el centro. */
export default function AnilloCalorias({ consumidas = 0, meta = 0 }) {
  const proporcion = meta > 0 ? Math.min(consumidas / meta, 1) : 0
  const restante = Math.max(0, Math.round(meta - consumidas))
  const excedido = consumidas > meta && meta > 0

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 180 180"
        className="size-44"
        role="img"
        aria-label={`${entero(consumidas)} de ${entero(meta)} kilocalorías consumidas`}
      >
        <circle
          cx="90"
          cy="90"
          r={RADIO}
          fill="none"
          stroke="currentColor"
          strokeWidth={GROSOR}
          className="text-slate-200"
        />
        <circle
          cx="90"
          cy="90"
          r={RADIO}
          fill="none"
          stroke="currentColor"
          strokeWidth={GROSOR}
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - proporcion)}
          transform="rotate(-90 90 90)"
          className={`transition-all duration-500 ${
            excedido ? 'text-red-500' : 'text-marca-500'
          }`}
        />
      </svg>

      <div className="-mt-28 mb-14 text-center">
        <p className="text-3xl font-bold tabular-nums text-slate-900">
          {entero(excedido ? consumidas - meta : restante)}
        </p>
        <p className="text-xs font-medium text-slate-500">
          {excedido ? 'kcal de más' : 'kcal restantes'}
        </p>
      </div>

      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-900">{entero(consumidas)}</span> de{' '}
        {entero(meta)} kcal
      </p>
    </div>
  )
}
