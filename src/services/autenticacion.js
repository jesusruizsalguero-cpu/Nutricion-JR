import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

const proveedorGoogle = new GoogleAuthProvider()

/** Crea el documento de usuario la primera vez que entra. */
async function asegurarDocumentoUsuario(usuario, datosExtra = {}) {
  const referencia = doc(db, 'usuarios', usuario.uid)
  const existente = await getDoc(referencia)
  if (existente.exists()) return existente.data()

  const nuevo = {
    uid: usuario.uid,
    email: usuario.email,
    nombre: datosExtra.nombre || usuario.displayName || usuario.email?.split('@')[0] || 'Usuario',
    fotoURL: usuario.photoURL ?? null,
    perfil: {
      sexo: null,
      fechaNacimiento: null,
      altura: null,
      peso: null,
      nivelActividad: 'moderado',
      objetivo: 'mantener',
    },
    metas: null, // se calculan al completar el perfil
    onboardingCompleto: false,
    creadoEn: serverTimestamp(),
  }

  await setDoc(referencia, nuevo)
  return nuevo
}

export async function registrar({ nombre, email, password }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: nombre })
  await asegurarDocumentoUsuario(user, { nombre })
  return user
}

export async function iniciarSesion({ email, password }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  await asegurarDocumentoUsuario(user)
  return user
}

export async function iniciarSesionConGoogle() {
  const { user } = await signInWithPopup(auth, proveedorGoogle)
  await asegurarDocumentoUsuario(user)
  return user
}

export function cerrarSesion() {
  return signOut(auth)
}

export function recuperarPassword(email) {
  return sendPasswordResetEmail(auth, email)
}
