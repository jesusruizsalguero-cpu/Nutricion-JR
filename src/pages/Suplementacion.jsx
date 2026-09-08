import { useEffect, useMemo, useState } from 'react'
import { Pill, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import Cargando from '@/components/ui/Cargando'
import { useAuth } from '@/hooks/useAuth'
import * as suplementosService from '@/services/suplementos'
import { recomendarSuplementos } from '@/utils/suplementos'

/**
 * Suplementación: lo que la app propone según el perfil, más lo que el usuario
 * añada por su cuenta. Las recomendaciones no se guardan en ningún sitio; se
 * recalculan a partir del perfil, así que cambian solas si cambia el perfil.
 */
export default function Suplementacion() {
  const { uid, datos, metas } = useAuth()
  const perfil = datos?.perfil

  const [propios, setPropios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)

  useEffect(() => {
    if (!uid) return undefined
    return suplementosService.escucharSuplementos(
      uid,
      (lista) => {
        setPropios(lista)
        setCargando(false)
      },
      (e) => {
        console.error('[Suplementos] No se pudieron leer:', e)
        setError('No se han podido cargar tus suplementos.')
        setCargando(false)
      },
    )
  }, [uid])

  const recomendados = useMemo(() => recomendarSuplementos(perfil, metas), [perfil, metas])

  async function eliminar(suplementoId) {
    try {
      await suplementosService.eliminarSuplemento(uid, suplementoId)
    } catch (e) {
      console.error('[Suplementos] No se pudo eliminar:', e)
      setError('No se ha podido eliminar.')
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Pill className="size-5 text-marca-600" aria-hidden="true" />
          Suplementación
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Propuestas a partir de tu perfil, tu deporte y lo que has declarado en salud.
        </p>
      </header>

      <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Ningún suplemento sustituye a una dieta que ya funcione, y esto no es una prescripción.
        Antes de empezar con cualquiera, consúltalo con tu médico o tu farmacéutico —sobre todo si
        tomas medicación.
      </p>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">
          Para ti {recomendados.length > 0 && `(${recomendados.length})`}
        </h2>

        {recomendados.length === 0 ? (
          <p className="tarjeta text-sm text-slate-500">
            Con tu perfil actual no hay ninguno que merezca recomendarte. No es un fallo: la mayoría
            de la gente cubre sus necesidades con la comida.
          </p>
        ) : (
          recomendados.map((suplemento) => (
            <FichaRecomendado key={suplemento.id} suplemento={suplemento} />
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Los tuyos</h2>
          {!formularioAbierto && (
            <Boton
              variante="secundario"
              tamano="sm"
              icono={Plus}
              onClick={() => setFormularioAbierto(true)}
            >
              Añadir
            </Boton>
          )}
        </div>

        {formularioAbierto && (
          <FormularioSuplemento
            uid={uid}
            onCerrar={() => setFormularioAbierto(false)}
            onError={setError}
          />
        )}

        {cargando ? (
          <Cargando mensaje="Cargando tus suplementos…" />
        ) : propios.length === 0 && !formularioAbierto ? (
          <p className="tarjeta text-sm text-slate-500">
            Aquí puedes anotar los suplementos que ya tomas, con la pauta que sigas.
          </p>
        ) : (
          propios.map((suplemento) => (
            <FichaPropio key={suplemento.id} suplemento={suplemento} onEliminar={eliminar} />
          ))
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function FichaRecomendado({ suplemento }) {
  return (
    <article className="tarjeta">
      <h3 className="font-semibold text-slate-900">{suplemento.nombre}</h3>
      <p className="mt-1 text-sm text-slate-600">{suplemento.descripcion}</p>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Cuándo</dt>
          <dd className="text-slate-700">{suplemento.momento}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Por qué a ti
          </dt>
          <dd className="text-slate-700">{suplemento.motivo}</dd>
        </div>
      </dl>

      {suplemento.advertencia && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {suplemento.advertencia}
        </p>
      )}
    </article>
  )
}

function FichaPropio({ suplemento, onEliminar }) {
  return (
    <article className="tarjeta flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{suplemento.nombre}</h3>
        {suplemento.descripcion && (
          <p className="mt-1 text-sm text-slate-600">{suplemento.descripcion}</p>
        )}
        {suplemento.momento && (
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Cuándo:{' '}
            </span>
            {suplemento.momento}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onEliminar(suplemento.id)}
        aria-label={`Eliminar ${suplemento.nombre}`}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </article>
  )
}

function FormularioSuplemento({ uid, onCerrar, onError }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [momento, setMomento] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function guardar(evento) {
    evento.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)
    try {
      await suplementosService.crearSuplemento(uid, { nombre, descripcion, momento })
      onCerrar()
    } catch (e) {
      console.error('[Suplementos] No se pudo guardar:', e)
      onError('No se ha podido guardar el suplemento.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">Nuevo suplemento</h3>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cancelar"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <Campo
        etiqueta="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Colágeno con magnesio"
        maxLength={80}
        required
      />
      <Campo
        etiqueta="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Para las articulaciones"
        maxLength={200}
      />
      <Campo
        etiqueta="Cuándo lo tomas"
        value={momento}
        onChange={(e) => setMomento(e.target.value)}
        placeholder="Por la noche, antes de dormir"
        maxLength={120}
      />

      <div className="flex gap-2">
        <Boton type="submit" cargando={guardando} disabled={!nombre.trim()}>
          Guardar
        </Boton>
        <Boton type="button" variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}
