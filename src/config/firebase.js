import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const configuracion = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Falta configuración -> la app arranca igual pero muestra un aviso claro
 * en vez de reventar con un error críptico del SDK.
 */
export const configuracionIncompleta = !configuracion.apiKey || !configuracion.appId

export const app = initializeApp(configuracion)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

if (import.meta.env.VITE_USAR_EMULADORES === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  console.info('[Firebase] Conectado a los emuladores locales')
}
