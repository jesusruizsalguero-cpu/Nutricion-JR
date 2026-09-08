import { getIdToken } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

/**
 * Cliente del asistente de IA.
 *
 * La clave de NVIDIA no está aquí a propósito: vive en un Cloudflare Worker
 * (carpeta `worker/`). Si estuviera en este archivo acabaría en el bundle que
 * descarga el navegador y cualquiera podría leerla. Aquí solo se envía el
 * mensaje junto al ID token de Firebase, que el Worker valida.
 */
const URL_ASISTENTE = import.meta.env.VITE_ASISTENTE_URL

/** Sin la URL del Worker la pantalla lo dice en vez de fallar sin explicación. */
export const asistenteConfigurado = Boolean(URL_ASISTENTE)

const TOPE_MENSAJES = 100

function coleccion(uid) {
  return collection(db, 'usuarios', uid, 'chatIA')
}

/**
 * Conversación en tiempo real. Se ordena por una marca de tiempo del cliente
 * (no `serverTimestamp`) porque esta llega vacía hasta que el servidor
 * confirma la escritura, y eso hace saltar los mensajes de sitio al enviarlos.
 */
export function escucharConversacion(uid, alCambiar, alFallar) {
  return onSnapshot(
    query(coleccion(uid), orderBy('creadoEn'), limit(TOPE_MENSAJES)),
    (snapshot) => alCambiar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    alFallar,
  )
}

/**
 * `origen` distingue lo que escribe el modelo ('modelo') de lo que redacta la
 * app al aplicar un cambio ('accion'). Importa: los mensajes de la app no se le
 * devuelven al modelo como si fueran suyos (ver `useAsistente`).
 */
export function guardarMensaje(uid, { rol, texto, origen = 'modelo', exito = null }) {
  return addDoc(coleccion(uid), { rol, texto, origen, exito, creadoEn: Date.now() })
}

export async function borrarConversacion(uid) {
  const snapshot = await getDocs(coleccion(uid))
  await Promise.all(snapshot.docs.map((documento) => deleteDoc(documento.ref)))
}

/**
 * Envía la conversación al Worker y devuelve `{ respuesta, acciones }`.
 * Las acciones son cambios que el modelo quiere hacer en la dieta; las aplica
 * el cliente (ver `utils/edicionPlan.js`), que es quien puede validarlas.
 * El contexto viaja desde el cliente: son datos del propio usuario, así que
 * falsearlos solo afectaría a la respuesta que él mismo recibe.
 */
export async function preguntar(mensajes, contexto) {
  if (!URL_ASISTENTE) {
    throw new Error('El asistente todavía no está configurado en esta instalación.')
  }

  const token = await getIdToken(auth.currentUser)

  let respuesta
  try {
    respuesta = await fetch(URL_ASISTENTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mensajes, contexto }),
    })
  } catch {
    throw new Error('No se ha podido conectar con el asistente. Revisa tu conexión.')
  }

  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw new Error(datos.error ?? 'El asistente no ha podido responder. Inténtalo de nuevo.')
  }

  return { respuesta: datos.respuesta ?? '', acciones: datos.acciones ?? [] }
}
