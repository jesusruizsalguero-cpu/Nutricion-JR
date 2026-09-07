import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const configuracion = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Falta configuración -> la app arranca igual pero muestra un aviso claro
 * en vez de reventar con un error críptico del SDK.
 *
 * getAuth() valida el formato de la apiKey en cuanto se llama, así que con
 * una clave vacía lanzaría "auth/invalid-api-key" antes de que React llegue
 * a pintar ese aviso. Por eso solo se inicializan los servicios cuando la
 * configuración está completa.
 */
export const configuracionIncompleta = !configuracion.apiKey || !configuracion.appId

export const app = configuracionIncompleta ? null : initializeApp(configuracion)
export const auth = configuracionIncompleta ? null : getAuth(app)
export const db = configuracionIncompleta ? null : getFirestore(app)

if (!configuracionIncompleta && import.meta.env.VITE_USAR_EMULADORES === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  console.info('[Firebase] Conectado a los emuladores locales')
}
