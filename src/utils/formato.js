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

/** Traduce los códigos de error de Firebase Auth a mensajes en español. */
export function mensajeErrorAuth(codigo) {
  const mensajes = {
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Inténtalo de nuevo más tarde.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
    'auth/popup-closed-by-user': 'Has cerrado la ventana antes de terminar.',
  }
  return mensajes[codigo] ?? 'Ha ocurrido un error. Inténtalo de nuevo.'
}
