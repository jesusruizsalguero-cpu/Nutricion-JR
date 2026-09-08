import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

const proveedorGoogle = new GoogleAuthProvider()

// Fuerza el selector de cuenta: si el usuario tiene varias sesiones de Google
// abiertas, puede elegir con cuál entra en vez de usar siempre la primera.
proveedorGoogle.setCustomParameters({ prompt: 'select_account' })

/** Crea el documento de usuario la primera vez que entra. */
async function asegurarDocumentoUsuario(usuario) {
  const referencia = doc(db, 'usuarios', usuario.uid)
  const existente = await getDoc(referencia)
  if (existente.exists()) return existente.data()

  const nuevo = {
    uid: usuario.uid,
    email: usuario.email,
    nombre: usuario.displayName || usuario.email?.split('@')[0] || 'Usuario',
    fotoURL: usuario.photoURL ?? null,
    perfil: {
      sexo: null,
      fechaNacimiento: null,
      altura: null,
      peso: null,
      nivelActividad: 'ligero',
      deportes: [],
      sesionesSemana: 0,
      minutosSesion: 0,
      objetivo: 'mantener',
      patologias: [],
      preferencias: [],
      numeroComidas: 4,
    },
    metas: null, // se calculan al completar el onboarding
    planActivo: null, // id del plan de dieta que está siguiendo
    onboardingCompleto: false,
    creadoEn: serverTimestamp(),
  }

  await setDoc(referencia, nuevo)
  return nuevo
}

/**
 * Único punto de entrada a la app. Con Google no hace falta distinguir entre
 * registro e inicio de sesión: la primera vez se crea el documento y ya está.
 */
export async function iniciarSesionConGoogle() {
  const { user } = await signInWithPopup(auth, proveedorGoogle)
  await asegurarDocumentoUsuario(user)
  return user
}

export function cerrarSesion() {
  return signOut(auth)
}
