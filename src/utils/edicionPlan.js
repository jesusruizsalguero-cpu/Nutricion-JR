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
import { construirFiltro, PATOLOGIAS, PREFERENCIAS } from '@/utils/salud'
import { escalarPorcion, COMIDAS_POR_ID } from '@/utils/nutricion'
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
export function sustituirAlimento(plan, perfil, { dia, comida, quitar, poner }) {
  const indiceDia = resolverDia(plan, dia)
  const diaActual = plan.dias[indiceDia]
  const indiceComida = resolverComida(diaActual, comida)
  const comidaActual = diaActual.comidas[indiceComida]

  const indiceAlimento = resolverAlimentoEnComida(comidaActual, quitar)
  const anterior = comidaActual.alimentos[indiceAlimento]
  const nuevo = resolverAlimentoDelCatalogo(poner, perfil)

  if (comidaActual.alimentos.some((a, i) => a.id === nuevo.id && i !== indiceAlimento)) {
    throw new ErrorEdicion(`${nuevo.nombre} ya está en esa comida.`)
  }

  // Los gramos no se copian del alimento anterior: se recalculan para que la
  // comida siga cuadrando con su objetivo de calorías y macros.
  const base = comidaActual.alimentos.map((alimento, i) =>
    i === indiceAlimento ? nuevo : alimentoDeCatalogo(alimento.id),
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
    descripcion:
      `Hecho. En ${etiquetaComida(comidaActual)} del ${diaActual.nombre.toLowerCase()} he cambiado ` +
      `${anterior.nombre} (${anterior.gramos} g) por ${nuevo.nombre} (${comidaFinal.alimentos[indiceAlimento].gramos} g). ` +
      resumenDelDia(planNuevo.dias[indiceDia], planNuevo.metas),
  }
}

/** Fija los gramos de un alimento concreto, sin tocar el resto de la comida. */
export function ajustarCantidad(plan, perfil, { dia, comida, alimento, gramos }) {
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
      ? { ...item, gramos: cantidad, ...escalarPorcion(alimentoDeCatalogo(item.id), cantidad) }
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
export function rehacerDia(plan, perfil, { dia }) {
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
export function aplicarAccion(plan, perfil, accion) {
  const operacion = ACCIONES[accion?.nombre]
  if (!operacion) {
    throw new ErrorEdicion('No sé hacer ese cambio todavía.')
  }
  if (!plan) {
    throw new ErrorEdicion('Todavía no tienes una dieta que modificar. Créala en "Mi dieta".')
  }
  return operacion(plan, perfil, accion.argumentos ?? {})
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

  const texto = normalizar(String(referencia))
  const porId = comida.alimentos.findIndex((alimento) => alimento.id === referencia)
  if (porId !== -1) return porId

  const porNombre = comida.alimentos.findIndex(
    (alimento) => normalizar(alimento.nombre) === texto || normalizar(alimento.nombre).includes(texto),
  )
  if (porNombre !== -1) return porNombre

  const disponibles = comida.alimentos.map((a) => a.nombre).join(', ')
  throw new ErrorEdicion(`En esa comida no hay "${referencia}". Hay: ${disponibles}.`)
}

/**
 * Busca el alimento nuevo en el catálogo y comprueba que el usuario puede
 * comerlo. Esta es la validación importante: el modelo no decide si algo es
 * apto para una patología, lo decide el filtro de `salud.js`.
 */
export function resolverAlimentoDelCatalogo(referencia, perfil) {
  if (!referencia) throw new ErrorEdicion('Dime por qué alimento lo cambio.')

  const texto = normalizar(String(referencia))
  const encontrado =
    ALIMENTOS_POR_ID[referencia] ??
    ALIMENTOS.find((alimento) => normalizar(alimento.nombre) === texto) ??
    ALIMENTOS.find((alimento) => normalizar(alimento.nombre).includes(texto))

  if (!encontrado) {
    throw new ErrorEdicion(`No tengo "${referencia}" en el catálogo de alimentos.`)
  }

  const esApto = construirFiltro(perfil)
  if (!esApto(encontrado)) {
    throw new ErrorEdicion(
      `${encontrado.nombre} no encaja con lo que tienes declarado (${motivosDelPerfil(perfil)}), así que no te lo pongo.`,
    )
  }

  return encontrado
}

/** Catálogo apto para el usuario, en el formato compacto que se envía al modelo. */
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

function alimentoDeCatalogo(id) {
  const alimento = ALIMENTOS_POR_ID[id]
  if (!alimento) {
    throw new ErrorEdicion('Ese plan tiene un alimento que ya no está en el catálogo.')
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

/** El plan empieza en lunes; getDay() devuelve 0 para el domingo. */
function indiceDeHoy(totalDias) {
  return ((new Date().getDay() + 6) % 7) % totalDias
}
