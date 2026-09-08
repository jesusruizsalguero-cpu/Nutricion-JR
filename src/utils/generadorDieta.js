/**
 * Generador de dietas.
 *
 * Dadas las metas diarias y las restricciones del perfil, arma un plan de
 * varios días en dos fases:
 *
 *   1. Selección — cada comida se compone de "huecos" por rol (proteína,
 *      guarnición, verdura, grasa…). Para cada hueco se elige un alimento
 *      compatible, penalizando los usados hace poco para dar variedad.
 *
 *   2. Ajuste de cantidades — descenso por coordenadas sobre los gramos:
 *      se prueba subir o bajar cada alimento un paso y se acepta el cambio
 *      si acerca la comida a su objetivo de calorías y macros. Es un problema
 *      pequeño (3-4 alimentos por comida) y converge en milisegundos.
 *
 * Todo es determinista: la misma semilla produce el mismo plan, así que
 * regenerar es reproducible y el plan guardado se puede recalcular.
 */

import { ALIMENTOS } from '@/data/alimentos'
import { construirFiltro, avisosDe, combinarDeportes } from '@/utils/salud'
import { escalarPorcion, repartirEnComidas, sumarTotales } from '@/utils/nutricion'

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

/**
 * Composición de cada comida. Cada entrada es un hueco y la lista son los
 * roles admitidos, de más a menos preferente.
 */
const PLANTILLAS = {
  desayuno: [['lacteo', 'proteina'], ['carbohidrato'], ['fruta'], ['grasa']],
  media_manana: [['fruta'], ['lacteo', 'proteina'], ['grasa', 'carbohidrato']],
  almuerzo: [['proteina'], ['carbohidrato'], ['verdura'], ['grasa']],
  merienda: [['lacteo', 'fruta'], ['carbohidrato'], ['grasa']],
  cena: [['proteina'], ['verdura'], ['carbohidrato'], ['grasa']],
}

/**
 * Cuando una comida ligera tiene que aportar mucha proteína, no basta con el
 * lácteo: se añade un hueco extra de proteína (huevo, fiambre, queso…).
 */
const PROTEINA_QUE_PIDE_HUECO_EXTRA = 25

function plantillaPara(comidaId, objetivo) {
  const base = PLANTILLAS[comidaId] ?? PLANTILLAS.almuerzo
  const esLigera = ['desayuno', 'media_manana', 'merienda'].includes(comidaId)

  if (esLigera && objetivo.proteinas >= PROTEINA_QUE_PIDE_HUECO_EXTRA) {
    return [base[0], ['proteina', 'lacteo'], ...base.slice(1)]
  }
  return base
}

// Cuánto pesa cada objetivo al medir el error de una comida. La proteína y las
// calorías son lo que más condiciona el resultado; los otros dos macros se
// ajustan solos al ser el resto del reparto.
const PESOS = { kcal: 1.5, proteinas: 1.3, carbohidratos: 0.7, grasas: 0.7 }

/** Cuántas elecciones anteriores se recuerdan por rol para no repetir. */
const MEMORIA_VARIEDAD = 4

/**
 * @param {object} opciones
 * @param {object} opciones.perfil    perfil del usuario (patologías, preferencias, deporte…)
 * @param {object} opciones.metas     metas diarias ya calculadas
 * @param {number} [opciones.numeroComidas]
 * @param {number} [opciones.dias]
 * @param {string} [opciones.semilla] cualquier texto; misma semilla, mismo plan
 */
export function generarPlan({ perfil, metas, numeroComidas = 4, dias = 7, semilla }) {
  const semillaFinal = semilla ?? `${Date.now()}`
  const aleatorio = generadorAleatorio(semillaFinal)

  const esApto = construirFiltro(perfil)
  const catalogo = ALIMENTOS.filter(esApto)
  const porRol = agruparPorRol(catalogo)

  const estructura = repartirEnComidas(metas, numeroComidas)
  const recientes = new Map() // rol -> ids elegidos últimamente

  const diasGenerados = []
  for (let indice = 0; indice < dias; indice++) {
    const comidas = estructura.map((comida) =>
      construirComida(comida, porRol, recientes, aleatorio),
    )
    diasGenerados.push({
      nombre: DIAS_SEMANA[indice % DIAS_SEMANA.length],
      comidas,
      totales: redondearTotales(sumarTotales(comidas.map((c) => c.totales))),
    })
  }

  return {
    version: 1,
    semilla: semillaFinal,
    creadoEn: new Date().toISOString(),
    numeroComidas,
    metas,
    resumen: resumirPerfil(perfil),
    avisos: avisosDe(perfil?.patologias),
    notasDeporte: combinarDeportes(perfil?.deportes).notas,
    cobertura: evaluarCatalogo(porRol),
    dias: diasGenerados,
    listaCompra: construirListaCompra(diasGenerados),
    desviacion: medirDesviacion(diasGenerados, metas),
    alertas: revisarPlan(diasGenerados, perfil),
  }
}

/** Regenera un único día, respetando el resto del plan. */
export function regenerarDia(plan, indiceDia, perfil, semilla) {
  const aleatorio = generadorAleatorio(semilla ?? `${plan.semilla}-${indiceDia}-${Date.now()}`)
  const porRol = agruparPorRol(ALIMENTOS.filter(construirFiltro(perfil)))
  const estructura = repartirEnComidas(plan.metas, plan.numeroComidas)
  const recientes = new Map()

  const comidas = estructura.map((comida) => construirComida(comida, porRol, recientes, aleatorio))
  const dias = plan.dias.map((dia, i) =>
    i === indiceDia
      ? { ...dia, comidas, totales: redondearTotales(sumarTotales(comidas.map((c) => c.totales))) }
      : dia,
  )

  return {
    ...plan,
    dias,
    listaCompra: construirListaCompra(dias),
    desviacion: medirDesviacion(dias, plan.metas),
  }
}

/**
 * Rehace todo lo que se deriva de los días: lista de la compra, desviación
 * respecto a las metas y alertas. Hay que llamarlo después de cualquier
 * edición, o el plan queda diciendo cosas que ya no son ciertas.
 */
export function recalcularPlan(plan, perfil) {
  return {
    ...plan,
    listaCompra: construirListaCompra(plan.dias),
    desviacion: medirDesviacion(plan.dias, plan.metas),
    alertas: revisarPlan(plan.dias, perfil ?? { patologias: plan.resumen?.patologias ?? [] }),
  }
}

/** Totales de una comida y del día al que pertenece, tras tocar sus alimentos. */
export function recalcularDia(dia) {
  const comidas = dia.comidas.map((comida) => ({
    ...comida,
    totales: redondearTotales(sumarTotales(comida.alimentos)),
  }))

  return {
    ...dia,
    comidas,
    totales: redondearTotales(sumarTotales(comidas.map((c) => c.totales))),
  }
}

// --------------------------------------------------------------- Construcción

/** Cuántas combinaciones distintas se prueban antes de quedarse con una. */
const INTENTOS_POR_COMIDA = 6

/**
 * Monta una comida. No se queda con la primera combinación que sale: prueba
 * varias y conserva la que menos se desvía del objetivo, lo que además evita
 * proponer platos con demasiada sal.
 */
function construirComida(comida, porRol, recientes, aleatorio) {
  const plantilla = plantillaPara(comida.id, comida.objetivo)
  let mejor = null

  for (let intento = 0; intento < INTENTOS_POR_COMIDA; intento++) {
    const elegidos = seleccionar(plantilla, comida.id, porRol, recientes, aleatorio)
    if (elegidos.length === 0) continue

    const gramos = ajustarGramos(elegidos, comida.objetivo)
    const puntuacion =
      error(elegidos, gramos, comida.objetivo) + penalizacionSodio(elegidos, gramos)

    if (mejor === null || puntuacion < mejor.puntuacion) mejor = { elegidos, gramos, puntuacion }
  }

  if (mejor === null) {
    return {
      id: comida.id,
      etiqueta: comida.etiqueta,
      icono: comida.icono,
      objetivo: comida.objetivo,
      alimentos: [],
      totales: redondearTotales({}),
    }
  }

  // Solo la combinación ganadora cuenta para la variedad de los días siguientes.
  mejor.elegidos.forEach((alimento, i) => {
    const clave = claveDeHueco(plantilla[i] ?? [alimento.rol])
    const usados = recientes.get(clave) ?? []
    recientes.set(clave, [alimento.id, ...usados].slice(0, MEMORIA_VARIEDAD))
  })

  const alimentos = mejor.elegidos.map((alimento, i) => ({
    id: alimento.id,
    nombre: alimento.nombre,
    rol: alimento.rol,
    gramos: mejor.gramos[i],
    ...escalarPorcion(alimento, mejor.gramos[i]),
  }))

  return {
    id: comida.id,
    etiqueta: comida.etiqueta,
    icono: comida.icono,
    objetivo: comida.objetivo,
    alimentos,
    totales: redondearTotales(sumarTotales(alimentos)),
  }
}

/** Un alimento por hueco, evitando los usados en los días anteriores. */
function seleccionar(plantilla, comidaId, porRol, recientes, aleatorio) {
  const elegidos = []

  for (const roles of plantilla) {
    const candidatos = barajar(
      roles
        .flatMap((rol) => porRol[rol] ?? [])
        .filter((a) => a.momentos.includes(comidaId))
        .filter((a) => !elegidos.some((e) => e.id === a.id)),
      aleatorio,
    )
    if (candidatos.length === 0) continue

    const usados = recientes.get(claveDeHueco(roles)) ?? []
    elegidos.push(candidatos.find((a) => !usados.includes(a.id)) ?? candidatos[0])
  }

  return elegidos
}

function claveDeHueco(roles) {
  return roles.join('|')
}

/**
 * Empuja suavemente hacia combinaciones con menos sal. No es una restricción:
 * solo desempata cuando dos opciones cuadran igual de bien con los macros.
 */
function penalizacionSodio(alimentos, gramos) {
  const sodio = alimentos.reduce((suma, a, i) => suma + (a.sodio * gramos[i]) / 100, 0)
  const exceso = Math.max(0, sodio - 600) / 600
  return 0.05 * exceso * exceso
}

/**
 * Ajusta los gramos de cada alimento para acercar la comida a su objetivo.
 *
 * Primero se prueba con las raciones habituales. Si el objetivo no cabe dentro
 * de ellas —una dieta de 3.000 kcal no entra en raciones normales— se amplía
 * el rango por pasos, más en los alimentos que se comen a cucharadas que en
 * los que se comen a cucharaditas.
 */
export function ajustarGramos(alimentos, objetivo) {
  if (alimentos.length === 0) return []

  // Un error de ~0,01 equivale a quedarse a un 5% del objetivo en cada macro.
  const ERROR_ACEPTABLE = 0.01

  let mejor = null
  for (const holgura of [1, 1.5, 2.2, 3]) {
    const limites = alimentos.map((a) => limitesConHolgura(a, holgura))
    const gramos = optimizar(alimentos, limites, objetivo)
    const actual = error(alimentos, gramos, objetivo)

    if (mejor === null || actual < mejor.error) mejor = { gramos, error: actual }
    if (mejor.error <= ERROR_ACEPTABLE) break
  }

  return mejor.gramos
}

/**
 * Cuánto se puede estirar la ración de cada alimento antes de dejar de ser
 * un plato creíble. Un plato de arroz admite el doble; medio kilo de calabacín
 * o 200 g de pan, no. Prefiero desviarme algo de la meta a proponer raciones
 * que nadie se va a comer.
 */
const HOLGURA_POR_ROL = {
  proteina: 1.8,
  carbohidrato: 1.7,
  lacteo: 1.7,
  fruta: 1.7,
  verdura: 1.4,
  grasa: 1.4,
}

const HOLGURA_POR_ALIMENTO = {
  'pan-integral': 1.5,
  'pan-sin-gluten': 1.5,
  'pan-centeno': 1.5,
  'tortitas-maiz': 1.5,
  aceitunas: 1.2,
  'queso-curado': 1.3,
  'jamon-serrano': 1.3,
  'crema-cacahuete': 1.3,
  'chocolate-negro': 1.2,
}

function limitesConHolgura(alimento, holgura) {
  const { min, max, paso } = alimento.racion
  const tope = Math.min(
    holgura,
    HOLGURA_POR_ALIMENTO[alimento.id] ?? HOLGURA_POR_ROL[alimento.rol] ?? 2,
  )

  return {
    paso,
    // Hacia abajo se recorta poco: una ración ridícula tampoco es un plato.
    min: Math.max(paso, Math.round((min * (holgura > 1 ? 0.75 : 1)) / paso) * paso),
    max: Math.round((max * tope) / paso) * paso,
  }
}

/** Descenso por coordenadas: saltos grandes primero, luego afinado. */
function optimizar(alimentos, limites, objetivo) {
  let gramos = limites.map(({ min, max, paso }) =>
    acotarAlPaso(min + (max - min) * 0.45, { min, max, paso }),
  )
  let mejorError = error(alimentos, gramos, objetivo)

  for (const multiplicador of [8, 4, 2, 1]) {
    let mejoro = true
    let vueltas = 0

    while (mejoro && vueltas < 40) {
      mejoro = false
      vueltas++

      for (let i = 0; i < alimentos.length; i++) {
        const paso = limites[i].paso * multiplicador

        for (const delta of [paso, -paso]) {
          const candidato = [...gramos]
          candidato[i] = acotarAlPaso(gramos[i] + delta, limites[i])
          if (candidato[i] === gramos[i]) continue

          const nuevoError = error(alimentos, candidato, objetivo)
          if (nuevoError < mejorError - 1e-9) {
            gramos = candidato
            mejorError = nuevoError
            mejoro = true
          }
        }
      }
    }
  }

  return gramos
}

/** Error normalizado de una combinación frente al objetivo de la comida. */
function error(alimentos, gramos, objetivo) {
  const total = { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }

  for (let i = 0; i < alimentos.length; i++) {
    const factor = gramos[i] / 100
    total.kcal += alimentos[i].kcal * factor
    total.proteinas += alimentos[i].proteinas * factor
    total.carbohidratos += alimentos[i].carbohidratos * factor
    total.grasas += alimentos[i].grasas * factor
  }

  let suma = 0
  for (const [clave, peso] of Object.entries(PESOS)) {
    const meta = clave === 'kcal' ? objetivo.kcal : objetivo[clave]
    const referencia = Math.max(meta, 1)
    const desviacion = (total[clave] - meta) / referencia
    suma += peso * desviacion * desviacion
  }
  return suma
}

function acotarAlPaso(valor, { min, max, paso }) {
  const redondeado = Math.round(valor / paso) * paso
  return Math.min(max, Math.max(min, redondeado))
}

// ------------------------------------------------------------------- Derivados

/** Suma los gramos de cada alimento en todo el plan. */
function construirListaCompra(dias) {
  const acumulado = new Map()

  for (const dia of dias) {
    for (const comida of dia.comidas) {
      for (const alimento of comida.alimentos) {
        const previo = acumulado.get(alimento.id)
        if (previo) previo.gramos += alimento.gramos
        else
          acumulado.set(alimento.id, {
            id: alimento.id,
            nombre: alimento.nombre,
            rol: alimento.rol,
            gramos: alimento.gramos,
          })
      }
    }
  }

  return [...acumulado.values()].sort(
    (a, b) => a.rol.localeCompare(b.rol) || b.gramos - a.gramos,
  )
}

/** Desviación media diaria del plan respecto a las metas, en porcentaje. */
function medirDesviacion(dias, metas) {
  if (dias.length === 0) return null

  const medias = dias.reduce(
    (acc, dia) => ({
      kcal: acc.kcal + dia.totales.kcal / dias.length,
      proteinas: acc.proteinas + dia.totales.proteinas / dias.length,
      carbohidratos: acc.carbohidratos + dia.totales.carbohidratos / dias.length,
      grasas: acc.grasas + dia.totales.grasas / dias.length,
    }),
    { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
  )

  return {
    media: redondearTotales(medias),
    kcal: porcentajeDesviacion(medias.kcal, metas.calorias),
    proteinas: porcentajeDesviacion(medias.proteinas, metas.proteinas),
    carbohidratos: porcentajeDesviacion(medias.carbohidratos, metas.carbohidratos),
    grasas: porcentajeDesviacion(medias.grasas, metas.grasas),
  }
}

function porcentajeDesviacion(valor, meta) {
  if (!meta) return 0
  return Math.round(((valor - meta) / meta) * 100)
}

/**
 * Repasa el plan ya montado en busca de cosas que conviene decirle al usuario
 * aunque las metas cuadren: exceso de sodio, poca fibra o menús repetitivos.
 */
function revisarPlan(dias, perfil = {}) {
  if (dias.length === 0) return []

  const alertas = []
  const media = (campo) => dias.reduce((s, d) => s + d.totales[campo], 0) / dias.length

  const sodio = Math.round(media('sodio'))
  const topeSodio = perfil.patologias?.includes('hipertension') ? 1500 : 2300
  if (sodio > topeSodio) {
    alertas.push({
      tipo: 'sodio',
      texto: `El plan ronda los ${sodio} mg de sodio al día, por encima de los ${topeSodio} mg recomendados. Cocina sin sal añadida y enjuaga las conservas.`,
    })
  }

  const fibra = Math.round(media('fibra'))
  if (fibra < 25) {
    alertas.push({
      tipo: 'fibra',
      texto: `Se queda en unos ${fibra} g de fibra al día, por debajo de los 25-30 g recomendados. Añadir verdura o fruta extra a las comidas ligeras lo arregla.`,
    })
  }

  const patologiasDelicadas = ['renal', 'embarazo', 'diabetes2']
  if (perfil.patologias?.some((p) => patologiasDelicadas.includes(p))) {
    alertas.push({
      tipo: 'supervision',
      texto: 'Por tu situación clínica, este plan debería revisarlo un profesional sanitario antes de que lo sigas.',
    })
  }

  return alertas
}

/**
 * Comprueba que queden suficientes alimentos por rol tras aplicar las
 * restricciones. Con muy pocas opciones el plan sale repetitivo, y hay que
 * decirlo en vez de disimularlo.
 */
function evaluarCatalogo(porRol) {
  const minimos = { proteina: 4, carbohidrato: 3, verdura: 4, fruta: 3, grasa: 2, lacteo: 1 }
  const escasos = []

  for (const [rol, minimo] of Object.entries(minimos)) {
    const disponibles = porRol[rol]?.length ?? 0
    if (disponibles < minimo) escasos.push({ rol, disponibles, minimo })
  }

  return { escasos, suficiente: escasos.length === 0 }
}

function resumirPerfil(perfil = {}) {
  return {
    objetivo: perfil.objetivo ?? null,
    deportes: perfil.deportes ?? [],
    sesionesSemana: perfil.sesionesSemana ?? 0,
    minutosSesion: perfil.minutosSesion ?? 0,
    patologias: perfil.patologias ?? [],
    preferencias: perfil.preferencias ?? [],
  }
}

function agruparPorRol(alimentos) {
  return alimentos.reduce((grupos, alimento) => {
    ;(grupos[alimento.rol] ??= []).push(alimento)
    return grupos
  }, {})
}

function redondearTotales(totales) {
  return {
    kcal: Math.round(totales.kcal || 0),
    proteinas: Math.round(totales.proteinas || 0),
    carbohidratos: Math.round(totales.carbohidratos || 0),
    grasas: Math.round(totales.grasas || 0),
    fibra: Math.round(totales.fibra || 0),
    sodio: Math.round(totales.sodio || 0),
  }
}

// ------------------------------------------------------------------ Aleatorio

/** mulberry32: PRNG pequeño y determinista a partir de una semilla de texto. */
function generadorAleatorio(semilla) {
  let estado = 0
  for (let i = 0; i < semilla.length; i++) {
    estado = (estado * 31 + semilla.charCodeAt(i)) >>> 0
  }

  return function siguiente() {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function barajar(lista, aleatorio) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
