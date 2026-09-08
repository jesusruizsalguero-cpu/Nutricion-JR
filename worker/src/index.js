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

/**
 * Herramientas que el modelo puede pedir. El Worker no las ejecuta: devuelve
 * la intención al cliente, que es quien tiene el catálogo y las reglas de
 * salud para validarla y aplicarla. El modelo propone, el cliente dispone.
 */
const HERRAMIENTAS = [
  {
    type: 'function',
    function: {
      name: 'sustituir_alimento',
      description:
        'Cambia un alimento de una comida del plan por otro. Úsala siempre que el usuario pida cambiar, sustituir o quitar un alimento de su dieta.',
      parameters: {
        type: 'object',
        properties: {
          dia: { type: 'string', description: 'Día: "hoy", "mañana" o el nombre (Lunes, Martes...)' },
          comida: {
            type: 'string',
            enum: ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],
            description: 'La comida del día. "almuerzo" es la comida del mediodía.',
          },
          quitar: { type: 'string', description: 'El alimento que se quita, tal cual aparece en el menú' },
          poner: { type: 'string', description: 'Nombre del alimento nuevo' },
          datos_nuevo: {
            type: 'object',
            description:
              'Solo si "poner" es un alimento casero, de marca o poco común que probablemente no esté en la lista básica de la app: sus valores por 100 g, para darlo de alta al vuelo.',
            properties: {
              rol: { type: 'string', enum: ['proteina', 'carbohidrato', 'verdura', 'fruta', 'grasa', 'lacteo'] },
              kcal: { type: 'number' },
              proteinas: { type: 'number' },
              carbohidratos: { type: 'number' },
              grasas: { type: 'number' },
              fibra: { type: 'number' },
              contiene: {
                type: 'array',
                items: { type: 'string', enum: ['gluten', 'lactosa', 'huevo', 'pescado', 'marisco', 'frutosSecos', 'soja'] },
              },
            },
            required: ['rol', 'kcal', 'proteinas', 'carbohidratos', 'grasas'],
          },
        },
        required: ['dia', 'comida', 'quitar', 'poner'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ajustar_cantidad',
      description:
        'Cambia los gramos de un alimento que ya está en una comida. Úsala si piden más o menos cantidad de algo.',
      parameters: {
        type: 'object',
        properties: {
          dia: { type: 'string', description: 'Día: "hoy", "mañana" o el nombre' },
          comida: {
            type: 'string',
            enum: ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],
          },
          alimento: { type: 'string', description: 'id del alimento a ajustar' },
          gramos: { type: 'number', description: 'Cantidad nueva en gramos' },
        },
        required: ['dia', 'comida', 'alimento', 'gramos'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'anadir_alimento',
      description:
        'Da de alta un alimento que no está en la lista de la app, con sus valores por 100 g. Si el usuario quería cambiarlo por otro del menú, rellena además dia, comida y quitar: así queda añadido Y puesto en el plato de una vez.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre del alimento, por ejemplo "Kéfir"' },
          dia: { type: 'string', description: 'Si va a sustituir a otro: día ("hoy", "Martes"...)' },
          comida: {
            type: 'string',
            enum: ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],
            description: 'Si va a sustituir a otro: en qué comida',
          },
          quitar: { type: 'string', description: 'Si va a sustituir a otro: el alimento al que reemplaza' },
          rol: {
            type: 'string',
            enum: ['proteina', 'carbohidrato', 'verdura', 'fruta', 'grasa', 'lacteo'],
            description: 'Qué papel hace en el plato',
          },
          kcal: { type: 'number', description: 'Calorías por 100 g' },
          proteinas: { type: 'number', description: 'Gramos de proteína por 100 g' },
          carbohidratos: { type: 'number', description: 'Gramos de hidratos por 100 g' },
          grasas: { type: 'number', description: 'Gramos de grasa por 100 g' },
          fibra: { type: 'number', description: 'Gramos de fibra por 100 g (opcional)' },
          contiene: {
            type: 'array',
            items: { type: 'string', enum: ['gluten', 'lactosa', 'huevo', 'pescado', 'marisco', 'frutosSecos', 'soja'] },
            description: 'Alérgenos que lleva, para respetar las restricciones del usuario',
          },
        },
        required: ['nombre', 'rol', 'kcal', 'proteinas', 'carbohidratos', 'grasas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'regenerar_dia',
      description:
        'Rehace un día entero con otros alimentos. Úsala si el usuario dice que un día no le gusta o quiere otra cosa distinta.',
      parameters: {
        type: 'object',
        properties: {
          dia: { type: 'string', description: 'Día: "hoy", "mañana" o el nombre' },
        },
        required: ['dia'],
      },
    },
  },
]

const LIMITES = {
  caracteresPorMensaje: 1000,
  mensajesDeHistorial: 12,
  consultasPorDia: 40,
  tokensRespuesta: 800,
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

      const { respuesta, acciones } = await preguntarAlModelo(
        entorno.NVIDIA_API_KEY,
        instruccionesDelSistema(cuerpo?.contexto ?? {}),
        historial,
      )

      return json({ respuesta, acciones }, 200, cors)
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
        tools: HERRAMIENTAS,
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
  const mensaje = datos?.choices?.[0]?.message
  const acciones = leerAcciones(mensaje?.tool_calls)
  const texto = sinFalsasConfirmaciones(limpiarTexto(mensaje?.content ?? ''), acciones)

  // Cuando el modelo llama a una herramienta, suele devolver el texto vacío:
  // el mensaje de confirmación lo redacta el cliente con lo que ha pasado
  // realmente, así que aquí no es un error.
  if (!texto && acciones.length === 0) {
    console.error('[asistente] Respuesta sin contenido:', JSON.stringify(datos).slice(0, 500))
    throw new ErrorHttp(502, 'El asistente ha devuelto una respuesta vacía.')
  }

  return { respuesta: texto, acciones }
}

/**
 * Deja el texto listo para enseñarlo tal cual en el chat.
 *
 * Dos limpiezas: el bloque <think> que el modelo filtra a veces pese a pedirle
 * `thinking: false`, y las negritas de Markdown, que en las burbujas se verían
 * como asteriscos literales porque se pintan como texto plano.
 */
function limpiarTexto(contenido) {
  return String(contenido)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .trim()
}

/**
 * Última red contra la mentira más molesta del asistente: decir "ya te lo he
 * cambiado" sin haber llamado a ninguna herramienta, con lo que la dieta se
 * queda igual. Se le ha pedido por prompt que no lo haga, pero un modelo
 * pequeño se despista; si aun así lo afirma, no se le enseña al usuario.
 */
const AFIRMA_CAMBIO =
  /\b(hecho|listo|ya (lo|la|te)|lo he (cambiado|puesto|añadido|ajustado)|he (cambiado|puesto|añadido|ajustado|actualizado)|cambio el|te lo cambio)\b/i

function sinFalsasConfirmaciones(texto, acciones) {
  if (acciones.length > 0 || !texto || !AFIRMA_CAMBIO.test(texto)) return texto

  return 'No he llegado a cambiar nada. Dime otra vez qué alimento quieres cambiar y en qué comida, y lo hago.'
}

/** Traduce las llamadas a herramientas del modelo al formato del cliente. */
function leerAcciones(toolCalls) {
  if (!Array.isArray(toolCalls)) return []

  return toolCalls
    .map((llamada) => {
      try {
        return {
          nombre: llamada?.function?.name,
          argumentos: JSON.parse(llamada?.function?.arguments ?? '{}'),
        }
      } catch {
        // Un JSON mal formado del modelo no debe tumbar la respuesta entera.
        console.warn('[asistente] Argumentos ilegibles:', llamada?.function?.arguments)
        return null
      }
    })
    .filter((accion) => accion?.nombre)
    .slice(0, 3)
}

/**
 * El contexto lo manda el cliente. No pasa nada porque un usuario lo falsee:
 * son sus propios datos y solo afectaría a la respuesta que él mismo recibe.
 * Aun así se recorta, para no inflar el prompt.
 */
function instruccionesDelSistema({ nombre, perfil, metas, menuDeHoy }) {
  const lineas = [
    'Eres el asistente de Nutrición JR, una aplicación que diseña dietas personalizadas.',
    'Respondes en español de España, breve y directo: dos o tres frases bastan.',
    '',
    'Háblale SIEMPRE de tú y en segunda persona: "llevas 2.100 kcal", "tu cena tiene".',
    'Nunca hables en primera persona de lo que come él: "llevo 2.100 kcal" está mal.',
    'Nada de encabezados, listas largas ni Markdown.',
    '',
    'Puedes modificar la dieta de verdad con las herramientas que tienes.',
    'Cuando el usuario pida un cambio, LLÁMALAS: no digas que lo has cambiado si no las has usado.',
    'No anuncies el cambio antes de hacerlo; el resultado se le confirma automáticamente.',
    'NUNCA escribas confirmaciones tipo "Hecho", "he cambiado" o "he aumentado":',
    'esas frases las redacta la aplicación cuando el cambio se ha aplicado de verdad.',
    'Si no has llamado a una herramienta, no ha cambiado nada. No digas lo contrario.',
    '',
    'Habla como una persona, no como un programa. NUNCA menciones nombres de',
    'herramientas, identificadores internos, errores del sistema ni comillas',
    'invertidas. Nada de "voy a lanzar sustituir_alimento" ni "no encuentro el id".',
    'Llama a los alimentos por su nombre de siempre: "el yogur de soja", no "yogur-soja".',
    '',
    'La app tiene una lista básica de unos 80 alimentos corrientes (pollo, arroz,',
    'yogur, brócoli...). No la tienes delante, así que ante un alimento casero, de',
    'marca o poco común (kéfir, seitán ahumado, una barrita concreta) da por hecho',
    'que NO está. En ese caso usa sustituir_alimento igualmente, rellenando además',
    'datos_nuevo con sus valores por 100 g: así queda dado de alta y colocado de una',
    'vez. Usa anadir_alimento solo si te piden guardarlo sin ponerlo en el menú.',
    'Si te dicen "cámbialo por cualquier otra cosa", elige tú una alternativa que',
    'pegue con esa comida y hazlo, sin preguntar.',
    '',
    'Reglas al usar las herramientas:',
    '- En "quitar" y "alimento" pon SOLO el nombre del alimento, tal como aparece en',
    '  el menú y sin la cantidad: "Yogur de soja", no "Yogur de soja 250 g".',
    '- Si te piden cambiar algo que no está en esa comida, NO llames a la herramienta:',
    '  dile qué hay realmente ahí y pregúntale cuál quiere cambiar.',
    '- En "poner", el nombre normal del alimento: "pasta integral", "kéfir".',
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
      `- Deportes: ${lista(perfil.deportes)} (${texto(perfil.sesionesSemana, 0)} sesiones de ${texto(perfil.minutosSesion, 0)} min por semana en total).`,
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
    lineas.push(
      '',
      // Las confirmaciones de los cambios no vuelven al modelo (le enseñaban a
      // fingirlos), así que su única fuente fiable del estado es este menú.
      'Este es el menú de hoy AHORA MISMO, ya con los cambios que se hayan hecho',
      'antes en esta conversación. Míralo siempre antes de decidir qué cambiar.',
      `Menú de hoy (${texto(menuDeHoy.nombre)}), ${texto(menuDeHoy.kcal)} kcal:`,
    )
    for (const comida of menuDeHoy.comidas.slice(0, 6)) {
      lineas.push(
        `- ${recortar(String(comida?.etiqueta ?? ''), 30)} [${recortar(String(comida?.id ?? ''), 20)}]: ` +
          recortar(String(comida?.alimentos ?? ''), 400),
      )
    }
    lineas.push(
      '',
      'Para cambiar otro día distinto de hoy, pásale el nombre del día a la herramienta.',
    )
  } else {
    lineas.push('', 'Todavía no tiene una dieta generada; anímale a crearla en "Mi dieta".')
  }

  // Antes aquí iba el catálogo entero (82 alimentos). Se quitó: alargaba el
  // prompt hasta el punto de tardar 20 segundos en responder, confundía al
  // modelo con decenas de identificadores y aun así se inventaba alimentos.
  // El cliente resuelve el alimento nuevo por su nombre y rechaza lo que no
  // sea apto, que es donde de verdad se puede validar.

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
