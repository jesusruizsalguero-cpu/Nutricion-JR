import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

/**
 * Los planes viven en usuarios/{uid}/planes/{planId} y el usuario guarda en
 * `planActivo` cuál está siguiendo. Se conserva el histórico para poder volver
 * a un plan anterior y comparar.
 */
function coleccionPlanes(uid) {
  return collection(db, 'usuarios', uid, 'planes')
}

/** Guarda un plan generado y lo deja como activo. */
export async function guardarPlan(uid, plan, { nombre } = {}) {
  const referencia = doc(coleccionPlanes(uid))

  await setDoc(referencia, {
    ...plan,
    nombre: nombre ?? nombrePorDefecto(),
    creadoEn: serverTimestamp(),
  })
  await updateDoc(doc(db, 'usuarios', uid), {
    planActivo: referencia.id,
    actualizadoEn: serverTimestamp(),
  })

  return referencia.id
}

/** Sobrescribe un plan existente, por ejemplo al regenerar un solo día. */
export async function actualizarPlan(uid, planId, plan) {
  await setDoc(doc(coleccionPlanes(uid), planId), { ...plan, actualizadoEn: serverTimestamp() }, {
    merge: true,
  })
}

export async function obtenerPlan(uid, planId) {
  const snapshot = await getDoc(doc(coleccionPlanes(uid), planId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

/** Suscripción en tiempo real a un plan concreto. */
export function escucharPlan(uid, planId, alCambiar, alFallar) {
  return onSnapshot(
    doc(coleccionPlanes(uid), planId),
    (snapshot) => alCambiar(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    alFallar,
  )
}

export async function listarPlanes(uid, tope = 10) {
  const snapshot = await getDocs(
    query(coleccionPlanes(uid), orderBy('creadoEn', 'desc'), limit(tope)),
  )
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function eliminarPlan(uid, planId) {
  await deleteDoc(doc(coleccionPlanes(uid), planId))
}

function nombrePorDefecto() {
  const hoy = new Date()
  return `Plan del ${hoy.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
}
