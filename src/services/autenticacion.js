import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
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
 * En la app empaquetada no vale signInWithPopup: dentro de un WebView no hay
 * ventanas emergentes, y además Google rechaza por diseño el flujo de OAuth
 * en navegadores embebidos (error `disallowed_useragent`). El plugin abre el
 * selector de cuentas nativo de Android y devuelve la credencial.
 *
 * Esa credencial hay que pasársela después al SDK web, porque el resto de la
 * app (Firestore, el listener de sesión) mira `auth` de firebase/auth y no se
 * entera del login nativo por su cuenta.
 */
async function entrarNativo() {
  const { credential } = await FirebaseAuthentication.signInWithGoogle()

  if (!credential?.idToken) {
    throw new Error('Google no devolvió el idToken; revisa el google-services.json')
  }

  const credencialWeb = GoogleAuthProvider.credential(
    credential.idToken,
    credential.accessToken,
  )
  const { user } = await signInWithCredential(auth, credencialWeb)
  return user
}

async function entrarWeb() {
  const { user } = await signInWithPopup(auth, proveedorGoogle)
  return user
}

/**
 * Único punto de entrada a la app. Con Google no hace falta distinguir entre
 * registro e inicio de sesión: la primera vez se crea el documento y ya está.
 */
export async function iniciarSesionConGoogle() {
  const usuario = Capacitor.isNativePlatform() ? await entrarNativo() : await entrarWeb()
  await asegurarDocumentoUsuario(usuario)
  return usuario
}

export async function cerrarSesion() {
  // En nativo hay dos sesiones vivas —la del SDK de Google y la del SDK web—
  // y cerrar solo una dejaría al usuario dentro al reabrir la app.
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut()
  }
  await signOut(auth)
}
