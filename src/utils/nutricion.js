/**
 * Cálculos nutricionales: metabolismo basal, gasto energético y reparto de
 * macronutrientes a partir del perfil completo (edad, peso, altura, deporte,
 * patologías y objetivo).
 *
 * Todas las fórmulas usan kg, cm y años.
 */

import { ajustesDe, DEPORTES, kcalDeEntrenamiento } from '@/utils/salud'

export const NIVELES_ACTIVIDAD = {
  sedentario: { etiqueta: 'Sedentario (trabajo sentado, sin ejercicio)', factor: 1.2 },
  ligero: { etiqueta: 'Ligero (de pie a ratos o paseos diarios)', factor: 1.375 },
  moderado: { etiqueta: 'Moderado (trabajo activo)', factor: 1.5 },
  intenso: { etiqueta: 'Intenso (trabajo físico exigente)', factor: 1.65 },
}

/**
 * Objetivos. `ajuste` es el porcentaje sobre el gasto total; `proteinaPorKg`
 * y `grasaPct` definen el reparto de macros antes de los ajustes por deporte
 * y patologías.
 */
export const OBJETIVOS = {
  perder: {
    etiqueta: 'Perder grasa',
    descripcion: 'Déficit moderado manteniendo la masa muscular.',
    ajuste: -0.2,
    proteinaPorKg: 2.0,
    grasaPct: 0.3,
  },
  ganar: {
    etiqueta: 'Ganar masa muscular',
    descripcion: 'Superávit contenido para crecer sin acumular grasa.',
    ajuste: 0.12,
    proteinaPorKg: 1.9,
    grasaPct: 0.25,
  },
  fondo: {
    etiqueta: 'Conseguir fondo físico',
    descripcion: 'Más hidratos para sostener el volumen de entrenamiento.',
    ajuste: 0.05,
    proteinaPorKg: 1.5,
    grasaPct: 0.22,
  },
  rendimiento: {
    etiqueta: 'Mejorar el rendimiento deportivo',
    descripcion: 'Energía suficiente y recuperación entre sesiones.',
    ajuste: 0.03,
    proteinaPorKg: 1.7,
    grasaPct: 0.25,
  },
  mantener: {
    etiqueta: 'Mantener el peso',
    descripcion: 'Comer según tu gasto, sin déficit ni superávit.',
    ajuste: 0,
    proteinaPorKg: 1.6,
    grasaPct: 0.28,
  },
  salud: {
    etiqueta: 'Comer mejor y cuidar la salud',
    descripcion: 'Reparto equilibrado, sin forzar el peso en ninguna dirección.',
    ajuste: 0,
    proteinaPorKg: 1.4,
    grasaPct: 0.3,
  },
}

/** Momentos del día. `reparto` se define en ESQUEMAS_COMIDAS según cuántas haya. */
export const COMIDAS = [
  { id: 'desayuno', etiqueta: 'Desayuno', icono: '🌅' },
  { id: 'media_manana', etiqueta: 'Media mañana', icono: '☕' },
  { id: 'almuerzo', etiqueta: 'Comida', icono: '☀️' },
  { id: 'merienda', etiqueta: 'Merienda', icono: '🍎' },
  { id: 'cena', etiqueta: 'Cena', icono: '🌙' },
]

export const COMIDAS_POR_ID = Object.fromEntries(COMIDAS.map((c) => [c.id, c]))

/** Reparto de las calorías del día según el número de comidas elegido. */
export const ESQUEMAS_COMIDAS = {
  3: [
    { id: 'desayuno', reparto: 0.3 },
    { id: 'almuerzo', reparto: 0.4 },
    { id: 'cena', reparto: 0.3 },
  ],
  4: [
    { id: 'desayuno', reparto: 0.25 },
    { id: 'almuerzo', reparto: 0.35 },
    { id: 'merienda', reparto: 0.12 },
    { id: 'cena', reparto: 0.28 },
  ],
  5: [
    { id: 'desayuno', reparto: 0.22 },
    { id: 'media_manana', reparto: 0.1 },
    { id: 'almuerzo', reparto: 0.33 },
    { id: 'merienda', reparto: 0.1 },
    { id: 'cena', reparto: 0.25 },
  ],
}

/** Kilocalorías por gramo de cada macronutriente. */
export const KCAL_POR_GRAMO = { proteinas: 4, carbohidratos: 4, grasas: 9 }

/**
 * Metabolismo basal — fórmula de Mifflin-St Jeor.
 * @param {{sexo: 'hombre'|'mujer', peso: number, altura: number, edad: number}} datos
 */
export function calcularTMB({ sexo, peso, altura, edad }) {
  if (!peso || !altura || !edad) return 0
  const base = 10 * peso + 6.25 * altura - 5 * edad
  return Math.round(sexo === 'hombre' ? base + 5 : base - 161)
}

/** Edad en años a partir de una fecha de nacimiento (ISO o Date). */
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0
  const nacimiento = new Date(fechaNacimiento)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

/**
 * Metas diarias a partir del perfil completo.
 *
 * Orden del cálculo:
 *   1. TMB (Mifflin-St Jeor) x factor de actividad de la vida diaria.
 *   2. + gasto real de los entrenamientos, prorrateado por día.
 *   3. + ajuste del objetivo y de las patologías.
 *   4. Suelo de seguridad: nunca por debajo del metabolismo basal.
 *   5. Reparto: proteína por kg, grasa como porcentaje, hidratos el resto.
 */
export function calcularMetas(perfil) {
  const {
    sexo,
    peso,
    altura,
    fechaNacimiento,
    nivelActividad,
    objetivo,
    deporte = 'ninguno',
    sesionesSemana = 0,
    minutosSesion = 0,
    patologias = [],
  } = perfil ?? {}

  const edad = calcularEdad(fechaNacimiento)
  const tmb = calcularTMB({ sexo, peso, altura, edad })
  const ajustes = ajustesDe(patologias)

  const factor = (NIVELES_ACTIVIDAD[nivelActividad] ?? NIVELES_ACTIVIDAD.sedentario).factor
  const kcalEntreno = kcalDeEntrenamiento({ deporte, sesionesSemana, minutosSesion, peso })
  const gastoTotal = Math.round(tmb * factor * (1 + (ajustes.factorGasto ?? 0)) + kcalEntreno)

  const meta = OBJETIVOS[objetivo] ?? OBJETIVOS.mantener
  const propuesta = Math.round(gastoTotal * (1 + meta.ajuste) + (ajustes.kcalExtra ?? 0))

  // Nunca por debajo del metabolismo basal: un déficit mayor no es sostenible
  // y compromete masa muscular y micronutrientes.
  const suelo = Math.max(tmb, sexo === 'mujer' ? 1200 : 1500)
  const calorias = Math.max(propuesta, suelo)
  const limitadaPorSeguridad = calorias > propuesta

  // Con obesidad, la proteína por kg de peso real se dispara: se usa el peso
  // correspondiente a un IMC de 25 como referencia.
  const pesoReferencia = pesoDeReferencia(peso, altura)

  const deporteDatos = DEPORTES[deporte] ?? DEPORTES.ninguno
  let proteinaPorKg =
    meta.proteinaPorKg + (deporteDatos.proteinaExtra ?? 0) + (ajustes.proteinaPorKg ?? 0)
  if (ajustes.proteinaMaxPorKg !== undefined) {
    proteinaPorKg = Math.min(proteinaPorKg, ajustes.proteinaMaxPorKg)
  }

  const proteinas = Math.round(pesoReferencia * proteinaPorKg)
  const grasaPct = acotar(meta.grasaPct + (ajustes.grasaPct ?? 0), 0.2, 0.35)
  let grasas = Math.round((calorias * grasaPct) / KCAL_POR_GRAMO.grasas)

  let carbohidratos = Math.max(
    0,
    Math.round(
      (calorias - proteinas * KCAL_POR_GRAMO.proteinas - grasas * KCAL_POR_GRAMO.grasas) /
        KCAL_POR_GRAMO.carbohidratos,
    ),
  )

  // Tope de hidratos (diabetes): lo que sobra se compensa con grasa saludable.
  if (ajustes.carbosMaxPct !== undefined) {
    const maximo = Math.round((calorias * ajustes.carbosMaxPct) / KCAL_POR_GRAMO.carbohidratos)
    if (carbohidratos > maximo) {
      const kcalSobrante = (carbohidratos - maximo) * KCAL_POR_GRAMO.carbohidratos
      carbohidratos = maximo
      grasas += Math.round(kcalSobrante / KCAL_POR_GRAMO.grasas)
    }
  }

  // 35 ml por kg, más medio litro por hora de entrenamiento.
  const horasEntrenoDia = (sesionesSemana * minutosSesion) / 60 / 7
  const agua = Math.round((peso || 0) * 35 + horasEntrenoDia * 500)

  return {
    calorias,
    proteinas,
    carbohidratos,
    grasas,
    agua,
    tmb,
    gastoTotal,
    kcalEntreno,
    proteinaPorKg: redondear(proteinaPorKg, 2),
    limitadaPorSeguridad,
  }
}

/** Peso usado para calcular la proteína: el real, o el de un IMC de 25 si hay obesidad. */
export function pesoDeReferencia(peso, alturaCm) {
  if (!peso || !alturaCm) return peso || 0
  const alturaM = alturaCm / 100
  const pesoIMC25 = 25 * alturaM * alturaM
  return peso > pesoIMC25 * 1.2 ? Math.round(pesoIMC25) : peso
}

/** Reparte las metas del día entre las comidas del esquema elegido. */
export function repartirEnComidas(metas, numeroComidas = 4) {
  const esquema = ESQUEMAS_COMIDAS[numeroComidas] ?? ESQUEMAS_COMIDAS[4]
  return esquema.map(({ id, reparto }) => ({
    id,
    reparto,
    etiqueta: COMIDAS_POR_ID[id].etiqueta,
    icono: COMIDAS_POR_ID[id].icono,
    objetivo: {
      kcal: Math.round(metas.calorias * reparto),
      proteinas: Math.round(metas.proteinas * reparto),
      carbohidratos: Math.round(metas.carbohidratos * reparto),
      grasas: Math.round(metas.grasas * reparto),
    },
  }))
}

/**
 * Escala los valores nutricionales de un alimento a la cantidad consumida.
 * Los alimentos se guardan siempre por 100 g / 100 ml.
 */
export function escalarPorcion(alimento, gramos) {
  const factor = (Number(gramos) || 0) / 100
  return {
    kcal: redondear(alimento.kcal * factor),
    proteinas: redondear(alimento.proteinas * factor, 1),
    carbohidratos: redondear(alimento.carbohidratos * factor, 1),
    grasas: redondear(alimento.grasas * factor, 1),
    fibra: redondear((alimento.fibra ?? 0) * factor, 1),
    sodio: redondear((alimento.sodio ?? 0) * factor, 1),
  }
}

/** Suma los totales de una lista de items (del diario o de un plan). */
export function sumarTotales(items = []) {
  return items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + (item.kcal || 0),
      proteinas: acc.proteinas + (item.proteinas || 0),
      carbohidratos: acc.carbohidratos + (item.carbohidratos || 0),
      grasas: acc.grasas + (item.grasas || 0),
      fibra: acc.fibra + (item.fibra || 0),
      sodio: acc.sodio + (item.sodio || 0),
    }),
    { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0 },
  )
}

/** Agrupa items por comida (desayuno, comida, …). Lo que no encaje va a merienda. */
export function agruparPorComida(items = []) {
  const grupos = Object.fromEntries(COMIDAS.map((c) => [c.id, []]))
  for (const item of items) {
    if (grupos[item.comida]) grupos[item.comida].push(item)
    else grupos.merienda.push(item)
  }
  return grupos
}

/** Índice de masa corporal y su categoría. */
export function calcularIMC(peso, alturaCm) {
  if (!peso || !alturaCm) return null
  const alturaM = alturaCm / 100
  const imc = peso / (alturaM * alturaM)
  return { valor: redondear(imc, 1), categoria: categoriaIMC(imc) }
}

function categoriaIMC(imc) {
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Peso normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

function acotar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

function redondear(valor, decimales = 0) {
  const factor = 10 ** decimales
  return Math.round((Number(valor) || 0) * factor) / factor
}
