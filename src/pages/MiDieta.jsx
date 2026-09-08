import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Info,
  Pencil,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Cargando from '@/components/ui/Cargando'
import ComidaPlan from '@/components/dieta/ComidaPlan'
import EditorComida from '@/components/dieta/EditorComida'
import ListaCompra from '@/components/dieta/ListaCompra'
import BarrasMacros from '@/components/nutricion/BarrasMacros'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { entero, mensajeErrorPlan } from '@/utils/formato'
import { OBJETIVOS } from '@/utils/nutricion'
import { DEPORTES, PATOLOGIAS } from '@/utils/salud'
import { alimentosPermitidos } from '@/utils/edicionPlan'

/** Pantalla principal: el plan de comidas generado a partir del perfil. */
export default function MiDieta() {
  const { datos, metas } = useAuth()
  const { plan, cargando, trabajando, error, generar, cambiarDia, crearVacio, cambiarGramos, anadir, quitar } =
    usePlan()
  const [diaActivo, setDiaActivo] = useState(0)
  const [vista, setVista] = useState('plan')
  const [editando, setEditando] = useState(false)

  // Solo los alimentos que el perfil admite: así no se puede añadir a mano
  // algo que el generador nunca habría puesto.
  const catalogo = useMemo(() => alimentosPermitidos(datos?.perfil), [datos?.perfil])

  // Al cambiar de plan, volver al primer día evita quedarse en un índice viejo.
  useEffect(() => setDiaActivo(0), [plan?.id])

  if (cargando) return <Cargando mensaje="Cargando tu dieta…" />

  if (!plan) {
    return (
      <SinPlan
        perfil={datos?.perfil}
        metas={metas}
        trabajando={trabajando}
        error={error}
        onGenerar={() => generar({ numeroComidas: datos?.perfil?.numeroComidas ?? 4 })}
        onCrearVacio={() => crearVacio({ numeroComidas: datos?.perfil?.numeroComidas ?? 4 })}
      />
    )
  }

  const dia = plan.dias[diaActivo] ?? plan.dias[0]

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mi dieta</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {plan.dias.length} días · {plan.numeroComidas} comidas al día ·{' '}
            {OBJETIVOS[plan.resumen?.objetivo]?.etiqueta ?? 'Objetivo personalizado'}
          </p>
        </div>

        <Boton
          variante="secundario"
          icono={Sparkles}
          cargando={trabajando}
          onClick={() => generar({ numeroComidas: datos?.perfil?.numeroComidas ?? 4 })}
        >
          Generar otra
        </Boton>
      </header>

      <Avisos plan={plan} />

      <div className="tarjeta">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Media diaria del plan</h2>
          <p className="text-sm tabular-nums text-slate-500">
            <span className="font-semibold text-slate-900">{entero(plan.desviacion.media.kcal)}</span>{' '}
            de {entero(plan.metas.calorias)} kcal
            <Desviacion valor={plan.desviacion.kcal} />
          </p>
        </div>
        <div className="mt-4">
          <BarrasMacros totales={plan.desviacion.media} metas={plan.metas} compacto />
        </div>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Vista del plan">
        <Pestana activa={vista === 'plan'} onClick={() => setVista('plan')} icono={UtensilsCrossed}>
          Menús
        </Pestana>
        <Pestana
          activa={vista === 'compra'}
          onClick={() => setVista('compra')}
          icono={ShoppingBasket}
        >
          Lista de la compra
        </Pestana>
      </div>

      {vista === 'compra' ? (
        <ListaCompra items={plan.listaCompra} dias={plan.dias.length} />
      ) : (
        <>
          <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {plan.dias.map((d, indice) => (
              <button
                key={d.nombre}
                type="button"
                onClick={() => setDiaActivo(indice)}
                aria-current={indice === diaActivo ? 'true' : undefined}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  indice === diaActivo
                    ? 'bg-marca-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {d.nombre}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm tabular-nums text-slate-600">
              <span className="font-semibold text-slate-900">{entero(dia.totales.kcal)} kcal</span>{' '}
              · P {entero(dia.totales.proteinas)} g · C {entero(dia.totales.carbohidratos)} g · G{' '}
              {entero(dia.totales.grasas)} g · fibra {entero(dia.totales.fibra)} g
            </p>
            <div className="flex gap-2">
              <Boton
                variante={editando ? 'primario' : 'fantasma'}
                tamano="sm"
                icono={Pencil}
                onClick={() => setEditando((valor) => !valor)}
              >
                {editando ? 'Terminar' : 'Editar'}
              </Boton>
              {!editando && (
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  icono={RefreshCw}
                  cargando={trabajando}
                  onClick={() => cambiarDia(diaActivo)}
                >
                  Cambiar este día
                </Boton>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {dia.comidas.map((comida) =>
              editando ? (
                <EditorComida
                  key={comida.id}
                  comida={comida}
                  catalogo={catalogo}
                  onAjustar={(alimentoId, gramos) =>
                    cambiarGramos(dia.nombre, comida.id, alimentoId, gramos)
                  }
                  onQuitar={(alimentoId) => quitar(dia.nombre, comida.id, alimentoId)}
                  onAnadir={(alimentoId, gramos) =>
                    anadir(dia.nombre, comida.id, alimentoId, gramos)
                  }
                />
              ) : (
                <ComidaPlan key={comida.id} comida={comida} />
              ),
            )}
          </div>

          {editando && (
            <p className="text-center text-xs text-slate-400">
              Los cambios se guardan solos. Las cuentas del día y la lista de la compra se
              rehacen con cada cambio.
            </p>
          )}
        </>
      )}

      <p className="pt-2 text-center text-xs text-slate-400">
        Plan orientativo generado a partir de tus datos. No sustituye la valoración de un
        dietista-nutricionista.
      </p>
    </div>
  )
}

function SinPlan({ perfil, metas, trabajando, error, onGenerar, onCrearVacio }) {
  const deportes = (perfil?.deportes ?? []).map((d) => DEPORTES[d]?.etiqueta).filter(Boolean)
  const patologias = (perfil?.patologias ?? []).map((p) => PATOLOGIAS[p]?.etiqueta).filter(Boolean)

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <div className="mx-auto mb-4 w-fit rounded-2xl bg-marca-50 p-3">
        <UtensilsCrossed className="size-7 text-marca-600" aria-hidden="true" />
      </div>

      <h1 className="text-xl font-bold text-slate-900">Aún no tienes una dieta</h1>
      <p className="mt-2 text-sm text-slate-500">
        Vamos a montarla con tus datos: {entero(metas?.calorias)} kcal al día,{' '}
        {entero(metas?.proteinas)} g de proteína
        {deportes.length > 0 && `, ${deportes.join(' y ').toLowerCase()}`}
        {patologias.length > 0 && ` y ajustes por ${patologias.join(' y ').toLowerCase()}`}.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Boton icono={Sparkles} cargando={trabajando} onClick={onGenerar}>
          Diseñar mi dieta
        </Boton>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="h-px w-8 bg-slate-200" />o<span className="h-px w-8 bg-slate-200" />
        </div>

        <Boton variante="secundario" icono={Pencil} cargando={trabajando} onClick={onCrearVacio}>
          Crea tu dieta
        </Boton>
        <p className="max-w-xs text-xs text-slate-500">
          Empieza con los días y las comidas vacíos y ve poniendo tú los alimentos y los gramos.
        </p>

        <Link to="/perfil" className="mt-2 text-sm text-slate-500 underline hover:text-slate-700">
          Revisar mis datos antes
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {mensajeErrorPlan(error)}
        </p>
      )}
    </div>
  )
}

/** Avisos clínicos, alertas del plan y falta de variedad. */
function Avisos({ plan }) {
  const criticos = plan.alertas?.filter((a) => a.tipo === 'supervision') ?? []
  const informativos = [
    ...(plan.avisos ?? []).map((a) => ({ texto: a.texto, fuente: a.patologia })),
    ...(plan.alertas ?? []).filter((a) => a.tipo !== 'supervision').map((a) => ({ texto: a.texto })),
    ...(plan.notasDeporte ?? []).map((texto) => ({ texto, fuente: 'Entrenamiento' })),
  ]

  const escasos = plan.cobertura?.escasos ?? []

  return (
    <div className="space-y-2.5">
      {criticos.map((alerta) => (
        <Nota key={alerta.tipo} tono="alerta" icono={AlertTriangle} texto={alerta.texto} />
      ))}

      {escasos.length > 0 && (
        <Nota
          tono="alerta"
          icono={AlertTriangle}
          texto={`Con tus restricciones quedan pocos alimentos de ${escasos
            .map((e) => e.rol)
            .join(', ')}, así que el plan se repetirá más de lo deseable. Merece la pena revisarlo con un profesional.`}
        />
      )}

      {informativos.map((nota, indice) => (
        <Nota key={indice} tono="info" icono={Info} texto={nota.texto} fuente={nota.fuente} />
      ))}
    </div>
  )
}

function Nota({ tono, icono: Icono, texto, fuente }) {
  const estilos =
    tono === 'alerta'
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : 'bg-slate-50 text-slate-600 border-slate-200'

  return (
    <div className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-xs ${estilos}`}>
      <Icono className="mt-px size-4 shrink-0" aria-hidden="true" />
      <p>
        {fuente && <span className="font-semibold">{fuente}: </span>}
        {texto}
      </p>
    </div>
  )
}

function Desviacion({ valor }) {
  if (valor === 0) return null
  return (
    <span className={`ml-1.5 text-xs ${Math.abs(valor) > 8 ? 'text-amber-600' : 'text-slate-400'}`}>
      ({valor > 0 ? '+' : ''}
      {valor}%)
    </span>
  )
}

function Pestana({ activa, onClick, icono: Icono, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
        activa ? 'bg-white text-marca-700 ring-1 ring-marca-200' : 'text-slate-500 hover:bg-white/60'
      }`}
    >
      <Icono className="size-4" aria-hidden="true" />
      {children}
    </button>
  )
}
