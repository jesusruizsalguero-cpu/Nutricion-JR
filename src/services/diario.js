import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { escalarPorcion } from '@/utils/nutricion'

/** usuarios/{uid}/diario/{YYYY-MM-DD} */
function refDia(uid, fecha) {
  return doc(db, 'usuarios', uid, 'diario', fecha)
}

/** usuarios/{uid}/diario/{YYYY-MM-DD}/items */
function refItems(uid, fecha) {
  return collection(db, 'usuarios', uid, 'diario', fecha, 'items')
}

/** Suscripción en tiempo real a los alimentos registrados en un día. */
export function escucharItemsDelDia(uid, fecha, alCambiar, alFallar) {
  return onSnapshot(
    query(refItems(uid, fecha), orderBy('creadoEn', 'asc')),
    (snapshot) => alCambiar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    alFallar,
  )
}

/** Suscripción al resumen del día (agua, notas, totales cacheados). */
export function escucharDia(uid, fecha, alCambiar, alFallar) {
  return onSnapshot(
    refDia(uid, fecha),
    (snapshot) => alCambiar(snapshot.exists() ? snapshot.data() : null),
    alFallar,
  )
}

export async function obtenerItemsDelDia(uid, fecha) {
  const snapshot = await getDocs(query(refItems(uid, fecha), orderBy('creadoEn', 'asc')))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Registra un alimento en una comida del día.
 * Guardamos los macros ya calculados para no depender del catálogo al leer.
 */
export async function agregarItem(uid, fecha, { alimento, gramos, comida }) {
  await asegurarDia(uid, fecha)
  const macros = escalarPorcion(alimento, gramos)

  const referencia = await addDoc(refItems(uid, fecha), {
    alimentoId: alimento.id ?? null,
    nombre: alimento.nombre,
    marca: alimento.marca ?? null,
    comida,
    gramos: Number(gramos),
    unidad: alimento.unidadBase || 'g',
    ...macros,
    creadoEn: serverTimestamp(),
  })
  return referencia.id
}

export async function actualizarItem(uid, fecha, itemId, { alimento, gramos, comida }) {
  const macros = escalarPorcion(alimento, gramos)
  await updateDoc(doc(refItems(uid, fecha), itemId), {
    gramos: Number(gramos),
    comida,
    ...macros,
    actualizadoEn: serverTimestamp(),
  })
}

export async function eliminarItem(uid, fecha, itemId) {
  await deleteDoc(doc(refItems(uid, fecha), itemId))
}

/** Copia todos los items de una comida de un día a otro. */
export async function copiarComida(uid, { desde, hasta, comida }) {
  const items = await obtenerItemsDelDia(uid, desde)
  const aCopiar = items.filter((i) => i.comida === comida)
  if (aCopiar.length === 0) return 0

  await asegurarDia(uid, hasta)
  await Promise.all(
    aCopiar.map(({ id, creadoEn, actualizadoEn, ...resto }) =>
      addDoc(refItems(uid, hasta), { ...resto, creadoEn: serverTimestamp() }),
    ),
  )
  return aCopiar.length
}

/** Vasos de agua (250 ml cada uno). */
export async function registrarAgua(uid, fecha, mililitros) {
  await asegurarDia(uid, fecha)
  await updateDoc(refDia(uid, fecha), {
    agua: increment(mililitros),
    actualizadoEn: serverTimestamp(),
  })
}

export async function guardarNotas(uid, fecha, notas) {
  await asegurarDia(uid, fecha)
  await updateDoc(refDia(uid, fecha), { notas, actualizadoEn: serverTimestamp() })
}

/** Crea el documento del día si aún no existe. */
async function asegurarDia(uid, fecha) {
  const referencia = refDia(uid, fecha)
  const snapshot = await getDoc(referencia)
  if (!snapshot.exists()) {
    await setDoc(referencia, {
      fecha,
      agua: 0,
      notas: '',
      creadoEn: serverTimestamp(),
    })
  }
}
