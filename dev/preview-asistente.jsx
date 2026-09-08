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
  { id: '1', rol: 'usuario', texto: '¿Puedo cambiar el arroz de la comida por pasta? ¿Cuánta pondría?' },
  {
    id: '2',
    rol: 'asistente',
    texto:
      'Sí, puedes. Para mantener las mismas calorías, pon 80-90 g de pasta en crudo en lugar de los 300 g de arroz cocido.\n\nSi la quieres integral, la cantidad es la misma y ganas fibra. Recuerda que el plan es orientativo: si cambias varias cosas, regenera la dieta desde "Mi dieta" para que las cuentas cuadren.',
  },
  { id: '3', rol: 'usuario', texto: '¿Y si entreno justo antes de comer?' },
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
