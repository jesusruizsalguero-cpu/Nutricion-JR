import { collection, doc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/config/firebase'

/**
 * Escucha si el uid dado está en la whitelist de administradores
 * (colección `admins`, ver firestore.rules). El documento no existe para la
 * inmensa mayoría de usuarios, así que `esAdmin` es `false` por defecto.
 */
export function escucharEsAdmin(uid, alCambiar, alFallar) {
  return onSnapshot(
    doc(db, 'admins', uid),
    (snapshot) => alCambiar(snapshot.exists() && snapshot.data().activo === true),
    alFallar,
  )
}

/** Solo pueden llamarlo los administradores: lo permiten las reglas de Firestore. */
export async function listarUsuarios() {
  const snapshot = await getDocs(query(collection(db, 'usuarios'), orderBy('creadoEn', 'desc')))
  return snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}
