/**
 * Genera src/data/nutricion-alimentos.json a partir de las fuentes oficiales.
 *
 *   node scripts/generar-nutricion.mjs
 *
 * Los valores nutricionales de la app no se escriben a mano: salen de USDA
 * FoodData Central o de BEDCA, según lo que diga scripts/fuentes-alimentos.json,
 * que apunta a un registro concreto de cada base. Así cualquiera puede volver a
 * ejecutar esto y comprobar que los números son los de la fuente.
 *
 * USDA se descarga en bloque (no hace falta clave de API) y BEDCA se consulta
 * en vivo por su servicio XML.
 */

import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEMPORAL = path.join(RAIZ, '.datos-fuentes')
const SALIDA = path.join(RAIZ, 'src/data/nutricion-alimentos.json')

const DESCARGAS_USDA = [
  ['USDA Foundation', 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2024-10-31.zip'],
  ['USDA SR Legacy', 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'],
]

// Identificadores de nutrientes en USDA (tabla nutrient.csv).
const NUTRIENTES_USDA = {
  1008: 'kcal', 1003: 'proteinas', 1005: 'carbohidratos', 1004: 'grasas',
  1258: 'saturadas', 1079: 'fibra', 1093: 'sodio', 1092: 'potasioMg',
}

// Nombres de componente en BEDCA. Su energía viene en kJ, no en kcal.
const COMPONENTES_BEDCA = {
  'energía, total': 'kJ',
  'proteina, total': 'proteinas',
  carbohidratos: 'carbohidratos',
  'grasa, total (lipidos totales)': 'grasas',
  'ácidos grasos saturados totales': 'saturadas',
  'fibra, dietetica total': 'fibra',
  sodio: 'sodio',
  potasio: 'potasioMg',
}

// ------------------------------------------------------------------ CSV
/** Lector de CSV mínimo: los ficheros de USDA usan comillas y comas dentro. */
function filasCSV(texto) {
  const filas = []
  let campo = ''
  let fila = []
  let entreComillas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else entreComillas = false
      } else campo += c
    } else if (c === '"') entreComillas = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = '' }
    else if (c !== '\r') campo += c
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila) }
  return filas
}

/**
 * En Windows no se usa `tar`: el que trae Git Bash interpreta la "C:" de la
 * ruta como un servidor remoto y falla con "Cannot connect to C:".
 */
function descomprimir(zip, destino) {
  if (process.platform === 'win32') {
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${destino}' -Force`,
    ])
  } else {
    execFileSync('unzip', ['-o', '-q', zip, '-d', destino])
  }
}

// ----------------------------------------------------------------- USDA
async function descargarUSDA() {
  await mkdir(TEMPORAL, { recursive: true })
  const alimentos = new Map()

  for (const [etiqueta, url] of DESCARGAS_USDA) {
    const zip = path.join(TEMPORAL, `${etiqueta.replace(/\s+/g, '-')}.zip`)
    const carpeta = path.join(TEMPORAL, etiqueta.replace(/\s+/g, '-'))

    console.log(`Descargando ${etiqueta}…`)
    const respuesta = await fetch(url)
    if (!respuesta.ok) throw new Error(`No se pudo descargar ${etiqueta}: ${respuesta.status}`)
    await pipeline(Readable.fromWeb(respuesta.body), createWriteStream(zip))

    await mkdir(carpeta, { recursive: true })
    descomprimir(zip, carpeta)

    const interior = path.join(carpeta, (await import('node:fs')).readdirSync(carpeta)[0])
    const base = (await import('node:fs')).existsSync(path.join(interior, 'food.csv')) ? interior : carpeta

    for (const f of filasCSV(await readFile(path.join(base, 'food.csv'), 'utf8')).slice(1)) {
      if (f[0]) alimentos.set(f[0], { id: f[0], nombre: f[2], fuente: etiqueta, valores: {} })
    }
    for (const f of filasCSV(await readFile(path.join(base, 'food_nutrient.csv'), 'utf8')).slice(1)) {
      const clave = NUTRIENTES_USDA[Number(f[2])]
      const alimento = alimentos.get(f[1])
      if (clave && alimento) alimento.valores[clave] = Number(f[3])
    }
  }

  console.log(`  ${alimentos.size} alimentos de USDA`)
  return alimentos
}

// ---------------------------------------------------------------- BEDCA
async function pedirBedca(fId) {
  const consulta = `<?xml version="1.0" encoding="UTF-8"?><foodquery><type level="2"/><selection><atribute name="f_id"/><atribute name="f_ori_name"/><atribute name="c_ori_name"/><atribute name="best_location"/><atribute name="v_unit"/></selection><condition><cond1><atribute1 name="f_id"/></cond1><relation type="EQUAL"/><cond3>${fId}</cond3></condition></foodquery>`

  const respuesta = await fetch('https://www.bedca.net/bdpub/procquery.php', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: consulta,
  })
  const xml = await respuesta.text()

  const nombre = xml.match(/<f_ori_name>([^<]*)<\/f_ori_name>/)?.[1]?.trim()
  const valores = {}
  for (const m of xml.matchAll(
    /<foodvalue><c_ori_name>([^<]*)<\/c_ori_name><best_location>([^<]*)<\/best_location><v_unit>([^<]*)<\/v_unit><\/foodvalue>/g,
  )) {
    const clave = COMPONENTES_BEDCA[m[1].trim().toLowerCase()]
    if (clave) valores[clave] = Number(m[2])
  }

  // BEDCA publica la energía en kilojulios; la app trabaja en kilocalorías.
  if (valores.kJ !== undefined) {
    valores.kcal = valores.kJ / 4.184
    delete valores.kJ
  }
  return { nombre, valores }
}

// --------------------------------------------------------------- Salida
const redondear = (valor, decimales = 1) =>
  valor === undefined ? 0 : Math.round(valor * 10 ** decimales) / 10 ** decimales

async function main() {
  const fuentes = JSON.parse(await readFile(path.join(RAIZ, 'scripts/fuentes-alimentos.json'), 'utf8'))
  const usda = await descargarUSDA()

  const resultado = {}
  const problemas = []

  for (const [idAlimento, origen] of Object.entries(fuentes)) {
    if (idAlimento.startsWith('_')) continue

    let nombreFuente
    let valores

    if (origen.fuente === 'USDA') {
      const encontrado = usda.get(origen.id)
      if (!encontrado) { problemas.push(`${idAlimento}: no existe el fdcId ${origen.id}`); continue }
      nombreFuente = encontrado.nombre
      valores = encontrado.valores
    } else {
      const encontrado = await pedirBedca(origen.id)
      if (!encontrado.nombre) { problemas.push(`${idAlimento}: BEDCA no devolvió el id ${origen.id}`); continue }
      nombreFuente = encontrado.nombre
      valores = encontrado.valores
    }

    if (valores.kcal === undefined) { problemas.push(`${idAlimento}: sin energía en la fuente`); continue }

    resultado[idAlimento] = {
      fuente: origen.fuente,
      fuenteId: origen.id,
      fuenteNombre: nombreFuente,
      kcal: Math.round(valores.kcal),
      proteinas: redondear(valores.proteinas),
      carbohidratos: redondear(valores.carbohidratos),
      grasas: redondear(valores.grasas),
      saturadas: redondear(valores.saturadas, 2),
      fibra: redondear(valores.fibra),
      sodio: Math.round(valores.sodio ?? 0),
      potasioMg: Math.round(valores.potasioMg ?? 0),
    }
    console.log(`  ${idAlimento.padEnd(20)} ${origen.fuente} ${origen.id} → ${resultado[idAlimento].kcal} kcal`)
  }

  await writeFile(SALIDA, `${JSON.stringify(resultado, null, 2)}\n`)
  await rm(TEMPORAL, { recursive: true, force: true })

  console.log(`\n${Object.keys(resultado).length} alimentos escritos en ${path.relative(RAIZ, SALIDA)}`)
  if (problemas.length > 0) {
    console.log('\nPROBLEMAS:')
    for (const p of problemas) console.log(`  ${p}`)
    process.exitCode = 1
  }
}

main()
