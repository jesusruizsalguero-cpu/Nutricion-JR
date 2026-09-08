/**
 * Edición del plan de dieta a petición del asistente.
 *
 * El asistente decide *qué* cambiar, pero es este módulo el que lo aplica y el
 * que manda: valida contra el catálogo y contra las restricciones de salud del
 * usuario. Aunque el modelo se invente un alimento o proponga pan a un celíaco,
 * aquí se rechaza. El modelo propone; el código dispone.
 *
 * Cada operación devuelve `{ plan, descripcion }`. La descripción la redacta
 * este módulo con lo que ha pasado de verdad —no el modelo—, para que el
 * usuario nunca lea "ya te lo he cambiado" sobre algo que no ha ocurrido.
 */

import { ALIMENTOS, ALIMENTOS_POR_ID } from '@/data/alimentos'
import { avisosDe, construirFiltro, PATOLOGIAS, PREFERENCIAS } from '@/utils/salud'
import { escalarPorcion, COMIDAS_POR_ID, repartirEnComidas } from '@/utils/nutricion'
import {
  ajustarGramos,
  DIAS_SEMANA,
  recalcularDia,
  recalcularPlan,
  regenerarDia,
} from '@/utils/generadorDieta'
import { normalizar } from '@/utils/formato'

/** Error con un mensaje pensado para enseñárselo tal cual al usuario. */
export class ErrorEdicion extends Error {}

// ------------------------------------------------------------------ Acciones

/** Cambia un alimento de una comida por otro y recoloca los gramos. */
export function sustituirAlimento(
  plan,
  perfil,
  { dia, comida, quitar, poner, datos_nuevo: datosNuevo },
  propios = [],
) {
  const indiceDia = resolverDia(plan, dia)
  const diaActual = plan.dias[indiceDia]
  const indiceComida = resolverComida(diaActual, comida)
  const comidaActual = diaActual.comidas[indiceComida]

  const indiceAlimento = resolverAlimentoEnComida(comidaActual, quitar)
  const anterior = comidaActual.alimentos[indiceAlimento]

  // Si el alimento nuevo no está en la lista pero el asistente ha traído sus
  // valores, se da de alta sobre la marcha: así "cámbiame el yogur por kéfir"
  // se resuelve en un solo paso, sin dejar al usuario a medias.
  const nuevo = existe(poner, propios)
    ? resolverAlimentoDelCatalogo(poner, perfil, propios, anterior.rol)
    : datosNuevo
      ? comprobarApto(prepararAlimentoNuevo({ nombre: poner, ...datosNuevo }), perfil, propios)
      : resolverAlimentoDelCatalogo(poner, perfil, propios, anterior.rol)

  // Cambiar algo por sí mismo no es un cambio. Pasa cuando el usuario dice
  // "ponme otra cosa" y el modelo repite el alimento que ya estaba.
  if (nuevo.id === anterior.id) {
    throw new ErrorEdicion(
      `${anterior.nombre} es justo lo que ya tienes ahí. ` +
        alternativas(anterior.rol, perfil, propios),
    )
  }

  if (comidaActual.alimentos.some((a, i) => a.id === nuevo.id && i !== indiceAlimento)) {
    throw new ErrorEdicion(`${nuevo.nombre} ya está en esa comida.`)
  }

  // Los gramos no se copian del alimento anterior: se recalculan para que la
  // comida siga cuadrando con su objetivo de calorías y macros.
  const base = comidaActual.alimentos.map((alimento, i) =>
    i === indiceAlimento ? nuevo : alimentoDeCatalogo(alimento.id, propios),
  )
  const gramos = ajustarGramos(base, comidaActual.objetivo)

  const alimentos = base.map((alimento, i) => ({
    id: alimento.id,
    nombre: alimento.nombre,
    rol: alimento.rol,
    gramos: gramos[i],
    ...escalarPorcion(alimento, gramos[i]),
  }))

  const planNuevo = reemplazarComida(plan, perfil, indiceDia, indiceComida, alimentos)
  const comidaFinal = planNuevo.dias[indiceDia].comidas[indiceComida]

  return {
    plan: planNuevo,
    // Si se ha creado al vuelo, el hook lo guardará en la lista del usuario.
    alimentoCreado: nuevo.propio && !existe(nuevo.id, propios) ? nuevo : null,
    descripcion:
      `Hecho. En ${etiquetaComida(comidaActual)} del ${diaActual.nombre.toLowerCase()} he cambiado ` +
      `${anterior.nombre} (${anterior.gramos} g) por ${nuevo.nombre} (${comidaFinal.alimentos[indiceAlimento].gramos} g). ` +
      resumenDelDia(planNuevo.dias[indiceDia], planNuevo.metas),
  }
}

/** ¿Está ese alimento en la lista, ya sea de la app o del usuario? */
function existe(referencia, propios = []) {
  if (!referencia) return false
  const texto = clave(referencia)
  return [...propios, ...ALIMENTOS].some(
    (alimento) =>
      alimento.id === referencia || clave(alimento.id) === texto || clave(alimento.nombre) === texto,
  )
}

/** Un alimento creado al vuelo pasa por el mismo filtro de salud que el resto. */
function comprobarApto(alimento, perfil, propios) {
  if (!construirFiltro(perfil)(alimento)) {
    throw new ErrorEdicion(
      `${alimento.nombre} no encaja con lo que tienes declarado (${motivosDelPerfil(perfil)}), así que no te lo pongo. ` +
        alternativas(alimento.rol, perfil, propios),
    )
  }
  return alimento
}

/** Fija los gramos de un alimento concreto, sin tocar el resto de la comida. */
export function ajustarCantidad(plan, perfil, { dia, comida, alimento, gramos }, propios = []) {
  const cantidad = Math.round(Number(gramos))
  if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 2000) {
    throw new ErrorEdicion('Esa cantidad no tiene sentido. Dime unos gramos entre 1 y 2000.')
  }

  const indiceDia = resolverDia(plan, dia)
  const diaActual = plan.dias[indiceDia]
  const indiceComida = resolverComida(diaActual, comida)
  const comidaActual = diaActual.comidas[indiceComida]
  const indiceAlimento = resolverAlimentoEnComida(comidaActual, alimento)
  const anterior = comidaActual.alimentos[indiceAlimento]

  const alimentos = comidaActual.alimentos.map((item, i) =>
    i === indiceAlimento
      ? { ...item, gramos: cantidad, ...escalarPorcion(alimentoDeCatalogo(item.id, propios), cantidad) }
      : item,
  )

  const planNuevo = reemplazarComida(plan, perfil, indiceDia, indiceComida, alimentos)

  return {
    plan: planNuevo,
    descripcion:
      `Hecho. ${anterior.nombre} en ${etiquetaComida(comidaActual)} del ` +
      `${diaActual.nombre.toLowerCase()}: de ${anterior.gramos} g a ${cantidad} g. ` +
      resumenDelDia(planNuevo.dias[indiceDia], planNuevo.metas),
  }
}

/** Vuelve a montar un día entero desde cero. */
export function rehacerDia(plan, perfil, { dia }) { // los alimentos propios no entran en la regeneración automática
  const indiceDia = resolverDia(plan, dia)
  const planNuevo = regenerarDia(plan, indiceDia, perfil)

  return {
    plan: planNuevo,
    descripcion:
      `Hecho. He rehecho el ${planNuevo.dias[indiceDia].nombre.toLowerCase()} con otros alimentos. ` +
      resumenDelDia(planNuevo.dias[indiceDia], planNuevo.metas),
  }
}

/** Las acciones que el asistente puede pedir, por nombre de herramienta. */
export const ACCIONES = {
  sustituir_alimento: sustituirAlimento,
  ajustar_cantidad: ajustarCantidad,
  regenerar_dia: rehacerDia,
}

/**
 * Aplica una acción del asistente. Se valida aquí y no en el Worker porque el
 * catálogo y las reglas de salud viven en el cliente.
 */
export function aplicarAccion(plan, perfil, accion, propios = []) {
  const operacion = ACCIONES[accion?.nombre]
  if (!operacion) {
    throw new ErrorEdicion('No sé hacer ese cambio todavía.')
  }
  if (!plan) {
    throw new ErrorEdicion('Todavía no tienes una dieta que modificar. Créala en "Mi dieta".')
  }
  return operacion(plan, perfil, accion.argumentos ?? {}, propios)
}

// --------------------------------------------------------------- Resolutores

/**
 * Acepta "hoy", "mañana", un día de la semana o su índice. El modelo escribe
 * en lenguaje natural, así que conviene ser generoso al interpretarlo.
 */
export function resolverDia(plan, referencia) {
  const total = plan.dias.length
  if (referencia === undefined || referencia === null || referencia === '') return indiceDeHoy(total)

  if (typeof referencia === 'number' && Number.isInteger(referencia)) {
    if (referencia < 0 || referencia >= total) throw new ErrorEdicion('Ese día no está en tu plan.')
    return referencia
  }

  const texto = normalizar(String(referencia))
  if (['hoy', 'este dia', 'el de hoy'].includes(texto)) return indiceDeHoy(total)
  if (['manana', 'el dia siguiente'].includes(texto)) return (indiceDeHoy(total) + 1) % total

  const porNombre = plan.dias.findIndex((dia) => normalizar(dia.nombre) === texto)
  if (porNombre !== -1) return porNombre

  const enSemana = DIAS_SEMANA.findIndex((nombre) => normalizar(nombre) === texto)
  if (enSemana !== -1 && enSemana < total) return enSemana

  throw new ErrorEdicion(`No encuentro el día "${referencia}" en tu plan.`)
}

/** Acepta el id de la comida ("almuerzo") o su etiqueta ("Comida"). */
export function resolverComida(dia, referencia) {
  if (!referencia) throw new ErrorEdicion('Dime en qué comida quieres el cambio.')

  const texto = normalizar(String(referencia))
  const indice = dia.comidas.findIndex(
    (comida) => normalizar(comida.id) === texto || normalizar(comida.etiqueta) === texto,
  )
  if (indice !== -1) return indice

  // "comida" y "almuerzo" son la misma cosa según quién hable.
  const sinonimos = { comida: 'almuerzo', almuerzo: 'almuerzo', 'media manana': 'media_manana' }
  const alias = sinonimos[texto]
  const porAlias = alias ? dia.comidas.findIndex((comida) => comida.id === alias) : -1
  if (porAlias !== -1) return porAlias

  const disponibles = dia.comidas.map((c) => c.etiqueta).join(', ')
  throw new ErrorEdicion(`Ese día no tiene "${referencia}". Tienes: ${disponibles}.`)
}

/** Busca un alimento dentro de una comida por id o por nombre. */
export function resolverAlimentoEnComida(comida, referencia) {
  if (!referencia) throw new ErrorEdicion('Dime qué alimento quieres cambiar.')

  const texto = clave(referencia)
  const porId = comida.alimentos.findIndex(
    (alimento) => alimento.id === referencia || clave(alimento.id) === texto,
  )
  if (porId !== -1) return porId

  const porNombre = comida.alimentos.findIndex(
    (alimento) => clave(alimento.nombre) === texto || clave(alimento.nombre).includes(texto),
  )
  if (porNombre !== -1) return porNombre

  const disponibles = comida.alimentos.map((a) => a.nombre).join(', ')
  throw new ErrorEdicion(`Ahí no tienes ${referencia}. Esa comida lleva: ${disponibles}.`)
}

/**
 * Busca el alimento nuevo en el catálogo y comprueba que el usuario puede
 * comerlo. Esta es la validación importante: el modelo no decide si algo es
 * apto para una patología, lo decide el filtro de `salud.js`.
 */
export function resolverAlimentoDelCatalogo(referencia, perfil, propios = [], rolDeseado = null) {
  if (!referencia) throw new ErrorEdicion('Dime por qué alimento lo cambio.')

  const texto = clave(referencia)
  const todos = [...propios, ...ALIMENTOS]
  const encontrado =
    todos.find((alimento) => alimento.id === referencia) ??
    todos.find((alimento) => clave(alimento.id) === texto) ??
    todos.find((alimento) => clave(alimento.nombre) === texto) ??
    todos.find((alimento) => clave(alimento.nombre).includes(texto))

  // Un rechazo sin salida no sirve de nada: se ofrecen alternativas reales y
  // se recuerda que el alimento se puede dar de alta desde el propio chat.
  if (!encontrado) {
    throw new ErrorEdicion(
      `No tengo ${referencia} en mi lista de alimentos. Si me dices sus valores por 100 g ` +
        `(calorías, proteínas, hidratos y grasas) lo añado. ` +
        alternativas(rolDeseado, perfil, propios),
    )
  }

  const esApto = construirFiltro(perfil)
  if (!esApto(encontrado)) {
    throw new ErrorEdicion(
      `${encontrado.nombre} no encaja con lo que tienes declarado (${motivosDelPerfil(perfil)}), así que no te lo pongo. ` +
        alternativas(rolDeseado ?? encontrado.rol, perfil, propios),
    )
  }

  return encontrado
}

/** Unos cuantos alimentos aptos del mismo tipo, para que la respuesta tenga salida. */
function alternativas(rol, perfil, propios = [], cuantas = 5) {
  if (!rol) return ''

  const esApto = construirFiltro(perfil)
  const opciones = [...propios, ...ALIMENTOS]
    .filter((alimento) => alimento.rol === rol && esApto(alimento))
    .slice(0, cuantas)
    .map((alimento) => alimento.nombre)

  return opciones.length > 0 ? `También puedo poner: ${opciones.join(', ')}.` : ''
}

/**
 * Alimentos que el perfil admite, completos. Para la interfaz, que necesita
 * las kcal y el rango de ración de cada uno.
 */
export function alimentosPermitidos(perfil) {
  return ALIMENTOS.filter(construirFiltro(perfil))
}

/**
 * El mismo catálogo pero recortado a lo imprescindible, que es lo que se le
 * manda al asistente: cada campo de más son tokens en cada consulta.
 */
export function catalogoPermitido(perfil) {
  const esApto = construirFiltro(perfil)
  return ALIMENTOS.filter(esApto).map((alimento) => ({
    id: alimento.id,
    nombre: alimento.nombre,
    rol: alimento.rol,
  }))
}

// ---------------------------------------------------------------- Utilidades

function reemplazarComida(plan, perfil, indiceDia, indiceComida, alimentos) {
  const dias = plan.dias.map((dia, i) => {
    if (i !== indiceDia) return dia
    const comidas = dia.comidas.map((comida, j) =>
      j === indiceComida ? { ...comida, alimentos } : comida,
    )
    return recalcularDia({ ...dia, comidas })
  })

  return recalcularPlan({ ...plan, dias }, perfil)
}

function alimentoDeCatalogo(id, propios = []) {
  const alimento = ALIMENTOS_POR_ID[id] ?? propios.find((a) => a.id === id)
  if (!alimento) {
    throw new ErrorEdicion('Ese plan tiene un alimento que ya no está en mi lista.')
  }
  return alimento
}

function etiquetaComida(comida) {
  return (COMIDAS_POR_ID[comida.id]?.etiqueta ?? comida.etiqueta).toLowerCase()
}

function resumenDelDia(dia, metas) {
  const diferencia = dia.totales.kcal - (metas?.calorias ?? 0)
  const signo = diferencia > 0 ? '+' : ''
  return `El día queda en ${dia.totales.kcal} kcal (${signo}${diferencia} respecto a tu meta) y ${dia.totales.proteinas} g de proteína.`
}

function motivosDelPerfil(perfil) {
  const motivos = [
    ...(perfil?.patologias ?? []).map((clave) => PATOLOGIAS[clave]?.etiqueta),
    ...(perfil?.preferencias ?? []).map((clave) => PREFERENCIAS[clave]?.etiqueta),
  ].filter(Boolean)

  return motivos.length > 0 ? motivos.join(', ').toLowerCase() : 'tus restricciones'
}

/**
 * Texto comparable. El modelo mezcla nombres ("Kéfir casero") con estilo de
 * identificador ("kefir-casero"), así que se igualan guiones, guiones bajos y
 * espacios antes de comparar.
 */
function clave(texto) {
  return normalizar(String(texto))
    // El modelo a veces copia la línea entera del menú: se le quitan lo que
    // venga entre paréntesis y la cantidad final ("Yogur (yogur-soja) 250 g").
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+([.,]\d+)?\s*(g|gr|gramos|ml)\b/gi, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** El plan empieza en lunes; getDay() devuelve 0 para el domingo. */
function indiceDeHoy(totalDias) {
  return ((new Date().getDay() + 6) % 7) % totalDias
}

// -------------------------------------------------- Alimentos nuevos del chat

const ROLES_VALIDOS = ['proteina', 'carbohidrato', 'verdura', 'fruta', 'grasa', 'lacteo']

/** Ración por defecto de un alimento nuevo, según su papel en el plato. */
const RACION_POR_ROL = {
  proteina: { min: 80, max: 220, paso: 10 },
  carbohidrato: { min: 100, max: 320, paso: 20 },
  verdura: { min: 80, max: 250, paso: 25 },
  fruta: { min: 80, max: 250, paso: 25 },
  grasa: { min: 10, max: 40, paso: 5 },
  lacteo: { min: 100, max: 300, paso: 25 },
}

const ALERGENOS = ['gluten', 'lactosa', 'huevo', 'pescado', 'marisco', 'frutosSecos', 'soja']

/**
 * Convierte lo que dicta el asistente en un alimento utilizable.
 *
 * Los valores los da un modelo de lenguaje, así que se comprueban: rangos
 * posibles y, sobre todo, que las calorías cuadren con los macros. Si alguien
 * dice que algo tiene 50 kcal y 30 g de grasa, está inventando.
 */
export function prepararAlimentoNuevo(datos = {}) {
  const nombre = String(datos.nombre ?? '').trim()
  if (nombre.length < 2 || nombre.length > 60) {
    throw new ErrorEdicion('Necesito un nombre razonable para el alimento.')
  }

  const rol = ROLES_VALIDOS.includes(datos.rol) ? datos.rol : null
  if (!rol) {
    throw new ErrorEdicion(`No sé qué tipo de alimento es ${nombre}. Dime si es proteína, carbohidrato, verdura, fruta, grasa o lácteo.`)
  }

  const kcal = numero(datos.kcal, 'las calorías', 0, 900)
  const proteinas = numero(datos.proteinas, 'las proteínas', 0, 100)
  const carbohidratos = numero(datos.carbohidratos, 'los hidratos', 0, 100)
  const grasas = numero(datos.grasas, 'las grasas', 0, 100)

  // Las calorías tienen que salir de los macros: 4 por gramo de proteína e
  // hidratos, 9 por gramo de grasa. Se deja holgura por fibra y redondeos.
  const teoricas = proteinas * 4 + carbohidratos * 4 + grasas * 9
  const holgura = Math.max(50, teoricas * 0.3)
  if (Math.abs(kcal - teoricas) > holgura) {
    throw new ErrorEdicion(
      `Esos valores de ${nombre} no cuadran: con ${proteinas} g de proteína, ${carbohidratos} g de hidratos y ` +
        `${grasas} g de grasa saldrían unas ${Math.round(teoricas)} kcal, no ${kcal}. Compruébalos y me los repites.`,
    )
  }

  const contiene = Array.isArray(datos.contiene)
    ? datos.contiene.filter((ingrediente) => ALERGENOS.includes(ingrediente))
    : []

  return {
    id: `propio-${normalizar(nombre).replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    nombre,
    rol,
    origen: datos.origen === 'animal' ? 'carne' : 'vegetal',
    kcal,
    proteinas,
    carbohidratos,
    grasas,
    saturadas: 0,
    fibra: numero(datos.fibra ?? 0, 'la fibra', 0, 60),
    sodio: numero(datos.sodio ?? 0, 'el sodio', 0, 4000),
    contiene,
    ig: 'medio',
    purinas: 'bajo',
    potasio: 'medio',
    fodmap: 'bajo',
    racion: RACION_POR_ROL[rol],
    momentos: ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],
    propio: true,
  }
}

function numero(valor, etiqueta, minimo, maximo) {
  const cifra = Number(valor)
  if (!Number.isFinite(cifra) || cifra < minimo || cifra > maximo) {
    throw new ErrorEdicion(`Necesito ${etiqueta} por 100 g, entre ${minimo} y ${maximo}.`)
  }
  return Math.round(cifra * 10) / 10
}

// ------------------------------------------------- Edición manual del plan

/** Mete un alimento nuevo en una comida, con los gramos que se indiquen. */
export function anadirAlimento(plan, perfil, { dia, comida, alimento, gramos }, propios = []) {
  const cantidad = validarGramos(gramos)
  const indiceDia = resolverDia(plan, dia)
  const diaActual = plan.dias[indiceDia]
  const indiceComida = resolverComida(diaActual, comida)
  const comidaActual = diaActual.comidas[indiceComida]

  const nuevo = resolverAlimentoDelCatalogo(alimento, perfil, propios)
  if (comidaActual.alimentos.some((a) => a.id === nuevo.id)) {
    throw new ErrorEdicion(`${nuevo.nombre} ya está en esa comida.`)
  }

  const alimentos = [
    ...comidaActual.alimentos,
    {
      id: nuevo.id,
      nombre: nuevo.nombre,
      rol: nuevo.rol,
      gramos: cantidad,
      ...escalarPorcion(nuevo, cantidad),
    },
  ]

  const planNuevo = reemplazarComida(plan, perfil, indiceDia, indiceComida, alimentos)
  return {
    plan: planNuevo,
    alimentoCreado: nuevo.propio && !existe(nuevo.id, propios) ? nuevo : null,
    descripcion: `He añadido ${nuevo.nombre} (${cantidad} g) a ${etiquetaComida(comidaActual)} del ${diaActual.nombre.toLowerCase()}. ${resumenDelDia(planNuevo.dias[indiceDia], planNuevo.metas)}`,
  }
}

/** Saca un alimento de una comida. */
export function quitarAlimento(plan, perfil, { dia, comida, alimento }) {
  const indiceDia = resolverDia(plan, dia)
  const diaActual = plan.dias[indiceDia]
  const indiceComida = resolverComida(diaActual, comida)
  const comidaActual = diaActual.comidas[indiceComida]
  const indiceAlimento = resolverAlimentoEnComida(comidaActual, alimento)
  const quitado = comidaActual.alimentos[indiceAlimento]

  const alimentos = comidaActual.alimentos.filter((_, i) => i !== indiceAlimento)
  const planNuevo = reemplazarComida(plan, perfil, indiceDia, indiceComida, alimentos)

  return {
    plan: planNuevo,
    descripcion: `He quitado ${quitado.nombre} de ${etiquetaComida(comidaActual)} del ${diaActual.nombre.toLowerCase()}. ${resumenDelDia(planNuevo.dias[indiceDia], planNuevo.metas)}`,
  }
}

/**
 * Plan vacío con la estructura de días y comidas, pero sin alimentos, para
 * montarlo a mano desde "Crea tu dieta". Conserva los objetivos por comida,
 * así se puede ir viendo cuánto falta para cuadrar con las metas.
 */
export function crearPlanVacio({ perfil, metas, numeroComidas = 4, dias = 7, nombre }) {
  const estructura = repartirEnComidas(metas, numeroComidas)

  const diasVacios = Array.from({ length: dias }, (_, indice) => ({
    nombre: DIAS_SEMANA[indice % DIAS_SEMANA.length],
    comidas: estructura.map((comida) => ({
      id: comida.id,
      etiqueta: comida.etiqueta,
      icono: comida.icono,
      objetivo: comida.objetivo,
      alimentos: [],
      totales: { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0 },
    })),
    totales: { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0 },
  }))

  return recalcularPlan(
    {
      version: 1,
      semilla: `manual-${Date.now()}`,
      creadoEn: new Date().toISOString(),
      nombre: nombre ?? 'Mi dieta a medida',
      manual: true,
      numeroComidas,
      metas,
      resumen: {
        objetivo: perfil?.objetivo ?? null,
        deportes: perfil?.deportes ?? [],
        sesionesSemana: perfil?.sesionesSemana ?? 0,
        minutosSesion: perfil?.minutosSesion ?? 0,
        patologias: perfil?.patologias ?? [],
        preferencias: perfil?.preferencias ?? [],
      },
      avisos: avisosDe(perfil?.patologias),
      notasDeporte: [],
      cobertura: { escasos: [], suficiente: true },
      dias: diasVacios,
    },
    perfil,
  )
}

function validarGramos(gramos) {
  const cantidad = Math.round(Number(gramos))
  if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 2000) {
    throw new ErrorEdicion('Los gramos tienen que estar entre 1 y 2000.')
  }
  return cantidad
}
