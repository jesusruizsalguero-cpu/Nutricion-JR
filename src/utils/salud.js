/**
 * Condicionantes del perfil que modifican la dieta: patologías, preferencias
 * alimentarias, alergias y deporte practicado.
 *
 * Cada patología declara de forma explícita cómo afecta al plan para que el
 * generador no tenga que conocer ninguna enfermedad en concreto:
 *
 *   excluye        predicado: true si el alimento NO puede entrar
 *   ajusteMacros   desplazamiento del reparto (grasaPct, proteinaPorKg, ...)
 *   limites        topes diarios que se comprueban al validar el plan
 *   aviso          texto que se muestra siempre junto al plan
 *
 * Nada de esto sustituye a un diagnóstico ni a un dietista-nutricionista:
 * son pautas generales de consenso, no una prescripción.
 */

export const PATOLOGIAS = {
  diabetes2: {
    etiqueta: 'Diabetes tipo 2',
    descripcion: 'Prioriza alimentos de índice glucémico bajo y reparte los hidratos.',
    excluye: (alimento) => alimento.ig === 'alto',
    ajusteMacros: { grasaPct: 0.03, carbosMaxPct: 0.45 },
    aviso:
      'El plan prioriza hidratos de índice glucémico bajo, pero cualquier cambio de dieta con diabetes debe revisarlo tu equipo médico, sobre todo si tomas medicación o insulina.',
  },
  hipertension: {
    etiqueta: 'Hipertensión arterial',
    descripcion: 'Limita el sodio siguiendo el enfoque de la dieta DASH.',
    excluye: (alimento) => alimento.sodio > 500,
    limites: { sodio: 2000 },
    aviso: 'Se han descartado los alimentos con más sodio y el plan apunta a menos de 2 g de sodio al día (unos 5 g de sal).',
  },
  colesterol: {
    etiqueta: 'Colesterol alto',
    descripcion: 'Reduce grasas saturadas y refuerza la fibra.',
    excluye: (alimento) => alimento.saturadas > 8,
    ajusteMacros: { grasaPct: -0.02 },
    aviso: 'Se han limitado los alimentos ricos en grasa saturada y se ha reforzado la fibra soluble.',
  },
  celiaquia: {
    etiqueta: 'Celiaquía',
    descripcion: 'Excluye por completo el gluten.',
    excluye: (alimento) => alimento.contiene.includes('gluten'),
    aviso: 'El plan es sin gluten, pero comprueba siempre el etiquetado: puede haber contaminación cruzada en productos procesados.',
  },
  intoleranciaLactosa: {
    etiqueta: 'Intolerancia a la lactosa',
    descripcion: 'Sustituye los lácteos por versiones sin lactosa o vegetales.',
    excluye: (alimento) => alimento.contiene.includes('lactosa'),
  },
  sii: {
    etiqueta: 'Síndrome de intestino irritable',
    descripcion: 'Evita alimentos altos en FODMAP.',
    excluye: (alimento) => alimento.fodmap === 'alto',
    aviso: 'La dieta baja en FODMAP está pensada como fase de prueba de unas semanas, no como dieta permanente. Conviene hacerla acompañado de un dietista.',
  },
  gota: {
    etiqueta: 'Gota o ácido úrico alto',
    descripcion: 'Reduce los alimentos ricos en purinas.',
    excluye: (alimento) => alimento.purinas === 'alto',
    aviso: 'Se han descartado los alimentos con más purinas. Mantén una buena hidratación y limita el alcohol.',
  },
  renal: {
    etiqueta: 'Enfermedad renal crónica',
    descripcion: 'Controla las proteínas y el potasio.',
    excluye: (alimento) => alimento.potasio === 'alto',
    ajusteMacros: { proteinaMaxPorKg: 0.8 },
    aviso:
      'La dieta en enfermedad renal depende del estadio y de tus analíticas: usa este plan solo como borrador y valídalo con tu nefrólogo o nefróloga antes de seguirlo.',
  },
  hipotiroidismo: {
    etiqueta: 'Hipotiroidismo',
    descripcion: 'Ajusta el gasto calórico y cuida el yodo.',
    ajusteMacros: { factorGasto: -0.05 },
    aviso: 'Separa unas horas el desayuno de la toma de levotiroxina y evita suplementos de soja o hierro cerca de la medicación.',
  },
  embarazo: {
    etiqueta: 'Embarazo o lactancia',
    descripcion: 'Añade energía y excluye alimentos de riesgo.',
    excluye: (alimento) =>
      ['jamon-serrano', 'salmon', 'atun-natural', 'queso-fresco'].includes(alimento.id),
    ajusteMacros: { kcalExtra: 350, proteinaPorKg: 0.2 },
    aviso:
      'En embarazo y lactancia las necesidades cambian mes a mes y hay alimentos de riesgo por listeria y mercurio. Este plan es orientativo: consúltalo con tu matrona o tu médico.',
  },
}

/** Preferencias y alergias: filtros duros sobre el catálogo. */
export const PREFERENCIAS = {
  vegetariano: {
    etiqueta: 'Vegetariano',
    excluye: (a) => ['carne', 'cerdo', 'pescado', 'marisco'].includes(a.origen),
  },
  vegano: {
    etiqueta: 'Vegano',
    excluye: (a) => a.origen !== 'vegetal',
  },
  sinCerdo: { etiqueta: 'Sin cerdo', excluye: (a) => a.origen === 'cerdo' },
  sinPescado: {
    etiqueta: 'Sin pescado ni marisco',
    excluye: (a) => ['pescado', 'marisco'].includes(a.origen),
  },
  sinHuevo: { etiqueta: 'Alergia al huevo', excluye: (a) => a.contiene.includes('huevo') },
  sinFrutosSecos: {
    etiqueta: 'Alergia a frutos secos',
    excluye: (a) => a.contiene.includes('frutosSecos'),
  },
  sinSoja: { etiqueta: 'Alergia a la soja', excluye: (a) => a.contiene.includes('soja') },
  sinGluten: { etiqueta: 'Sin gluten (por elección)', excluye: (a) => a.contiene.includes('gluten') },
  sinLactosa: { etiqueta: 'Sin lactosa (por elección)', excluye: (a) => a.contiene.includes('lactosa') },
}

/**
 * Deportes practicados (selección múltiple: el usuario puede marcar varios).
 * Ajustan el reparto de macros y suman el gasto real de los entrenamientos,
 * que el factor de actividad genérico estima muy por encima.
 *
 *   kcalPorHora   gasto aproximado por hora para una persona de 70 kg
 *   proteinaExtra g/kg que se suman a los de la meta del objetivo
 *   carboPct      reparto de hidratos recomendado sobre el total de calorías
 */
export const DEPORTES = {
  fuerza: {
    etiqueta: 'Fuerza o musculación',
    kcalPorHora: 380,
    proteinaExtra: 0.3,
    carboPct: 0.45,
    nota: 'Reparte la proteína entre todas las comidas y toma hidratos alrededor del entrenamiento.',
  },
  carrera: {
    etiqueta: 'Carrera o trail',
    kcalPorHora: 650,
    proteinaExtra: 0.1,
    carboPct: 0.55,
    nota: 'En tiradas de más de una hora conviene tomar hidratos durante el esfuerzo.',
  },
  ciclismo: {
    etiqueta: 'Ciclismo',
    kcalPorHora: 600,
    proteinaExtra: 0.1,
    carboPct: 0.58,
    nota: 'Las salidas largas requieren avituallamiento: 40-60 g de hidratos por hora.',
  },
  natacion: { etiqueta: 'Natación', kcalPorHora: 520, proteinaExtra: 0.15, carboPct: 0.52 },
  equipo: {
    etiqueta: 'Deporte de equipo (fútbol, baloncesto…)',
    kcalPorHora: 500,
    proteinaExtra: 0.15,
    carboPct: 0.52,
  },
  raqueta: { etiqueta: 'Pádel, tenis o similar', kcalPorHora: 450, proteinaExtra: 0.15, carboPct: 0.5 },
  combate: { etiqueta: 'Deportes de combate', kcalPorHora: 550, proteinaExtra: 0.25, carboPct: 0.48 },
  crossfit: { etiqueta: 'CrossFit o entrenamiento funcional', kcalPorHora: 500, proteinaExtra: 0.25, carboPct: 0.48 },
  yoga: { etiqueta: 'Yoga, pilates o movilidad', kcalPorHora: 220, proteinaExtra: 0, carboPct: null },
  caminar: { etiqueta: 'Caminar o senderismo', kcalPorHora: 280, proteinaExtra: 0, carboPct: null },
}

/**
 * Reúne todos los filtros que aplican al perfil en una sola función.
 * @returns {(alimento: object) => boolean} true si el alimento es apto
 */
export function construirFiltro({ patologias = [], preferencias = [] } = {}) {
  const reglas = [
    ...patologias.map((clave) => PATOLOGIAS[clave]?.excluye),
    ...preferencias.map((clave) => PREFERENCIAS[clave]?.excluye),
  ].filter(Boolean)

  return (alimento) => !reglas.some((excluye) => excluye(alimento))
}

/** Avisos de salud que deben acompañar siempre al plan generado. */
export function avisosDe(patologias = []) {
  return patologias
    .map((clave) => PATOLOGIAS[clave])
    .filter((p) => p?.aviso)
    .map((p) => ({ patologia: p.etiqueta, texto: p.aviso }))
}

/** Suma de los ajustes de macros que imponen las patologías seleccionadas. */
export function ajustesDe(patologias = []) {
  return patologias.reduce((acumulado, clave) => {
    const ajuste = PATOLOGIAS[clave]?.ajusteMacros
    if (!ajuste) return acumulado

    const nuevo = { ...acumulado }
    for (const [campo, valor] of Object.entries(ajuste)) {
      // Los topes se quedan con el más restrictivo; el resto se acumula.
      if (campo === 'proteinaMaxPorKg' || campo === 'carbosMaxPct') {
        nuevo[campo] = nuevo[campo] === undefined ? valor : Math.min(nuevo[campo], valor)
      } else {
        nuevo[campo] = (nuevo[campo] ?? 0) + valor
      }
    }
    return nuevo
  }, {})
}

/**
 * Reúne los deportes marcados en un único conjunto de cifras, porque las
 * sesiones y minutos del perfil son un total semanal, no por deporte.
 *
 *   kcalPorHora   media de los deportes elegidos (aproximación razonable sin
 *                 pedir cuánto tiempo dedica a cada uno)
 *   proteinaExtra el máximo de los elegidos: la necesidad de proteína no se
 *                 suma por practicar varios deportes a la vez, manda el que más pide
 *   notas         los avisos de cada deporte, para no perder ninguno
 */
export function combinarDeportes(deportes = []) {
  const validos = deportes.map((id) => DEPORTES[id]).filter(Boolean)

  if (validos.length === 0) {
    return { kcalPorHora: 0, proteinaExtra: 0, notas: [] }
  }

  return {
    kcalPorHora: validos.reduce((suma, d) => suma + d.kcalPorHora, 0) / validos.length,
    proteinaExtra: Math.max(...validos.map((d) => d.proteinaExtra)),
    notas: validos.map((d) => d.nota).filter(Boolean),
  }
}

/**
 * Gasto extra de los entrenamientos, repartido entre los siete días.
 * Se escala con el peso porque `kcalPorHora` está tabulado para 70 kg.
 */
export function kcalDeEntrenamiento({ deportes = [], sesionesSemana = 0, minutosSesion = 0, peso = 70 }) {
  const { kcalPorHora } = combinarDeportes(deportes)
  if (!kcalPorHora || !sesionesSemana || !minutosSesion) return 0

  const horasSemana = (sesionesSemana * minutosSesion) / 60
  const kcalSemana = kcalPorHora * horasSemana * ((peso || 70) / 70)
  return Math.round(kcalSemana / 7)
}
