import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { calcularMetas } from '@/utils/nutricion'

function refUsuario(uid) {
  return doc(db, 'usuarios', uid)
}

export async function obtenerUsuario(uid) {
  const snapshot = await getDoc(refUsuario(uid))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

/** Suscripción en tiempo real al documento del usuario. */
export function escucharUsuario(uid, alCambiar, alFallar) {
  return onSnapshot(
    refUsuario(uid),
    (snapshot) => alCambiar(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    alFallar,
  )
}

/**
 * Guarda el perfil y recalcula las metas diarias a partir de él.
 * Si el usuario ha fijado metas manualmente, se respetan.
 */
export async function guardarPerfil(uid, perfil, { metasManuales = null } = {}) {
  const metas = metasManuales ?? calcularMetas(perfil)
  await updateDoc(refUsuario(uid), {
    perfil,
    metas,
    onboardingCompleto: true,
    actualizadoEn: serverTimestamp(),
  })
  return metas
}

export async function guardarMetas(uid, metas) {
  await updateDoc(refUsuario(uid), { metas, actualizadoEn: serverTimestamp() })
}

export async function actualizarDatosBasicos(uid, datos) {
  await updateDoc(refUsuario(uid), { ...datos, actualizadoEn: serverTimestamp() })
}
