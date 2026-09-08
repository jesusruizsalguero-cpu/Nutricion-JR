import { Outlet } from 'react-router-dom'
import BarraLateral from '@/components/layout/BarraLateral'
import BarraInferior from '@/components/layout/BarraInferior'
import Encabezado from '@/components/layout/Encabezado'
import { UsageCard } from '@/components/UsageCard'

/** Escritorio: barra lateral fija. Móvil: encabezado + navegación inferior. */
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <BarraLateral />

      <div className="lg:pl-64">
        <Encabezado />

        <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BarraInferior />
      <UsageCard />
    </div>
  )
}
