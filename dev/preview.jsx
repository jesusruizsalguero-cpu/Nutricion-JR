/**
 * Vista previa de las pantallas de dieta sin pasar por Firebase.
 * Archivo de desarrollo: no forma parte del bundle de la app (index.html).
 * Se abre en http://localhost:PUERTO/dev/preview.html
 */
import { createRoot } from 'react-dom/client'
import ComidaPlan from '@/components/dieta/ComidaPlan'
import ListaCompra from '@/components/dieta/ListaCompra'
import BarrasMacros from '@/components/nutricion/BarrasMacros'
import AnilloCalorias from '@/components/nutricion/AnilloCalorias'
import { calcularMetas } from '@/utils/nutricion'
import { generarPlan } from '@/utils/generadorDieta'
import '@/index.css'

const perfil = {
  sexo: 'mujer',
  fechaNacimiento: '1981-06-01',
  altura: 165,
  peso: 88,
  nivelActividad: 'sedentario',
  objetivo: 'perder',
  deporte: 'caminar',
  sesionesSemana: 3,
  minutosSesion: 45,
  patologias: ['diabetes2', 'hipertension'],
  preferencias: [],
  numeroComidas: 5,
}

const metas = calcularMetas(perfil)
const plan = generarPlan({ perfil, metas, numeroComidas: 5, dias: 7, semilla: 'vista-previa' })
const dia = plan.dias[0]

createRoot(document.getElementById('root')).render(
  <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
    <h1 className="text-xl font-bold text-slate-900">Vista previa · {dia.nombre}</h1>

    <div className="tarjeta grid items-center gap-6 sm:grid-cols-2">
      <AnilloCalorias consumidas={dia.totales.kcal} meta={metas.calorias} />
      <BarrasMacros totales={dia.totales} metas={metas} />
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {dia.comidas.map((comida) => (
        <ComidaPlan key={comida.id} comida={comida} />
      ))}
    </div>

    <ListaCompra items={plan.listaCompra} dias={plan.dias.length} />
  </div>,
)
