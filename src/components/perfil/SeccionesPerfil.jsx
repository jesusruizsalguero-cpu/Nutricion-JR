import Campo, { Selector } from '@/components/ui/Campo'
import { GrupoCasillas, GrupoRadio } from '@/components/ui/Opciones'
import { NIVELES_ACTIVIDAD, OBJETIVOS } from '@/utils/nutricion'
import { DEPORTES, PATOLOGIAS, PREFERENCIAS } from '@/utils/salud'

/**
 * Los bloques del perfil, compartidos por el asistente inicial y la pantalla
 * de perfil, para que las preguntas y las validaciones no se dupliquen.
 *
 * Cada sección recibe el perfil completo y una función `cambiar(campo, valor)`.
 */

export const PERFIL_VACIO = {
  sexo: 'hombre',
  fechaNacimiento: '',
  altura: '',
  peso: '',
  nivelActividad: 'ligero',
  deporte: 'ninguno',
  sesionesSemana: 3,
  minutosSesion: 60,
  objetivo: 'mantener',
  patologias: [],
  preferencias: [],
  numeroComidas: 4,
}

/** Valida los datos corporales. Devuelve un objeto de errores por campo. */
export function validarDatos(perfil) {
  const errores = {}
  if (!perfil.fechaNacimiento) errores.fechaNacimiento = 'Necesitamos tu fecha de nacimiento.'
  else {
    const edad = new Date().getFullYear() - new Date(perfil.fechaNacimiento).getFullYear()
    if (edad < 16) errores.fechaNacimiento = 'La app está pensada para mayores de 16 años.'
    if (edad > 110) errores.fechaNacimiento = 'Revisa la fecha de nacimiento.'
  }
  if (!perfil.altura || perfil.altura < 100 || perfil.altura > 250)
    errores.altura = 'Introduce una altura entre 100 y 250 cm.'
  if (!perfil.peso || perfil.peso < 30 || perfil.peso > 300)
    errores.peso = 'Introduce un peso entre 30 y 300 kg.'
  return errores
}

export function SeccionDatos({ perfil, cambiar, errores = {} }) {
  return (
    <div className="space-y-4">
      <Selector
        etiqueta="Sexo biológico"
        value={perfil.sexo}
        onChange={(e) => cambiar('sexo', e.target.value)}
        opciones={[
          { valor: 'hombre', etiqueta: 'Hombre' },
          { valor: 'mujer', etiqueta: 'Mujer' },
        ]}
      />
      <p className="-mt-2.5 text-xs text-slate-500">
        Solo se usa en la fórmula de Mifflin-St Jeor para estimar tu metabolismo basal.
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
    </div>
  )
}

export function SeccionActividad({ perfil, cambiar }) {
  const entrena = perfil.deporte !== 'ninguno'

  return (
    <div className="space-y-5">
      <GrupoRadio
        leyenda="Sin contar el deporte, ¿cómo es tu día a día?"
        valor={perfil.nivelActividad}
        onChange={(valor) => cambiar('nivelActividad', valor)}
        opciones={Object.entries(NIVELES_ACTIVIDAD).map(([valor, { etiqueta }]) => ({
          valor,
          etiqueta,
        }))}
      />

      <Selector
        etiqueta="¿Qué deporte practicas?"
        value={perfil.deporte}
        onChange={(e) => cambiar('deporte', e.target.value)}
        opciones={Object.entries(DEPORTES).map(([valor, { etiqueta }]) => ({ valor, etiqueta }))}
      />

      {entrena && (
        <div className="grid grid-cols-2 gap-3">
          <Campo
            etiqueta="Sesiones por semana"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            value={perfil.sesionesSemana}
            onChange={(e) => cambiar('sesionesSemana', Number(e.target.value))}
          />
          <Campo
            etiqueta="Duración media"
            type="number"
            inputMode="numeric"
            min={15}
            max={300}
            step={15}
            value={perfil.minutosSesion}
            onChange={(e) => cambiar('minutosSesion', Number(e.target.value))}
            sufijo="min"
          />
        </div>
      )}

      <p className="text-xs text-slate-500">
        Las calorías de los entrenamientos se calculan aparte y se reparten entre los siete días,
        en vez de inflar el factor de actividad.
      </p>
    </div>
  )
}

export function SeccionSalud({ perfil, cambiar }) {
  return (
    <div className="space-y-6">
      <GrupoCasillas
        leyenda="¿Tienes alguna de estas condiciones?"
        ayuda="Condicionan qué alimentos entran en el plan. Marca solo las diagnosticadas."
        opciones={Object.entries(PATOLOGIAS).map(([valor, { etiqueta, descripcion }]) => ({
          valor,
          etiqueta,
          descripcion,
        }))}
        valores={perfil.patologias}
        onChange={(valores) => cambiar('patologias', valores)}
      />

      <GrupoCasillas
        leyenda="Preferencias y alergias"
        opciones={Object.entries(PREFERENCIAS).map(([valor, { etiqueta }]) => ({
          valor,
          etiqueta,
        }))}
        valores={perfil.preferencias}
        onChange={(valores) => cambiar('preferencias', valores)}
      />

      <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
        Esta app no diagnostica ni sustituye a un profesional sanitario. Si tienes una patología,
        estás embarazada o tomas medicación, consulta el plan con tu médico o con un
        dietista-nutricionista antes de seguirlo.
      </p>
    </div>
  )
}

export function SeccionObjetivo({ perfil, cambiar }) {
  return (
    <div className="space-y-5">
      <GrupoRadio
        leyenda="¿Cuál es tu objetivo?"
        valor={perfil.objetivo}
        onChange={(valor) => cambiar('objetivo', valor)}
        opciones={Object.entries(OBJETIVOS).map(([valor, { etiqueta, descripcion }]) => ({
          valor,
          etiqueta,
          descripcion,
        }))}
      />

      <GrupoRadio
        leyenda="¿Cuántas comidas quieres hacer al día?"
        columnas={2}
        valor={perfil.numeroComidas}
        onChange={(valor) => cambiar('numeroComidas', valor)}
        opciones={[
          { valor: 3, etiqueta: '3 comidas', descripcion: 'Desayuno, comida y cena.' },
          { valor: 4, etiqueta: '4 comidas', descripcion: 'Con merienda.' },
          { valor: 5, etiqueta: '5 comidas', descripcion: 'Con media mañana y merienda.' },
        ]}
      />
    </div>
  )
}
