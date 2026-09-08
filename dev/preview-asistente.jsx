/**
 * Vista previa del chat del asistente sin Firebase ni backend.
 * Archivo de desarrollo: no entra en el bundle de la app (index.html).
 * Se abre en http://localhost:PUERTO/dev/preview-asistente.html
 */
import { createRoot } from 'react-dom/client'
import Conversacion from '@/components/asistente/Conversacion'
import '@/index.css'

const SUGERENCIAS = [
  '¿Puedo cambiar el arroz de hoy por pasta? ¿Cuánta pondría?',
  '¿Qué ceno si llego tarde de entrenar y tengo poco tiempo?',
  '¿Cómo reparto la proteína a lo largo del día?',
  'Dame una alternativa vegetariana para la comida de hoy.',
]

const CONVERSACION = [
  { id: '1', rol: 'usuario', texto: 'Cámbiame la pasta de la comida de hoy por arroz integral.' },
  {
    id: '2',
    rol: 'asistente',
    // Confirmación tal y como la redacta `edicionPlan.js` tras aplicar el cambio.
    texto:
      'Hecho. En comida del martes he cambiado Pasta cocida (480 g) por Arroz integral cocido (500 g). El día queda en 2988 kcal (-7 respecto a tu meta) y 145 g de proteína.',
  },
  { id: '3', rol: 'usuario', texto: 'Ponme también pan integral en el desayuno.' },
  {
    id: '4',
    rol: 'asistente',
    // Un cambio rechazado por el perfil: el modelo propone, manda el filtro de salud.
    texto: 'Pan integral no encaja con lo que tienes declarado (celiaquía), así que no te lo pongo.',
  },
  { id: '5', rol: 'usuario', texto: '¿Cuánta proteína llevo hoy?' },
]

createRoot(document.getElementById('root')).render(
  <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-500">Conversación en curso</h2>
      <div className="tarjeta flex min-h-[20rem] flex-col gap-4">
        <Conversacion mensajes={CONVERSACION} cargando={false} pensando={true} sugerencias={SUGERENCIAS} onElegirSugerencia={() => {}} />
      </div>
    </section>

    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-500">Pantalla inicial (sin mensajes)</h2>
      <div className="tarjeta flex min-h-[20rem] flex-col gap-4">
        <Conversacion mensajes={[]} cargando={false} pensando={false} sugerencias={SUGERENCIAS} onElegirSugerencia={() => {}} />
      </div>
    </section>
  </div>,
)
