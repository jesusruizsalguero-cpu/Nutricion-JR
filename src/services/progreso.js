import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as limitar,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

function refProgreso(uid) {
  return collection(db, 'usuarios', uid, 'progreso')
}

/** Mediciones ordenadas de la más reciente a la más antigua. */
export function escucharProgreso(uid, alCambiar, alFallar, tope = 90) {
  return onSnapshot(
    query(refProgreso(uid), orderBy('fecha', 'desc'), limitar(tope)),
    (snapshot) => alCambiar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    alFallar,
  )
}

export async function listarProgreso(uid, tope = 90) {
  const snapshot = await getDocs(
    query(refProgreso(uid), orderBy('fecha', 'desc'), limitar(tope)),
  )
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function registrarMedicion(uid, medicion) {
  const referencia = await addDoc(refProgreso(uid), {
    fecha: medicion.fecha, // YYYY-MM-DD
    peso: Number(medicion.peso) || null,
    grasaCorporal: Number(medicion.grasaCorporal) || null,
    cintura: Number(medicion.cintura) || null,
    cadera: Number(medicion.cadera) || null,
    pecho: Number(medicion.pecho) || null,
    notas: medicion.notas?.trim() || '',
    creadoEn: serverTimestamp(),
  })
  return referencia.id
}

export async function actualizarMedicion(uid, id, cambios) {
  await updateDoc(doc(refProgreso(uid), id), {
    ...cambios,
    actualizadoEn: serverTimestamp(),
  })
}

export async function eliminarMedicion(uid, id) {
  await deleteDoc(doc(refProgreso(uid), id))
}
