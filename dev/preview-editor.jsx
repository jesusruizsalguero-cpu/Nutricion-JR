/**
 * Vista previa del editor manual de la dieta y de "Crea tu dieta", sin
 * Firebase ni sesión. Archivo de desarrollo: no entra en el bundle.
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import EditorComida from '@/components/dieta/EditorComida'
import { calcularMetas } from '@/utils/nutricion'
import { generarPlan } from '@/utils/generadorDieta'
import { anadirAlimento, quitarAlimento, ajustarCantidad, crearPlanVacio, alimentosPermitidos, ErrorEdicion } from '@/utils/edicionPlan'
import '@/index.css'

const perfil = {
  sexo: 'hombre', fechaNacimiento: '1990-05-05', altura: 180, peso: 82,
  nivelActividad: 'ligero', objetivo: 'ganar', deportes: ['fuerza'],
  sesionesSemana: 4, minutosSesion: 60, patologias: [], preferencias: [], numeroComidas: 4,
}
const metas = calcularMetas(perfil)
const catalogo = alimentosPermitidos(perfil)

function Demo() {
  const [plan, setPlan] = useState(() => generarPlan({ perfil, metas, numeroComidas: 4, dias: 7, semilla: 'editor' }))
  const [vacio, setVacio] = useState(() => crearPlanVacio({ perfil, metas, numeroComidas: 4, dias: 7 }))
  const [error, setError] = useState(null)

  const aplicar = (cual, set) => (operacion, args) => {
    try {
      setError(null)
      set(operacion(cual, perfil, args).plan)
    } catch (e) {
      setError(e instanceof ErrorEdicion ? e.message : 'Error: ' + e.message)
    }
  }

  const editarPlan = aplicar(plan, setPlan)
  const editarVacio = aplicar(vacio, setVacio)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <section>
        <h1 className="mb-1 text-xl font-bold text-slate-900">Editar una dieta ya generada</h1>
        <p className="mb-3 text-sm text-slate-500">
          Lunes · {Math.round(plan.dias[0].totales.kcal)} kcal de {Math.round(plan.metas.calorias)}
        </p>
        <div className="grid gap-3">
          {plan.dias[0].comidas.slice(0, 2).map((c) => (
            <EditorComida key={c.id} comida={c} catalogo={catalogo}
              onAjustar={(a, g) => editarPlan(ajustarCantidad, { dia: 'Lunes', comida: c.id, alimento: a, gramos: g })}
              onQuitar={(a) => editarPlan(quitarAlimento, { dia: 'Lunes', comida: c.id, alimento: a })}
              onAnadir={(a, g) => editarPlan(anadirAlimento, { dia: 'Lunes', comida: c.id, alimento: a, gramos: g })} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold text-slate-900">Crea tu dieta (desde cero)</h2>
        <p className="mb-3 text-sm text-slate-500">
          Lunes · {Math.round(vacio.dias[0].totales.kcal)} kcal de {Math.round(vacio.metas.calorias)}
        </p>
        <div className="grid gap-3">
          {vacio.dias[0].comidas.slice(0, 2).map((c) => (
            <EditorComida key={c.id} comida={c} catalogo={catalogo}
              onAjustar={(a, g) => editarVacio(ajustarCantidad, { dia: 'Lunes', comida: c.id, alimento: a, gramos: g })}
              onQuitar={(a) => editarVacio(quitarAlimento, { dia: 'Lunes', comida: c.id, alimento: a })}
              onAnadir={(a, g) => editarVacio(anadirAlimento, { dia: 'Lunes', comida: c.id, alimento: a, gramos: g })} />
          ))}
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Demo />)
