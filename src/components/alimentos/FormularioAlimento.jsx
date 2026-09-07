import { useState } from 'react'
import Boton from '@/components/ui/Boton'
import Campo, { Selector } from '@/components/ui/Campo'
import { CATEGORIAS } from '@/services/alimentos'

const INICIAL = {
  nombre: '',
  marca: '',
  categoria: 'otros',
  unidadBase: 'g',
  kcal: '',
  proteinas: '',
  carbohidratos: '',
  grasas: '',
  fibra: '',
  azucares: '',
  sodio: '',
  porcionHabitual: 100,
  publico: false,
}

/** Alta de un alimento propio. Todos los valores se piden por 100 g / 100 ml. */
export default function FormularioAlimento({ alGuardar, alCancelar }) {
  const [datos, setDatos] = useState(INICIAL)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  function cambiar(campo, valor) {
    setDatos((previo) => ({ ...previo, [campo]: valor }))
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: null }))
  }

  function validar() {
    const nuevos = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.'
    if (datos.kcal === '' || Number(datos.kcal) < 0) nuevos.kcal = 'Indica las kcal por 100 g.'
    for (const macro of ['proteinas', 'carbohidratos', 'grasas']) {
      if (datos[macro] !== '' && Number(datos[macro]) < 0) nuevos[macro] = 'No puede ser negativo.'
    }
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!validar()) return

    setGuardando(true)
    try {
      await alGuardar(datos)
      setDatos(INICIAL)
    } catch (error) {
      console.error('[Alimentos] No se pudo crear:', error)
      setErrores({ general: 'No se pudo guardar el alimento. Inténtalo de nuevo.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo
        etiqueta="Nombre"
        value={datos.nombre}
        onChange={(e) => cambiar('nombre', e.target.value)}
        error={errores.nombre}
        placeholder="Pechuga de pollo a la plancha"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Campo
          etiqueta="Marca (opcional)"
          value={datos.marca}
          onChange={(e) => cambiar('marca', e.target.value)}
          placeholder="Hacendado"
        />
        <Selector
          etiqueta="Categoría"
          value={datos.categoria}
          onChange={(e) => cambiar('categoria', e.target.value)}
          opciones={CATEGORIAS.map((c) => ({ valor: c.id, etiqueta: c.etiqueta }))}
        />
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Valores por 100 {datos.unidadBase}
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Campo
            etiqueta="Calorías"
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={datos.kcal}
            onChange={(e) => cambiar('kcal', e.target.value)}
            error={errores.kcal}
            sufijo="kcal"
          />
          <Campo
            etiqueta="Proteínas"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={datos.proteinas}
            onChange={(e) => cambiar('proteinas', e.target.value)}
            error={errores.proteinas}
            sufijo="g"
          />
          <Campo
            etiqueta="Carbohidratos"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={datos.carbohidratos}
            onChange={(e) => cambiar('carbohidratos', e.target.value)}
            error={errores.carbohidratos}
            sufijo="g"
          />
          <Campo
            etiqueta="Grasas"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={datos.grasas}
            onChange={(e) => cambiar('grasas', e.target.value)}
            error={errores.grasas}
            sufijo="g"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Campo
            etiqueta="Fibra"
            type="number"
            min="0"
            step="0.1"
            value={datos.fibra}
            onChange={(e) => cambiar('fibra', e.target.value)}
            sufijo="g"
          />
          <Campo
            etiqueta="Azúcares"
            type="number"
            min="0"
            step="0.1"
            value={datos.azucares}
            onChange={(e) => cambiar('azucares', e.target.value)}
            sufijo="g"
          />
          <Campo
            etiqueta="Sodio"
            type="number"
            min="0"
            step="1"
            value={datos.sodio}
            onChange={(e) => cambiar('sodio', e.target.value)}
            sufijo="mg"
          />
        </div>
      </fieldset>

      <Campo
        etiqueta="Porción habitual"
        type="number"
        min="1"
        step="1"
        value={datos.porcionHabitual}
        onChange={(e) => cambiar('porcionHabitual', e.target.value)}
        sufijo={datos.unidadBase}
        ayuda="Cantidad que se propone por defecto al añadirlo al diario."
      />

      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={datos.publico}
          onChange={(e) => cambiar('publico', e.target.checked)}
          className="mt-0.5 size-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
        />
        <span>
          Compartir con el resto de usuarios
          <span className="block text-xs text-slate-500">
            Aparecerá en el catálogo público de alimentos.
          </span>
        </span>
      </label>

      {errores.general && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errores.general}</p>
      )}

      <div className="flex gap-3 pt-1">
        {alCancelar && (
          <Boton variante="secundario" anchoCompleto onClick={alCancelar}>
            Cancelar
          </Boton>
        )}
        <Boton type="submit" anchoCompleto cargando={guardando}>
          Guardar alimento
        </Boton>
      </div>
    </form>
  )
}
