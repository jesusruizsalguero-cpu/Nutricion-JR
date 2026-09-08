import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

/**
 * Suplementos que el usuario añade por su cuenta, en
 * usuarios/{uid}/suplementos. Los recomendados por la app no se guardan: se
 * calculan cada vez a partir del perfil, así cambian solos si cambia el perfil.
 */
function coleccion(uid) {
  return collection(db, 'usuarios', uid, 'suplementos')
}

export function escucharSuplementos(uid, alCambiar, alFallar) {
  return onSnapshot(
    query(coleccion(uid), orderBy('creadoEn', 'desc')),
    (snapshot) => alCambiar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    alFallar,
  )
}

export function crearSuplemento(uid, { nombre, descripcion, momento }) {
  return addDoc(coleccion(uid), {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() ?? '',
    momento: momento?.trim() ?? '',
    creadoEn: serverTimestamp(),
  })
}

export function editarSuplemento(uid, suplementoId, cambios) {
  return updateDoc(doc(coleccion(uid), suplementoId), cambios)
}

export function eliminarSuplemento(uid, suplementoId) {
  return deleteDoc(doc(coleccion(uid), suplementoId))
}
