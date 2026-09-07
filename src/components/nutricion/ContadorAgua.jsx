import { Droplet, Minus, Plus } from 'lucide-react'
import { entero, porcentaje } from '@/utils/formato'

const VASO_ML = 250

/** Contador de vasos de agua (250 ml cada uno). */
export default function ContadorAgua({ consumido = 0, meta = 2000, alCambiar }) {
  const vasos = Math.round(consumido / VASO_ML)
  const vasosMeta = Math.max(1, Math.round(meta / VASO_ML))
  const pct = porcentaje(consumido, meta)

  return (
    <div className="tarjeta">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="size-4 text-[var(--color-agua)]" />
          <h3 className="font-semibold text-slate-900">Agua</h3>
        </div>
        <span className="text-sm tabular-nums text-slate-500">
          {entero(consumido)} / {entero(meta)} ml
        </span>
      </div>

      <div
        className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de hidratación"
      >
        <div
          className="h-full rounded-full bg-[var(--color-agua)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1" aria-hidden="true">
          {Array.from({ length: Math.min(vasosMeta, 12) }, (_, i) => (
            <Droplet
              key={i}
              className={`size-5 ${
                i < vasos
                  ? 'fill-[var(--color-agua)] text-[var(--color-agua)]'
                  : 'text-slate-300'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => alCambiar(-VASO_ML)}
            disabled={consumido <= 0}
            className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Quitar un vaso de agua"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => alCambiar(VASO_ML)}
            className="rounded-lg bg-[var(--color-agua)] p-2 text-white hover:opacity-90"
            aria-label="Añadir un vaso de agua"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
