/**
 * Cálculos nutricionales: metabolismo basal, gasto energético y reparto de macros.
 * Todas las fórmulas usan kg, cm y años.
 */

export const NIVELES_ACTIVIDAD = {
  sedentario: { etiqueta: 'Sedentario (poco o nada de ejercicio)', factor: 1.2 },
  ligero: { etiqueta: 'Ligero (1-3 días/semana)', factor: 1.375 },
  moderado: { etiqueta: 'Moderado (3-5 días/semana)', factor: 1.55 },
  intenso: { etiqueta: 'Intenso (6-7 días/semana)', factor: 1.725 },
  atleta: { etiqueta: 'Atleta (2 sesiones al día)', factor: 1.9 },
}

export const OBJETIVOS = {
  perder: { etiqueta: 'Perder grasa', ajuste: -0.2, proteinaPorKg: 2.0 },
  mantener: { etiqueta: 'Mantener peso', ajuste: 0, proteinaPorKg: 1.6 },
  ganar: { etiqueta: 'Ganar músculo', ajuste: 0.15, proteinaPorKg: 1.8 },
}

export const COMIDAS = [
  { id: 'desayuno', etiqueta: 'Desayuno', icono: '🌅', reparto: 0.25 },
  { id: 'almuerzo', etiqueta: 'Almuerzo', icono: '☀️', reparto: 0.35 },
  { id: 'cena', etiqueta: 'Cena', icono: '🌙', reparto: 0.3 },
  { id: 'snacks', etiqueta: 'Snacks', icono: '🍎', reparto: 0.1 },
]

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

/** Gasto energético total = TMB x factor de actividad. */
export function calcularGastoTotal(tmb, nivelActividad) {
  const nivel = NIVELES_ACTIVIDAD[nivelActividad] ?? NIVELES_ACTIVIDAD.sedentario
  return Math.round(tmb * nivel.factor)
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
 * Metas diarias a partir del perfil.
 * Proteína según objetivo (g/kg), grasa al 25% de las calorías, resto carbohidratos.
 * @returns {{calorias: number, proteinas: number, carbohidratos: number, grasas: number, agua: number, tmb: number, gastoTotal: number}}
 */
export function calcularMetas(perfil) {
  const { sexo, peso, altura, fechaNacimiento, nivelActividad, objetivo } = perfil ?? {}
  const edad = calcularEdad(fechaNacimiento)
  const tmb = calcularTMB({ sexo, peso, altura, edad })
  const gastoTotal = calcularGastoTotal(tmb, nivelActividad)

  const meta = OBJETIVOS[objetivo] ?? OBJETIVOS.mantener
  const calorias = Math.round(gastoTotal * (1 + meta.ajuste))

  const proteinas = Math.round((peso || 0) * meta.proteinaPorKg)
  const grasas = Math.round((calorias * 0.25) / KCAL_POR_GRAMO.grasas)
  const kcalRestantes =
    calorias - proteinas * KCAL_POR_GRAMO.proteinas - grasas * KCAL_POR_GRAMO.grasas
  const carbohidratos = Math.max(0, Math.round(kcalRestantes / KCAL_POR_GRAMO.carbohidratos))

  // Recomendación habitual: 35 ml por kg de peso corporal.
  const agua = Math.round((peso || 0) * 35)

  return { calorias, proteinas, carbohidratos, grasas, agua, tmb, gastoTotal }
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
    azucares: redondear((alimento.azucares ?? 0) * factor, 1),
    sodio: redondear((alimento.sodio ?? 0) * factor, 1),
  }
}

/** Suma los totales de una lista de items del diario. */
export function sumarTotales(items = []) {
  return items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + (item.kcal || 0),
      proteinas: acc.proteinas + (item.proteinas || 0),
      carbohidratos: acc.carbohidratos + (item.carbohidratos || 0),
      grasas: acc.grasas + (item.grasas || 0),
    }),
    { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
  )
}

/** Agrupa los items del diario por comida (desayuno, almuerzo, …). */
export function agruparPorComida(items = []) {
  const grupos = Object.fromEntries(COMIDAS.map((c) => [c.id, []]))
  for (const item of items) {
    if (grupos[item.comida]) grupos[item.comida].push(item)
    else grupos.snacks.push(item)
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

function redondear(valor, decimales = 0) {
  const factor = 10 ** decimales
  return Math.round((Number(valor) || 0) * factor) / factor
}
