import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
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

/** Escucha si un admin ha bloqueado el uid dado (colección `bloqueados`). */
export function escucharBloqueado(uid, alCambiar, alFallar) {
  return onSnapshot(
    doc(db, 'bloqueados', uid),
    (snapshot) => alCambiar(snapshot.exists() && snapshot.data().bloqueado === true),
    alFallar,
  )
}

/** Solo pueden llamarlo los administradores: lo permiten las reglas de Firestore. */
export async function listarUsuarios() {
  const [usuarios, bloqueados] = await Promise.all([
    getDocs(query(collection(db, 'usuarios'), orderBy('creadoEn', 'desc'))),
    getDocs(collection(db, 'bloqueados')),
  ])

  const bloqueadosActivos = new Set(
    bloqueados.docs.filter((documento) => documento.data().bloqueado === true).map((d) => d.id),
  )

  return usuarios.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
    bloqueado: bloqueadosActivos.has(documento.id),
  }))
}

/** Le cierra el paso a la app: sus datos dejan de ser legibles/escribibles (ver esDueno en firestore.rules). */
export async function bloquearUsuario(uid) {
  await setDoc(doc(db, 'bloqueados', uid), { bloqueado: true, bloqueadoEn: serverTimestamp() })
}

export async function desbloquearUsuario(uid) {
  await deleteDoc(doc(db, 'bloqueados', uid))
}
