import { entero } from '@/utils/formato'

const GRUPOS = {
  proteina: 'Proteínas',
  lacteo: 'Lácteos y bebidas vegetales',
  carbohidrato: 'Cereales, pan y tubérculos',
  verdura: 'Verduras',
  fruta: 'Frutas',
  grasa: 'Aceites, frutos secos y semillas',
}

/** Cantidades totales de la semana, agrupadas por sección del supermercado. */
export default function ListaCompra({ items = [], dias = 7 }) {
  const porGrupo = items.reduce((grupos, item) => {
    ;(grupos[item.rol] ??= []).push(item)
    return grupos
  }, {})

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Cantidades para {dias} días. Los alimentos cocinados (arroz, pasta, legumbres) están en
        peso ya cocido: en crudo son aproximadamente un tercio.
      </p>

      {Object.entries(GRUPOS).map(([rol, titulo]) => {
        const grupo = porGrupo[rol]
        if (!grupo?.length) return null

        return (
          <section key={rol}>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">{titulo}</h3>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {grupo.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-slate-800">{item.nombre}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-slate-900">
                    {formatearCantidad(item.gramos)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function formatearCantidad(gramos) {
  if (gramos >= 1000) return `${(gramos / 1000).toFixed(1).replace('.', ',')} kg`
  return `${entero(gramos)} g`
}
