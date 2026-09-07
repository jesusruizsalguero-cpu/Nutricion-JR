import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import {
  PERFIL_VACIO,
  SeccionActividad,
  SeccionDatos,
  SeccionObjetivo,
  SeccionSalud,
  validarDatos,
} from '@/components/perfil/SeccionesPerfil'
import { useAuth } from '@/hooks/useAuth'
import { guardarPerfil } from '@/services/usuarios'
import { calcularMetas } from '@/utils/nutricion'
import { entero } from '@/utils/formato'

const PASOS = [
  { id: 'datos', etiqueta: 'Sobre ti' },
  { id: 'actividad', etiqueta: 'Actividad' },
  { id: 'salud', etiqueta: 'Salud' },
  { id: 'objetivo', etiqueta: 'Objetivo' },
]

/** Asistente inicial: recoge lo necesario para calcular metas y diseñar la dieta. */
export default function Onboarding() {
  const { uid, datos } = useAuth()
  const navegar = useNavigate()

  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [perfil, setPerfil] = useState(PERFIL_VACIO)

  function cambiar(campo, valor) {
    setPerfil((previo) => ({ ...previo, [campo]: valor }))
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: null }))
  }

  const perfilNumerico = useMemo(
    () => ({ ...perfil, altura: Number(perfil.altura), peso: Number(perfil.peso) }),
    [perfil],
  )
  const metas = useMemo(() => calcularMetas(perfilNumerico), [perfilNumerico])

  function siguiente() {
    if (paso === 0) {
      const nuevos = validarDatos(perfilNumerico)
      setErrores(nuevos)
      if (Object.keys(nuevos).length > 0) return
    }
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  async function finalizar() {
    setGuardando(true)
    try {
      await guardarPerfil(uid, perfilNumerico)
      navegar('/dieta', { replace: true })
    } catch (error) {
      console.error('[Onboarding] No se pudo guardar el perfil:', error)
      setErrores({ general: 'No se pudo guardar. Inténtalo de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Hola, {datos?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Unas preguntas para calcular tus necesidades y diseñar tu dieta.
          </p>
        </div>

        <ol className="mb-6 flex items-center gap-2">
          {PASOS.map(({ id, etiqueta }, indice) => (
            <li key={id} className="flex flex-1 flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  indice <= paso ? 'bg-marca-600' : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-xs ${
                  indice <= paso ? 'font-medium text-marca-700' : 'text-slate-400'
                }`}
              >
                {etiqueta}
              </span>
            </li>
          ))}
        </ol>

        <div className="tarjeta space-y-5">
          {paso === 0 && <SeccionDatos perfil={perfil} cambiar={cambiar} errores={errores} />}
          {paso === 1 && <SeccionActividad perfil={perfil} cambiar={cambiar} />}
          {paso === 2 && <SeccionSalud perfil={perfil} cambiar={cambiar} />}
          {paso === 3 && (
            <>
              <SeccionObjetivo perfil={perfil} cambiar={cambiar} />
              <ResumenMetas metas={metas} />
            </>
          )}

          {errores.general && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errores.general}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            {paso > 0 && (
              <Boton variante="secundario" icono={ArrowLeft} onClick={() => setPaso(paso - 1)}>
                Atrás
              </Boton>
            )}
            {paso < PASOS.length - 1 ? (
              <Boton anchoCompleto icono={ArrowRight} onClick={siguiente}>
                Continuar
              </Boton>
            ) : (
              <Boton anchoCompleto icono={Check} onClick={finalizar} cargando={guardando}>
                Crear mi dieta
              </Boton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResumenMetas({ metas }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">Tus metas diarias</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Dato etiqueta="kcal" valor={entero(metas.calorias)} destacado />
        <Dato etiqueta="Prot." valor={`${entero(metas.proteinas)} g`} />
        <Dato etiqueta="Carb." valor={`${entero(metas.carbohidratos)} g`} />
        <Dato etiqueta="Grasa" valor={`${entero(metas.grasas)} g`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Metabolismo basal {entero(metas.tmb)} kcal · gasto total {entero(metas.gastoTotal)} kcal
        {metas.kcalEntreno > 0 && `, de los que ${entero(metas.kcalEntreno)} kcal son de entrenar`}.
      </p>
      {metas.limitadaPorSeguridad && (
        <p className="mt-2 text-xs text-amber-700">
          Hemos subido las calorías hasta tu metabolismo basal: un déficit mayor no es seguro
          mantenerlo sin supervisión.
        </p>
      )}
    </div>
  )
}

function Dato({ etiqueta, valor, destacado = false }) {
  return (
    <div>
      <p
        className={`font-semibold tabular-nums ${
          destacado ? 'text-lg text-marca-700' : 'text-base text-slate-900'
        }`}
      >
        {valor}
      </p>
      <p className="text-[11px] text-slate-500">{etiqueta}</p>
    </div>
  )
}
