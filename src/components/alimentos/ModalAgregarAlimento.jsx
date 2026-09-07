import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import Cargando from '@/components/ui/Cargando'
import { useAuth } from '@/hooks/useAuth'
import { buscarAlimentos } from '@/services/alimentos'
import { escalarPorcion, COMIDAS } from '@/utils/nutricion'
import { decimal, entero } from '@/utils/formato'

/**
 * Flujo en dos pasos: buscar un alimento y luego ajustar la cantidad.
 * La búsqueda se lanza con retardo para no consultar en cada tecla.
 */
export default function ModalAgregarAlimento({ abierto, alCerrar, comidaInicial, alGuardar }) {
  const { uid } = useAuth()
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [gramos, setGramos] = useState(100)
  const [comida, setComida] = useState(comidaInicial ?? 'desayuno')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (comidaInicial) setComida(comidaInicial)
  }, [comidaInicial])

  // Reinicia el estado cada vez que se abre.
  useEffect(() => {
    if (abierto) return
    setTermino('')
    setResultados([])
    setSeleccionado(null)
    setGramos(100)
  }, [abierto])

  useEffect(() => {
    if (!abierto || seleccionado) return undefined

    const temporizador = setTimeout(async () => {
      setBuscando(true)
      try {
        setResultados(await buscarAlimentos(termino, { uid }))
      } catch (error) {
        console.error('[Alimentos] Error al buscar:', error)
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)

    return () => clearTimeout(temporizador)
  }, [termino, abierto, seleccionado, uid])

  const previsualizacion = useMemo(
    () => (seleccionado ? escalarPorcion(seleccionado, gramos) : null),
    [seleccionado, gramos],
  )

  async function confirmar() {
    if (!seleccionado || !gramos) return
    setGuardando(true)
    try {
      await alGuardar({ alimento: seleccionado, gramos: Number(gramos), comida })
      alCerrar()
    } catch (error) {
      console.error('[Diario] No se pudo guardar el alimento:', error)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={seleccionado ? 'Ajustar cantidad' : 'Añadir alimento'}
    >
      {!seleccionado ? (
        <>
          <div className="relative mb-4">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              placeholder="Buscar: pollo, arroz, manzana…"
              className="campo pl-9"
              autoFocus
            />
          </div>

          {buscando && <Cargando />}

          {!buscando && resultados.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              {termino
                ? 'No se han encontrado alimentos con ese nombre.'
                : 'Escribe para buscar en el catálogo.'}
            </p>
          )}

          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {resultados.map((alimento) => (
              <li key={alimento.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSeleccionado(alimento)
                    setGramos(alimento.porcionHabitual || 100)
                  }}
                  className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {alimento.nombre}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {alimento.marca ? `${alimento.marca} · ` : ''}
                      {entero(alimento.kcal)} kcal / 100 {alimento.unidadBase || 'g'}
                    </p>
                  </div>
                  {!alimento.publico && (
                    <span className="shrink-0 rounded-full bg-marca-50 px-2 py-0.5 text-[10px] font-medium text-marca-700">
                      Mío
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{seleccionado.nombre}</p>
              <p className="text-xs text-slate-500">
                {entero(seleccionado.kcal)} kcal por 100 {seleccionado.unidadBase || 'g'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              aria-label="Elegir otro alimento"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo
              etiqueta="Cantidad"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={gramos}
              onChange={(e) => setGramos(e.target.value)}
              sufijo={seleccionado.unidadBase || 'g'}
            />

            <div>
              <label htmlFor="comida-destino" className="etiqueta-campo">
                Comida
              </label>
              <select
                id="comida-destino"
                value={comida}
                onChange={(e) => setComida(e.target.value)}
                className="campo"
              >
                {COMIDAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-slate-200 p-3 text-center">
            <Resumen etiqueta="kcal" valor={entero(previsualizacion.kcal)} />
            <Resumen etiqueta="Prot." valor={decimal(previsualizacion.proteinas)} />
            <Resumen etiqueta="Carb." valor={decimal(previsualizacion.carbohidratos)} />
            <Resumen etiqueta="Grasa" valor={decimal(previsualizacion.grasas)} />
          </div>

          <div className="mt-5 flex gap-3">
            <Boton variante="secundario" anchoCompleto onClick={() => setSeleccionado(null)}>
              Atrás
            </Boton>
            <Boton anchoCompleto onClick={confirmar} cargando={guardando} disabled={!gramos}>
              Añadir
            </Boton>
          </div>
        </>
      )}
    </Modal>
  )
}

function Resumen({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-base font-semibold tabular-nums text-slate-900">{valor}</p>
      <p className="text-[11px] text-slate-500">{etiqueta}</p>
    </div>
  )
}
