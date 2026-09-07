import { format, addDays, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/** Clave de documento del diario: YYYY-MM-DD en hora local. */
export function claveFecha(fecha = new Date()) {
  return format(fecha, 'yyyy-MM-dd')
}

export function aFecha(clave) {
  return typeof clave === 'string' ? parseISO(clave) : clave
}

/** "Hoy", "Ayer" o "lunes, 3 de marzo". */
export function etiquetaFecha(clave) {
  const fecha = aFecha(clave)
  if (isToday(fecha)) return 'Hoy'
  if (isYesterday(fecha)) return 'Ayer'
  return format(fecha, "EEEE, d 'de' MMMM", { locale: es })
}

export function fechaLarga(clave) {
  return format(aFecha(clave), "d 'de' MMMM 'de' yyyy", { locale: es })
}

export function fechaCorta(clave) {
  return format(aFecha(clave), 'd MMM', { locale: es })
}

export function desplazarDias(clave, dias) {
  return claveFecha(addDays(aFecha(clave), dias))
}

/** Últimos N días en orden cronológico, como claves YYYY-MM-DD. */
export function ultimosDias(n = 7, desde = new Date()) {
  return Array.from({ length: n }, (_, i) => claveFecha(addDays(desde, i - n + 1)))
}

export function esFuturo(clave) {
  return aFecha(clave) > new Date()
}
