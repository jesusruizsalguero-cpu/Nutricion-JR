import { Link } from 'react-router-dom'
import { ArrowLeft, Database } from 'lucide-react'
import { ALIMENTOS } from '@/data/alimentos'

/**
 * De dónde sale cada número de la app. No es un adorno: si la dieta se calcula
 * con estos valores, hay que poder comprobar de qué alimento concreto de qué
 * base salen, porque «pechuga de pollo» no significa lo mismo cruda que asada.
 */
export default function Fuentes() {
  const porFuente = ALIMENTOS.reduce((cuenta, alimento) => {
    const clave = alimento.fuente ?? 'sin fuente'
    cuenta[clave] = (cuenta[clave] ?? 0) + 1
    return cuenta
  }, {})

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver
        </Link>

        <header>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Database className="size-5 text-marca-600" aria-hidden="true" />
            De dónde salen los datos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Los valores nutricionales de la app no son estimaciones propias: cada alimento está
            tomado de una de estas dos bases de composición de alimentos, y aquí puedes ver de
            cuál y con qué identificador.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <FichaFuente
            nombre="BEDCA"
            descripcion="Base de Datos Española de Composición de Alimentos, de la Agencia Española de Seguridad Alimentaria y Nutrición. Es la referencia para los alimentos tal y como se consumen en España."
            enlace="https://www.bedca.net"
            cuantos={porFuente.BEDCA ?? 0}
          />
          <FichaFuente
            nombre="USDA FoodData Central"
            descripcion="Base del Departamento de Agricultura de Estados Unidos. Se usa para los alimentos que BEDCA no recoge, como el tempeh o el edamame."
            enlace="https://fdc.nal.usda.gov"
            cuantos={porFuente.USDA ?? 0}
          />
        </div>

        <section className="tarjeta">
          <h2 className="mb-3 font-semibold text-slate-900">
            Los {ALIMENTOS.length} alimentos del catálogo
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-medium">Alimento</th>
                  <th className="py-2 pr-4 font-medium">Fuente</th>
                  <th className="py-2 pr-4 font-medium">Nombre en la base</th>
                  <th className="py-2 pr-4 text-right font-medium">kcal/100 g</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALIMENTOS.map((alimento) => (
                  <tr key={alimento.id}>
                    <td className="py-2 pr-4 font-medium text-slate-900">{alimento.nombre}</td>
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-600">
                      {alimento.fuente ?? '—'}
                      {alimento.fuenteId && (
                        <span className="ml-1 text-xs text-slate-400">#{alimento.fuenteId}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-500">{alimento.fuenteNombre ?? '—'}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                      {alimento.kcal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="pb-6 text-center text-xs text-slate-400">
          Los valores son por 100 g de producto en el estado que indica su nombre (crudo, cocido o
          asado). Cocinar cambia el peso, no los nutrientes totales.
        </p>
      </div>
    </div>
  )
}

function FichaFuente({ nombre, descripcion, enlace, cuantos }) {
  return (
    <article className="tarjeta">
      <h2 className="font-semibold text-slate-900">{nombre}</h2>
      <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
      <p className="mt-3 text-xs text-slate-500">
        {cuantos} {cuantos === 1 ? 'alimento' : 'alimentos'} ·{' '}
        <a
          href={enlace}
          target="_blank"
          rel="noreferrer"
          className="text-marca-700 underline hover:text-marca-800"
        >
          {enlace.replace('https://', '')}
        </a>
      </p>
    </article>
  )
}
