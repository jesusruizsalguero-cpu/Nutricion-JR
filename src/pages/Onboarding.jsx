import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Campo, { Selector } from '@/components/ui/Campo'
import { useAuth } from '@/hooks/useAuth'
import { guardarPerfil } from '@/services/usuarios'
import { calcularMetas, NIVELES_ACTIVIDAD, OBJETIVOS } from '@/utils/nutricion'
import { entero } from '@/utils/formato'

const PASOS = ['Sobre ti', 'Actividad', 'Objetivo']

/** Asistente inicial: recoge lo mínimo para poder calcular metas diarias. */
export default function Onboarding() {
  const { uid, datos } = useAuth()
  const navegar = useNavigate()

  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [perfil, setPerfil] = useState({
    sexo: 'hombre',
    fechaNacimiento: '',
    altura: '',
    peso: '',
    nivelActividad: 'moderado',
    objetivo: 'mantener',
  })

  function cambiar(campo, valor) {
    setPerfil((previo) => ({ ...previo, [campo]: valor }))
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: null }))
  }

  const perfilNumerico = useMemo(
    () => ({ ...perfil, altura: Number(perfil.altura), peso: Number(perfil.peso) }),
    [perfil],
  )
  const metas = useMemo(() => calcularMetas(perfilNumerico), [perfilNumerico])

  function validarPaso() {
    if (paso !== 0) return true
    const nuevos = {}
    if (!perfil.fechaNacimiento) nuevos.fechaNacimiento = 'Necesitamos tu fecha de nacimiento.'
    if (!perfil.altura || perfil.altura < 100 || perfil.altura > 250)
      nuevos.altura = 'Introduce una altura entre 100 y 250 cm.'
    if (!perfil.peso || perfil.peso < 30 || perfil.peso > 300)
      nuevos.peso = 'Introduce un peso entre 30 y 300 kg.'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  function siguiente() {
    if (!validarPaso()) return
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  async function finalizar() {
    setGuardando(true)
    try {
      await guardarPerfil(uid, perfilNumerico)
      navegar('/', { replace: true })
    } catch (error) {
      console.error('[Onboarding] No se pudo guardar el perfil:', error)
      setErrores({ general: 'No se pudo guardar. Inténtalo de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Hola, {datos?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Unas preguntas rápidas para calcular tus metas diarias.
          </p>
        </div>

        {/* Indicador de pasos */}
        <ol className="mb-6 flex items-center gap-2">
          {PASOS.map((etiqueta, indice) => (
            <li key={etiqueta} className="flex flex-1 flex-col gap-1.5">
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

        <div className="tarjeta space-y-4">
          {paso === 0 && (
            <>
              <Selector
                etiqueta="Sexo biológico"
                value={perfil.sexo}
                onChange={(e) => cambiar('sexo', e.target.value)}
                opciones={[
                  { valor: 'hombre', etiqueta: 'Hombre' },
                  { valor: 'mujer', etiqueta: 'Mujer' },
                ]}
              />
              <p className="-mt-2 text-xs text-slate-500">
                Se usa solo en la fórmula de Mifflin-St Jeor para estimar tu metabolismo basal.
              </p>

              <Campo
                etiqueta="Fecha de nacimiento"
                type="date"
                value={perfil.fechaNacimiento}
                onChange={(e) => cambiar('fechaNacimiento', e.target.value)}
                error={errores.fechaNacimiento}
                max={new Date().toISOString().split('T')[0]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Campo
                  etiqueta="Altura"
                  type="number"
                  inputMode="numeric"
                  value={perfil.altura}
                  onChange={(e) => cambiar('altura', e.target.value)}
                  error={errores.altura}
                  sufijo="cm"
                  placeholder="175"
                />
                <Campo
                  etiqueta="Peso actual"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={perfil.peso}
                  onChange={(e) => cambiar('peso', e.target.value)}
                  error={errores.peso}
                  sufijo="kg"
                  placeholder="70"
                />
              </div>
            </>
          )}

          {paso === 1 && (
            <fieldset>
              <legend className="etiqueta-campo">¿Cuánto te mueves a la semana?</legend>
              <div className="space-y-2">
                {Object.entries(NIVELES_ACTIVIDAD).map(([clave, { etiqueta }]) => (
                  <label
                    key={clave}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                      perfil.nivelActividad === clave
                        ? 'border-marca-500 bg-marca-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="actividad"
                      value={clave}
                      checked={perfil.nivelActividad === clave}
                      onChange={(e) => cambiar('nivelActividad', e.target.value)}
                      className="size-4 text-marca-600 focus:ring-marca-500"
                    />
                    <span className="text-sm text-slate-700">{etiqueta}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {paso === 2 && (
            <>
              <fieldset>
                <legend className="etiqueta-campo">¿Cuál es tu objetivo?</legend>
                <div className="space-y-2">
                  {Object.entries(OBJETIVOS).map(([clave, { etiqueta }]) => (
                    <label
                      key={clave}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                        perfil.objetivo === clave
                          ? 'border-marca-500 bg-marca-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="objetivo"
                        value={clave}
                        checked={perfil.objetivo === clave}
                        onChange={(e) => cambiar('objetivo', e.target.value)}
                        className="size-4 text-marca-600 focus:ring-marca-500"
                      />
                      <span className="text-sm text-slate-700">{etiqueta}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Tus metas diarias</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Dato etiqueta="kcal" valor={entero(metas.calorias)} destacado />
                  <Dato etiqueta="Prot." valor={`${entero(metas.proteinas)} g`} />
                  <Dato etiqueta="Carb." valor={`${entero(metas.carbohidratos)} g`} />
                  <Dato etiqueta="Grasa" valor={`${entero(metas.grasas)} g`} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Metabolismo basal {entero(metas.tmb)} kcal · gasto total{' '}
                  {entero(metas.gastoTotal)} kcal. Podrás ajustarlas en tu perfil.
                </p>
              </div>
            </>
          )}

          {errores.general && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errores.general}
            </p>
          )}

          <div className="flex gap-3 pt-2">
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
                Empezar
              </Boton>
            )}
          </div>
        </div>
      </div>
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
