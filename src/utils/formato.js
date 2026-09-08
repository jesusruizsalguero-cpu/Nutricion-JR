/** Formateo de números y textos para la interfaz (locale es-ES). */

const numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })
const numeroDecimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })

export function kcal(valor) {
  return `${numero.format(Math.round(valor || 0))} kcal`
}

export function gramos(valor) {
  return `${numeroDecimal.format(valor || 0)} g`
}

export function entero(valor) {
  return numero.format(Math.round(valor || 0))
}

export function decimal(valor) {
  return numeroDecimal.format(valor || 0)
}

export function porcentaje(parte, total) {
  if (!total) return 0
  return Math.min(100, Math.round((parte / total) * 100))
}

const DIACRITICOS = /[̀-ͯ]/g

/** Normaliza texto para búsquedas: minúsculas y sin acentos. */
export function normalizar(texto = '') {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICOS, '') // quita los acentos que NFD dejó sueltos
    .trim()
}

/** Traduce los códigos de error de Firebase Auth (acceso con Google). */
export function mensajeErrorAuth(codigo) {
  const mensajes = {
    'auth/popup-blocked':
      'Tu navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes e inténtalo otra vez.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/operation-not-allowed':
      'El acceso con Google no está habilitado en el proyecto de Firebase.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication.',
    'auth/account-exists-with-different-credential':
      'Ya existe una cuenta con ese correo creada por otro método.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo de nuevo más tarde.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
  }
  return mensajes[codigo] ?? 'No se ha podido iniciar sesión. Inténtalo de nuevo.'
}

/**
 * Traduce los errores de Firestore al generar o guardar la dieta. El código
 * importa: `permission-denied` casi siempre significa que las reglas de
 * seguridad del proyecto no están publicadas, no que el usuario haga algo mal.
 */
export function mensajeErrorPlan(error) {
  const mensajes = {
    'permission-denied':
      'La base de datos ha rechazado la escritura por permisos. Si la app se acaba de desplegar, falta publicar las reglas de Firestore (firestore.rules).',
    unavailable: 'No hay conexión con la base de datos. Revisa tu internet e inténtalo de nuevo.',
    'resource-exhausted': 'Se ha superado la cuota de Firestore del proyecto.',
    unauthenticated: 'Tu sesión ha caducado. Vuelve a entrar.',
  }
  const detalle = mensajes[error?.code]
  if (detalle) return detalle

  return `No se pudo generar el plan${error?.code ? ` (${error.code})` : ''}. Inténtalo de nuevo.`
}
