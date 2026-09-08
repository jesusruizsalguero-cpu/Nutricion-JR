import PRECIOS from '@/data/precios-alimentos.json'

/**
 * Precios de la lista de la compra.
 *
 * Solo Mercadona tiene un precio real: su tienda online tiene una API
 * pública y sin clave, que se consultó producto a producto para generar
 * src/data/precios-alimentos.json (ver scripts/generar-precios.mjs).
 *
 * Lidl y Dia no tienen una vía sencilla de acceso —habría que raspar su web,
 * algo frágil que se rompe con cualquier cambio de diseño—, y Supeco bloquea
 * activamente el acceso automatizado. Para esos tres se calcula un precio de
 * REFERENCIA a partir del real de Mercadona, con el ajuste porcentual medio
 * que suelen dar los comparadores de precios (OCU y similares) entre estas
 * cadenas. No es un precio verificado tienda a tienda: es una estimación con
 * el método a la vista, y así se indica en la interfaz.
 */
export const SUPERMERCADOS = {
  mercadona: { nombre: 'Mercadona', real: true },
  lidl: { nombre: 'Lidl', real: false, ajuste: -0.05 },
  dia: { nombre: 'Dia', real: false, ajuste: -0.03 },
  supeco: { nombre: 'Supeco', real: false, ajuste: -0.12 },
}

/**
 * Precio de un alimento en un supermercado, para la cantidad indicada.
 * Devuelve null si Mercadona no tiene ese alimento (pasa con tofu, tempeh,
 * seitán y edamame): sin precio real no hay base sobre la que estimar el
 * resto, así que no se inventa ningún número.
 */
export function precioAlimento(alimentoId, gramos, supermercadoId) {
  const datos = PRECIOS[alimentoId]
  if (!datos) return null

  const super_ = SUPERMERCADOS[supermercadoId]
  const eurosPorKg = datos.eurosPorKg * (super_.real ? 1 : 1 + super_.ajuste)

  return (eurosPorKg * gramos) / 1000
}

/**
 * Coste total de una lista de la compra en un supermercado, y cuántos
 * alimentos se han quedado sin precio (para avisar de que el total es parcial).
 */
export function calcularGastoTotal(items, supermercadoId) {
  let total = 0
  let sinPrecio = 0

  for (const item of items) {
    const precio = precioAlimento(item.id, item.gramos, supermercadoId)
    if (precio === null) sinPrecio++
    else total += precio
  }

  return { total, sinPrecio }
}
