/**
 * Backend del asistente de IA (Cloudflare Worker).
 *
 * Existe por seguridad: la clave de NVIDIA no puede vivir en el cliente. Todo
 * lo que se importa desde `src/` acaba en el bundle que descarga el navegador,
 * así que cualquiera podría sacarla del código o de la pestaña de red y gastar
 * la cuota de la cuenta. Aquí la clave es un secreto del Worker y nunca sale
 * del servidor.
 *
 * El endpoint no es abierto: exige un ID token de Firebase válido, así que solo
 * pueden usarlo quienes han iniciado sesión en la app. Sin esa comprobación
 * sería un proxy gratuito de IA para todo internet, a costa de esta cuenta.
 *
 * Variables que necesita (ver README del worker):
 *   NVIDIA_API_KEY   secreto  — wrangler secret put NVIDIA_API_KEY
 *   FIREBASE_PROJECT variable — id del proyecto, para validar el token
 *   CUOTA            KV       — contador de consultas por usuario y día
 */

const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

// Modelo rápido y de respuestas breves. `thinking: false` es imprescindible:
// sin él, este modelo escribe su razonamiento dentro del propio mensaje.
const MODELO = 'nvidia/nemotron-3.5-lightning-30b-a3b'

const LIMITES = {
  caracteresPorMensaje: 1000,
  mensajesDeHistorial: 12,
  consultasPorDia: 40,
  tokensRespuesta: 500,
}

const ORIGENES_PERMITIDOS = [
  'https://nutricion-jr.web.app',
  'https://nutricion-jr.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5199',
]

export default {
  async fetch(peticion, entorno) {
    const origen = peticion.headers.get('Origin')
    const cors = cabecerasCors(origen)

    if (peticion.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (peticion.method !== 'POST') {
      return json({ error: 'Método no permitido.' }, 405, cors)
    }

    try {
      const uid = await verificarToken(peticion, entorno.FIREBASE_PROJECT)
      const cuerpo = await peticion.json()

      const historial = validarHistorial(cuerpo?.mensajes)
      await comprobarCuota(entorno.CUOTA, uid)

      const respuesta = await preguntarAlModelo(
        entorno.NVIDIA_API_KEY,
        instruccionesDelSistema(cuerpo?.contexto ?? {}),
        historial,
      )

      return json({ respuesta }, 200, cors)
    } catch (error) {
      if (error instanceof ErrorHttp) {
        return json({ error: error.message }, error.estado, cors)
      }
      console.error('[asistente] Error inesperado:', error)
      return json({ error: 'El asistente no ha podido responder. Inténtalo de nuevo.' }, 500, cors)
    }
  },
}

class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje)
    this.estado = estado
  }
}

// ------------------------------------------------------------ Autenticación

/**
 * Valida el ID token de Firebase con las claves públicas de Google.
 * Se comprueba la firma y también emisor, destinatario y caducidad: sin eso,
 * valdría un token de cualquier otro proyecto de Firebase.
 */
async function verificarToken(peticion, proyecto) {
  const cabecera = peticion.headers.get('Authorization') ?? ''
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null
  if (!token) throw new ErrorHttp(401, 'Tienes que iniciar sesión para usar el asistente.')

  const partes = token.split('.')
  if (partes.length !== 3) throw new ErrorHttp(401, 'Sesión no válida.')

  const [cabeceraB64, cargaB64, firmaB64] = partes

  // Un token con base64 o JSON corrupto es un token inválido, no un fallo del
  // servidor: sin este try acabaría en el manejador genérico y devolvería 500.
  let cabeceraToken
  let carga
  try {
    cabeceraToken = JSON.parse(textoDesdeBase64Url(cabeceraB64))
    carga = JSON.parse(textoDesdeBase64Url(cargaB64))
  } catch {
    throw new ErrorHttp(401, 'Sesión no válida.')
  }

  const clave = await obtenerClavePublica(cabeceraToken.kid)
  if (!clave) throw new ErrorHttp(401, 'Sesión no válida.')

  const valida = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    clave,
    bytesDesdeBase64Url(firmaB64),
    new TextEncoder().encode(`${cabeceraB64}.${cargaB64}`),
  )
  if (!valida) throw new ErrorHttp(401, 'Sesión no válida.')

  const ahora = Math.floor(Date.now() / 1000)
  const correcto =
    carga.aud === proyecto &&
    carga.iss === `https://securetoken.google.com/${proyecto}` &&
    typeof carga.sub === 'string' &&
    carga.sub.length > 0 &&
    carga.exp > ahora

  if (!correcto) throw new ErrorHttp(401, 'Tu sesión ha caducado. Vuelve a entrar.')

  return carga.sub
}

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
let cacheClaves = { expira: 0, claves: new Map() }

/** Las claves de Google rotan, así que se cachean solo unas horas. */
async function obtenerClavePublica(kid) {
  if (Date.now() > cacheClaves.expira) {
    const respuesta = await fetch(JWKS_URL)
    if (!respuesta.ok) throw new ErrorHttp(503, 'No se ha podido validar la sesión.')

    const { keys } = await respuesta.json()
    const claves = new Map()
    for (const jwk of keys) {
      claves.set(
        jwk.kid,
        await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['verify'],
        ),
      )
    }
    cacheClaves = { expira: Date.now() + 6 * 60 * 60 * 1000, claves }
  }

  return cacheClaves.claves.get(kid) ?? null
}

// -------------------------------------------------------------- Validación

function validarHistorial(mensajes) {
  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    throw new ErrorHttp(400, 'No hay ningún mensaje que responder.')
  }

  return mensajes.slice(-LIMITES.mensajesDeHistorial).map((mensaje) => {
    const texto = typeof mensaje?.texto === 'string' ? mensaje.texto.trim() : ''
    if (!texto) throw new ErrorHttp(400, 'Hay un mensaje vacío en la conversación.')
    if (texto.length > LIMITES.caracteresPorMensaje) {
      throw new ErrorHttp(400, `Los mensajes no pueden pasar de ${LIMITES.caracteresPorMensaje} caracteres.`)
    }
    return { role: mensaje.rol === 'asistente' ? 'assistant' : 'user', content: texto }
  })
}

/**
 * Tope diario por usuario, guardado en KV. Protege la cuota de la API de un
 * bucle o de un uso abusivo. Si KV no está configurado, no se bloquea el
 * asistente: se avisa en el log y se sigue.
 */
async function comprobarCuota(kv, uid) {
  if (!kv) {
    console.warn('[asistente] Sin KV: no se está aplicando el límite diario.')
    return
  }

  const clave = `${uid}:${new Date().toISOString().slice(0, 10)}`
  const consultas = Number((await kv.get(clave)) ?? 0)

  if (consultas >= LIMITES.consultasPorDia) {
    throw new ErrorHttp(429, `Has llegado al límite de ${LIMITES.consultasPorDia} consultas por hoy. Vuelve mañana.`)
  }

  // Caduca solo a los dos días: no hay que limpiar nada a mano.
  await kv.put(clave, String(consultas + 1), { expirationTtl: 172800 })
}

// ------------------------------------------------------------------ Modelo

async function preguntarAlModelo(apiKey, sistema, historial) {
  let respuesta
  try {
    respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODELO,
        messages: [{ role: 'system', content: sistema }, ...historial],
        max_tokens: LIMITES.tokensRespuesta,
        temperature: 0.6,
        chat_template_kwargs: { thinking: false },
      }),
    })
  } catch (error) {
    console.error('[asistente] No se pudo contactar con la API:', error)
    throw new ErrorHttp(503, 'El asistente no responde ahora mismo. Prueba en un minuto.')
  }

  if (!respuesta.ok) {
    // El detalle puede traer información de la cuenta: se registra, no se devuelve.
    console.error('[asistente] La API respondió', respuesta.status, await respuesta.text())
    throw new ErrorHttp(502, 'El asistente no ha podido responder. Inténtalo de nuevo.')
  }

  const datos = await respuesta.json()
  const texto = datos?.choices?.[0]?.message?.content?.trim()
  if (!texto) throw new ErrorHttp(502, 'El asistente ha devuelto una respuesta vacía.')

  return texto
}

/**
 * El contexto lo manda el cliente. No pasa nada porque un usuario lo falsee:
 * son sus propios datos y solo afectaría a la respuesta que él mismo recibe.
 * Aun así se recorta, para no inflar el prompt.
 */
function instruccionesDelSistema({ nombre, perfil, metas, menuDeHoy }) {
  const lineas = [
    'Eres el asistente de Nutrición JR, una aplicación que diseña dietas personalizadas.',
    'Respondes en español de España, en segunda persona, con frases cortas y directas.',
    'Sé concreto: si te piden cantidades, da gramos. Si no sabes algo, dilo.',
    'Nada de encabezados ni respuestas largas: dos o tres párrafos como mucho.',
    '',
    'Límites importantes:',
    '- No diagnosticas enfermedades ni ajustas medicación.',
    '- Ante síntomas, analíticas o dudas clínicas, remites a su médico o a un dietista-nutricionista.',
    '- No propones dietas por debajo del metabolismo basal ni ayunos prolongados.',
    '- El plan de la app es orientativo y lo dices si viene a cuento.',
  ]

  if (typeof nombre === 'string' && nombre) {
    lineas.push('', `El usuario se llama ${recortar(nombre.split(' ')[0], 40)}.`)
  }

  if (perfil) {
    lineas.push(
      '',
      'Datos del usuario:',
      `- Sexo: ${texto(perfil.sexo)}. Edad: ${texto(perfil.edad)} años. Altura: ${texto(perfil.altura)} cm. Peso: ${texto(perfil.peso)} kg.`,
      `- Objetivo: ${texto(perfil.objetivo)}. Actividad diaria: ${texto(perfil.nivelActividad)}.`,
      `- Deporte: ${texto(perfil.deporte, 'ninguno')} (${texto(perfil.sesionesSemana, 0)} sesiones de ${texto(perfil.minutosSesion, 0)} min por semana).`,
      `- Patologías declaradas: ${lista(perfil.patologias)}.`,
      `- Preferencias y alergias: ${lista(perfil.preferencias)}.`,
    )
  }

  if (metas) {
    lineas.push(
      '',
      `Metas diarias: ${texto(metas.calorias)} kcal, ${texto(metas.proteinas)} g de proteína, ${texto(metas.carbohidratos)} g de hidratos y ${texto(metas.grasas)} g de grasa.`,
    )
  }

  if (menuDeHoy?.comidas?.length) {
    lineas.push('', `Menú de hoy (${texto(menuDeHoy.nombre)}), ${texto(menuDeHoy.kcal)} kcal:`)
    for (const comida of menuDeHoy.comidas.slice(0, 6)) {
      lineas.push(`- ${recortar(String(comida?.etiqueta ?? ''), 30)}: ${recortar(String(comida?.alimentos ?? ''), 300)}`)
    }
    lineas.push(
      '',
      'Puedes proponer cambios sobre ese menú, pero para que se guarden hay que regenerar el plan en la pantalla "Mi dieta".',
    )
  } else {
    lineas.push('', 'Todavía no tiene una dieta generada; puedes animarle a crearla en "Mi dieta".')
  }

  return lineas.join('\n')
}

// ----------------------------------------------------------------- Utilidades

function cabecerasCors(origen) {
  return {
    'Access-Control-Allow-Origin': ORIGENES_PERMITIDOS.includes(origen) ? origen : ORIGENES_PERMITIDOS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(cuerpo, estado, cors) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  })
}

function texto(valor, defecto = 'sin indicar') {
  if (valor === null || valor === undefined || valor === '') return defecto
  return recortar(String(valor), 60)
}

function lista(valores) {
  return Array.isArray(valores) && valores.length > 0
    ? valores.slice(0, 12).map((v) => recortar(String(v), 40)).join(', ')
    : 'ninguna'
}

function recortar(cadena, maximo) {
  return cadena.length > maximo ? `${cadena.slice(0, maximo)}…` : cadena
}

function bytesDesdeBase64Url(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0))
}

function textoDesdeBase64Url(base64url) {
  return new TextDecoder().decode(bytesDesdeBase64Url(base64url))
}
