import { Apple, BookOpen, LayoutDashboard, TrendingUp, User } from 'lucide-react'

/** Enlaces compartidos por la barra lateral y la navegación inferior. */
export const ENLACES = [
  { a: '/', etiqueta: 'Panel', icono: LayoutDashboard, exacto: true },
  { a: '/diario', etiqueta: 'Diario', icono: BookOpen },
  { a: '/alimentos', etiqueta: 'Alimentos', icono: Apple },
  { a: '/progreso', etiqueta: 'Progreso', icono: TrendingUp },
  { a: '/perfil', etiqueta: 'Perfil', icono: User },
]
