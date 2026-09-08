import { Bot, LayoutDashboard, Pill, User, UtensilsCrossed } from 'lucide-react'

/** Enlaces compartidos por la barra lateral y la navegación inferior. */
export const ENLACES = [
  { a: '/', etiqueta: 'Hoy', icono: LayoutDashboard, exacto: true },
  { a: '/dieta', etiqueta: 'Mi dieta', icono: UtensilsCrossed },
  { a: '/asistente', etiqueta: 'Asistente', icono: Bot },
  { a: '/suplementacion', etiqueta: 'Suplementos', icono: Pill },
  { a: '/perfil', etiqueta: 'Perfil', icono: User },
]
