/**
 * Genera src/data/precios-alimentos.json: precio real de Mercadona (€/kg) por
 * cada alimento del catálogo, a partir de scripts/precios-mercadona.json.
 *
 *   node scripts/generar-precios.mjs
 *
 * Mercadona es el único de los cuatro supermercados de la lista de la compra
 * con un precio real: tiene una API de producto pública y sin clave. Lidl,
 * Dia y Supeco no la tienen (Lidl y Dia sin una vía sencilla; Supeco bloquea
 * activamente el acceso automatizado, y no se intenta saltar esa protección),
 * así que sus columnas se calculan en la propia app como una estimación de
 * referencia sobre el precio real de Mercadona — ver AJUSTE_REFERENCIA en
 * src/utils/precios.js. Aquí solo se genera el dato real.
 *
 * `tienda.mercadona.es/api/products/{id}` da el precio en `bulk_price`: precio
 * por kg, por litro o por unidad suelta según `size_format`. Para los cuatro
 * alimentos por unidad (huevo, lechuga) hace falta un peso medio para pasarlo
 * a €/kg; está documentado en UNIDAD_A_GRAMOS.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Peso medio de una unidad suelta, para los alimentos que Mercadona vende por
 * pieza en vez de por peso. Son aproximaciones para el cálculo del precio,
 * no valores nutricionales: no afectan a nada más que al coste estimado.
 */
const UNIDAD_A_GRAMOS = {
  huevo: 60, // huevo L con cáscara
  lechuga: 500, // cabeza de lechuga iceberg
}

async function precioMercadona(id) {
  const resp = await fetch(`https://tienda.mercadona.es/api/products/${id}/?lang=es&wh=vlc`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const datos = await resp.json()
  const pi = datos.price_instructions

  return {
    nombre: datos.display_name,
    bulkPrice: Number(pi.bulk_price),
    sizeFormat: pi.size_format,
  }
}

function euroPorKg(idAlimento, precio) {
  if (precio.sizeFormat === 'kg' || precio.sizeFormat === 'l') return precio.bulkPrice

  if (precio.sizeFormat === 'ud') {
    const gramosPorUnidad = UNIDAD_A_GRAMOS[idAlimento]
    if (!gramosPorUnidad) {
      throw new Error(`"${idAlimento}" se vende por unidad y no tiene peso medio en UNIDAD_A_GRAMOS`)
    }
    return precio.bulkPrice / (gramosPorUnidad / 1000)
  }

  throw new Error(`Formato de precio desconocido: "${precio.sizeFormat}"`)
}

async function main() {
  const mapeo = JSON.parse(await readFile(path.join(RAIZ, 'scripts/precios-mercadona.json'), 'utf8'))
  delete mapeo._comentario

  const resultado = {}
  const problemas = []

  for (const [idAlimento, idMercadona] of Object.entries(mapeo)) {
    if (idMercadona === null) {
      resultado[idAlimento] = null
      console.log(`  ${idAlimento.padEnd(20)} sin Mercadona (usará solo referencia)`)
      continue
    }

    try {
      const precio = await precioMercadona(idMercadona)
      const eurosPorKg = euroPorKg(idAlimento, precio)
      resultado[idAlimento] = {
        eurosPorKg: Math.round(eurosPorKg * 100) / 100,
        mercadonaId: idMercadona,
        mercadonaNombre: precio.nombre,
      }
      console.log(`  ${idAlimento.padEnd(20)} ${resultado[idAlimento].eurosPorKg.toFixed(2)} €/kg  (${precio.nombre})`)
    } catch (e) {
      problemas.push(`${idAlimento} (id ${idMercadona}): ${e.message}`)
    }
  }

  const salida = path.join(RAIZ, 'src/data/precios-alimentos.json')
  await writeFile(salida, `${JSON.stringify(resultado, null, 2)}\n`)

  console.log(`\n${Object.keys(resultado).length} alimentos escritos en ${path.relative(RAIZ, salida)}`)
  if (problemas.length > 0) {
    console.log('\nPROBLEMAS:')
    for (const p of problemas) console.log(`  ${p}`)
    process.exitCode = 1
  }
}

main()
