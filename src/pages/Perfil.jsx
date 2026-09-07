import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
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
import { calcularIMC, calcularMetas } from '@/utils/nutricion'
import { entero } from '@/utils/formato'

/**
 * Edición del perfil. Al guardar se recalculan las metas; la dieta se
 * regenera aparte, para no tirar el plan actual sin avisar.
 */
export default function Perfil() {
  const { uid, datos } = useAuth()

  const [perfil, setPerfil] = useState({ ...PERFIL_VACIO, ...(datos?.perfil ?? {}) })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  function cambiar(campo, valor) {
    setPerfil((previo) => ({ ...previo, [campo]: valor }))
    setGuardado(false)
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: null }))
  }

  const perfilNumerico = useMemo(
    () => ({ ...perfil, altura: Number(perfil.altura), peso: Number(perfil.peso) }),
    [perfil],
  )
  const metas = useMemo(() => calcularMetas(perfilNumerico), [perfilNumerico])
  const imc = useMemo(
    () => calcularIMC(perfilNumerico.peso, perfilNumerico.altura),
    [perfilNumerico],
  )

  async function guardar() {
    const nuevos = validarDatos(perfilNumerico)
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setGuardando(true)
    try {
      await guardarPerfil(uid, perfilNumerico)
      setGuardado(true)
    } catch (error) {
      console.error('[Perfil] No se pudo guardar:', error)
      setErrores({ general: 'No se pudo guardar. Inténtalo de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Mi perfil</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Al cambiar estos datos se recalculan tus metas. Genera la dieta de nuevo para que las
          use.
        </p>
      </header>

      <div className="tarjeta">
        <h2 className="mb-1 font-semibold text-slate-900">Metas con los datos actuales</h2>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Dato etiqueta="kcal" valor={entero(metas.calorias)} destacado />
          <Dato etiqueta="Proteínas" valor={`${entero(metas.proteinas)} g`} />
          <Dato etiqueta="Carbos" valor={`${entero(metas.carbohidratos)} g`} />
          <Dato etiqueta="Grasas" valor={`${entero(metas.grasas)} g`} />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Basal {entero(metas.tmb)} kcal · gasto {entero(metas.gastoTotal)} kcal · agua{' '}
          {(metas.agua / 1000).toFixed(1).replace('.', ',')} l
          {imc && ` · IMC ${imc.valor} (${imc.categoria.toLowerCase()})`}
        </p>
      </div>

      <Bloque titulo="Datos personales">
        <SeccionDatos perfil={perfil} cambiar={cambiar} errores={errores} />
      </Bloque>

      <Bloque titulo="Actividad y deporte">
        <SeccionActividad perfil={perfil} cambiar={cambiar} />
      </Bloque>

      <Bloque titulo="Salud y preferencias">
        <SeccionSalud perfil={perfil} cambiar={cambiar} />
      </Bloque>

      <Bloque titulo="Objetivo">
        <SeccionObjetivo perfil={perfil} cambiar={cambiar} />
      </Bloque>

      {errores.general && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errores.general}
        </p>
      )}

      <div className="sticky bottom-20 flex items-center gap-3 lg:bottom-4">
        <Boton icono={Save} onClick={guardar} cargando={guardando}>
          Guardar cambios
        </Boton>
        {guardado && (
          <span role="status" className="text-sm text-marca-700">
            Guardado.
          </span>
        )}
      </div>
    </div>
  )
}

function Bloque({ titulo, children }) {
  return (
    <section className="tarjeta">
      <h2 className="mb-4 font-semibold text-slate-900">{titulo}</h2>
      {children}
    </section>
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
