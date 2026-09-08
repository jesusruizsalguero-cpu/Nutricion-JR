import { useMemo, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import { entero } from '@/utils/formato'

/**
 * Una comida en modo edición: cambiar los gramos de cada alimento, quitarlos
 * y añadir otros del catálogo.
 *
 * Es el mismo componente para retocar una dieta ya generada y para montar una
 * desde cero en "Crea tu dieta": la diferencia es solo si la comida empieza
 * con alimentos o vacía.
 */
export default function EditorComida({ comida, catalogo, onAjustar, onQuitar, onAnadir }) {
  const [anadiendo, setAnadiendo] = useState(false)

  const diferencia = comida.totales.kcal - comida.objetivo.kcal
  const yaPuestos = new Set(comida.alimentos.map((a) => a.id))

  return (
    <article className="tarjeta">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <span aria-hidden="true">{comida.icono}</span>
          {comida.etiqueta}
        </h3>
        <p className="text-sm tabular-nums text-slate-500">
          <span className="font-semibold text-slate-900">{entero(comida.totales.kcal)}</span> de{' '}
          {entero(comida.objetivo.kcal)} kcal
          {comida.alimentos.length > 0 && (
            <span className={`ml-1.5 text-xs ${Math.abs(diferencia) > comida.objetivo.kcal * 0.12 ? 'text-amber-600' : 'text-slate-400'}`}>
              ({diferencia > 0 ? '+' : ''}
              {entero(diferencia)})
            </span>
          )}
        </p>
      </header>

      {comida.alimentos.length === 0 ? (
        <p className="py-2 text-sm text-slate-400">Sin alimentos todavía.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {comida.alimentos.map((alimento) => (
            <FilaAlimento
              key={alimento.id}
              alimento={alimento}
              onAjustar={(gramos) => onAjustar(alimento.id, gramos)}
              onQuitar={() => onQuitar(alimento.id)}
            />
          ))}
        </ul>
      )}

      {anadiendo ? (
        <SelectorAlimento
          catalogo={catalogo.filter((a) => !yaPuestos.has(a.id))}
          onAnadir={(alimentoId, gramos) => {
            onAnadir(alimentoId, gramos)
            setAnadiendo(false)
          }}
          onCancelar={() => setAnadiendo(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAnadiendo(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm
                     font-medium text-marca-700 hover:bg-marca-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir alimento
        </button>
      )}

      {comida.alimentos.length > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs tabular-nums text-slate-500">
          P {entero(comida.totales.proteinas)} g · C {entero(comida.totales.carbohidratos)} g · G{' '}
          {entero(comida.totales.grasas)} g
        </p>
      )}
    </article>
  )
}

/** Los gramos se editan en un campo aparte y se confirman, para no recalcular en cada tecla. */
function FilaAlimento({ alimento, onAjustar, onQuitar }) {
  const [editando, setEditando] = useState(false)
  const [gramos, setGramos] = useState(alimento.gramos)

  function confirmar(evento) {
    evento.preventDefault()
    const cantidad = Number(gramos)
    if (Number.isFinite(cantidad) && cantidad > 0 && cantidad !== alimento.gramos) {
      onAjustar(cantidad)
    }
    setEditando(false)
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 flex-1 text-sm text-slate-800">{alimento.nombre}</span>

      {editando ? (
        <form onSubmit={confirmar} className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={2000}
            value={gramos}
            onChange={(e) => setGramos(e.target.value)}
            autoFocus
            onFocus={(e) => e.target.select()}
            aria-label={`Gramos de ${alimento.nombre}`}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm tabular-nums
                       focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
          />
          <span className="text-xs text-slate-400">g</span>
          <button
            type="submit"
            aria-label="Confirmar"
            className="rounded-lg p-1 text-marca-600 hover:bg-marca-50"
          >
            <Check className="size-4" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setGramos(alimento.gramos); setEditando(true) }}
          className="rounded-lg px-2 py-1 text-sm tabular-nums hover:bg-slate-100"
        >
          <span className="font-medium text-slate-900">{entero(alimento.gramos)} g</span>
          <span className="ml-2 text-xs text-slate-500">{entero(alimento.kcal)} kcal</span>
        </button>
      )}

      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar ${alimento.nombre}`}
        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

const ROLES = {
  proteina: 'Proteínas',
  carbohidrato: 'Cereales y tubérculos',
  verdura: 'Verduras',
  fruta: 'Frutas',
  grasa: 'Grasas y frutos secos',
  lacteo: 'Lácteos y bebidas vegetales',
}

/** Buscador del catálogo con la cantidad, para añadir un alimento a la comida. */
function SelectorAlimento({ catalogo, onAnadir, onCancelar }) {
  const [busqueda, setBusqueda] = useState('')
  const [elegido, setElegido] = useState(null)
  const [gramos, setGramos] = useState('')

  const resultados = useMemo(() => {
    const texto = busqueda
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
    if (!texto) return catalogo.slice(0, 8)
    return catalogo
      .filter((a) =>
        a.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(texto),
      )
      .slice(0, 8)
  }, [busqueda, catalogo])

  function confirmar(evento) {
    evento.preventDefault()
    const cantidad = Number(gramos)
    if (!elegido || !Number.isFinite(cantidad) || cantidad <= 0) return
    onAnadir(elegido.id, cantidad)
  }

  return (
    <form onSubmit={confirmar} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">Añadir alimento</p>
        <button
          type="button"
          onClick={onCancelar}
          aria-label="Cancelar"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {elegido ? (
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{elegido.nombre}</span>
          <input
            type="number"
            min={1}
            max={2000}
            value={gramos}
            onChange={(e) => setGramos(e.target.value)}
            placeholder={`${elegido.racion.min}`}
            autoFocus
            aria-label="Gramos"
            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm tabular-nums
                       focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
          />
          <span className="text-xs text-slate-400">g</span>
          <Boton type="submit" tamano="sm" disabled={!gramos}>
            Añadir
          </Boton>
          <button
            type="button"
            onClick={() => setElegido(null)}
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en el catálogo…"
            autoFocus
            aria-label="Buscar alimento"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm
                       focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"
          />
          {resultados.length === 0 ? (
            <p className="px-1 py-2 text-xs text-slate-500">
              Nada con ese nombre. Los alimentos salen de USDA y BEDCA; puedes verlos todos en
              «De dónde salen los datos».
            </p>
          ) : (
            <ul className="max-h-56 divide-y divide-slate-200 overflow-y-auto rounded-lg bg-white">
              {resultados.map((alimento) => (
                <li key={alimento.id}>
                  <button
                    type="button"
                    onClick={() => { setElegido(alimento); setGramos(String(alimento.racion.min)) }}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0 text-sm text-slate-800">{alimento.nombre}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {ROLES[alimento.rol] ?? alimento.rol} · {alimento.kcal} kcal/100 g
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </form>
  )
}
