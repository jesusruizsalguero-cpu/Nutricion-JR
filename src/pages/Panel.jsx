import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Cargando from '@/components/ui/Cargando'
import ComidaPlan from '@/components/dieta/ComidaPlan'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { entero, mensajeErrorPlan } from '@/utils/formato'

/** Pantalla de inicio: lo que toca comer hoy según el plan activo. */
export default function Panel() {
  const { datos, metas } = useAuth()
  const { plan, cargando, trabajando, error, generar } = usePlan()

  const hoy = plan ? plan.dias[indiceDeHoy(plan.dias.length)] : null

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-900">
          Hola, {datos?.nombre?.split(' ')[0]} 👋
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 first-letter:uppercase">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </header>

      {metas && (
        <div className="tarjeta">
          <h2 className="mb-3 font-semibold text-slate-900">Tus metas de hoy</h2>

          <div className="grid grid-cols-4 gap-2 text-center">
            <Meta
              etiqueta="kcal"
              plan={hoy?.totales.kcal}
              meta={metas.calorias}
              destacado
            />
            <Meta etiqueta="Proteínas" plan={hoy?.totales.proteinas} meta={metas.proteinas} unidad="g" />
            <Meta
              etiqueta="Carbos"
              plan={hoy?.totales.carbohidratos}
              meta={metas.carbohidratos}
              unidad="g"
            />
            <Meta etiqueta="Grasas" plan={hoy?.totales.grasas} meta={metas.grasas} unidad="g" />
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {hoy
              ? 'Arriba, lo que aporta el menú de hoy; debajo, tu meta. El registro de lo que comes de verdad es la siguiente pieza por construir.'
              : `Objetivo diario calculado a partir de tu perfil, con ${(metas.agua / 1000)
                  .toFixed(1)
                  .replace('.', ',')} litros de agua.`}
          </p>
        </div>
      )}

      {cargando ? (
        <Cargando mensaje="Cargando tu plan…" />
      ) : !plan ? (
        <div className="tarjeta text-center">
          <p className="text-sm text-slate-600">
            Todavía no has diseñado tu dieta. Con tus datos serían{' '}
            <span className="font-semibold text-slate-900">{entero(metas?.calorias)} kcal</span> al
            día.
          </p>
          <div className="mt-4">
            <Boton
              icono={Sparkles}
              cargando={trabajando}
              onClick={() => generar({ numeroComidas: datos?.perfil?.numeroComidas ?? 4 })}
            >
              Diseñar mi dieta
            </Boton>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {mensajeErrorPlan(error)}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Menú de hoy · {hoy.nombre}</h2>
            <Link
              to="/dieta"
              className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline"
            >
              Ver la semana
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {hoy.comidas.map((comida) => (
              <ComidaPlan key={comida.id} comida={comida} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Lo que aporta el menú de hoy sobre la meta del día. */
function Meta({ etiqueta, plan, meta, unidad = '', destacado = false }) {
  return (
    <div>
      <p
        className={`font-semibold tabular-nums ${
          destacado ? 'text-lg text-marca-700' : 'text-base text-slate-900'
        }`}
      >
        {plan === undefined ? '—' : entero(plan)}
      </p>
      <p className="text-xs tabular-nums text-slate-400">
        de {entero(meta)} {unidad}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">{etiqueta}</p>
    </div>
  )
}

/** El plan empieza en lunes; getDay() devuelve 0 para el domingo. */
function indiceDeHoy(totalDias) {
  const diaSemana = (new Date().getDay() + 6) % 7
  return diaSemana % totalDias
}
