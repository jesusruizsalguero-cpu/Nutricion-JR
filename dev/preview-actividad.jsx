/**
 * Vista previa de la sección de actividad/deportes (selección múltiple) sin
 * Firebase. Archivo de desarrollo: no entra en el bundle de la app.
 * Se abre en http://localhost:PUERTO/dev/preview-actividad.html
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PERFIL_VACIO, SeccionActividad } from '@/components/perfil/SeccionesPerfil'
import '@/index.css'

function Demo() {
  const [perfil, setPerfil] = useState({ ...PERFIL_VACIO, deportes: ['fuerza'] })
  const cambiar = (campo, valor) => setPerfil((previo) => ({ ...previo, [campo]: valor }))

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900">Vista previa · Actividad y deportes</h1>
      <div className="tarjeta">
        <SeccionActividad perfil={perfil} cambiar={cambiar} />
      </div>
      <pre className="rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
        {JSON.stringify(
          { deportes: perfil.deportes, sesionesSemana: perfil.sesionesSemana, minutosSesion: perfil.minutosSesion },
          null,
          2,
        )}
      </pre>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Demo />)
