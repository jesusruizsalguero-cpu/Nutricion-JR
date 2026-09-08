import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { entero } from '@/utils/formato'
import { calcularGastoTotal, precioAlimento, SUPERMERCADOS } from '@/utils/precios'

const GRUPOS = {
  proteina: 'Proteínas',
  lacteo: 'Lácteos y bebidas vegetales',
  carbohidrato: 'Cereales, pan y tubérculos',
  verdura: 'Verduras',
  fruta: 'Frutas',
  grasa: 'Aceites, frutos secos y semillas',
}

const formatoEuros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

/**
 * Cantidades de la semana, agrupadas por sección del supermercado, con el
 * precio de cada producto y el gasto total en el supermercado elegido.
 *
 * Solo Mercadona tiene un precio real (su tienda online tiene una API pública
 * sin clave, consultada producto a producto). Lidl, Dia y Supeco no tienen una
 * vía de acceso tan directa —Supeco directamente bloquea el acceso
 * automatizado—, así que sus precios son una referencia calculada a partir
 * del real de Mercadona con el ajuste medio que suelen dar los comparadores
 * de precios entre estas cadenas. Se avisa de ello en la propia pantalla.
 */
export default function ListaCompra({ items = [], dias = 7 }) {
  const [supermercado, setSupermercado] = useState('mercadona')

  const porGrupo = items.reduce((grupos, item) => {
    ;(grupos[item.rol] ??= []).push(item)
    return grupos
  }, {})

  const { total, sinPrecio } = useMemo(
    () => calcularGastoTotal(items, supermercado),
    [items, supermercado],
  )

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Cantidades para {dias} días. Los alimentos cocinados (arroz, pasta, legumbres) están en
        peso ya cocido: en crudo son aproximadamente un tercio.
      </p>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Supermercado">
        {Object.entries(SUPERMERCADOS).map(([id, { nombre }]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={supermercado === id}
            onClick={() => setSupermercado(id)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              supermercado === id
                ? 'bg-marca-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      {!SUPERMERCADOS[supermercado].real && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          El precio real solo se tiene de Mercadona. Este es un precio de{' '}
          <strong>referencia</strong>, calculado aplicando a Mercadona el ajuste medio (
          {formatoAjuste(SUPERMERCADOS[supermercado].ajuste)}) que suelen dar los comparadores
          entre esta cadena y {SUPERMERCADOS[supermercado].nombre}. No es un precio verificado
          tienda a tienda.
        </p>
      )}

      {Object.entries(GRUPOS).map(([rol, titulo]) => {
        const grupo = porGrupo[rol]
        if (!grupo?.length) return null

        return (
          <section key={rol}>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">{titulo}</h3>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {grupo.map((item) => {
                const precio = precioAlimento(item.id, item.gramos, supermercado)
                return (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0 truncate text-sm text-slate-800">{item.nombre}</span>
                    <span className="shrink-0 text-right text-sm">
                      <span className="font-medium tabular-nums text-slate-900">
                        {formatearCantidad(item.gramos)}
                      </span>
                      <span className="ml-2 tabular-nums text-slate-500">
                        {precio === null ? '—' : formatoEuros.format(precio)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <div className="tarjeta flex items-baseline justify-between">
        <div>
          <p className="font-semibold text-slate-900">
            Gasto total de la compra en {SUPERMERCADOS[supermercado].nombre}
          </p>
          {sinPrecio > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">
              {sinPrecio} {sinPrecio === 1 ? 'producto no tiene' : 'productos no tienen'} precio y
              no {sinPrecio === 1 ? 'entra' : 'entran'} en el total.
            </p>
          )}
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-marca-700">
          {formatoEuros.format(total)}
        </p>
      </div>
    </div>
  )
}

function formatearCantidad(gramos) {
  if (gramos >= 1000) return `${(gramos / 1000).toFixed(1).replace('.', ',')} kg`
  return `${entero(gramos)} g`
}

function formatoAjuste(ajuste) {
  const porcentaje = Math.round(ajuste * 100)
  return `${porcentaje > 0 ? '+' : ''}${porcentaje}%`
}
