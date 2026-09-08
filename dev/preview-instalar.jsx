/**
 * Vista previa del botón de instalar sin Firebase ni sesión (la sección real
 * vive en /perfil, que exige estar logueado). Simula el evento
 * `beforeinstallprompt` que dispara el navegador de verdad.
 * Archivo de desarrollo: no entra en el bundle de la app.
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, Download, Share } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import { useInstalarApp } from '@/hooks/useInstalarApp'
import '@/index.css'

function SeccionInstalarDemo() {
  const { instalada, instalando, disponible, esIOS, instalar } = useInstalarApp()
  const [resultado, setResultado] = useState(null)

  async function alInstalar() {
    const desenlace = await instalar()
    setResultado(desenlace)
  }

  return (
    <div className="tarjeta">
      <h2 className="mb-4 font-semibold text-slate-900">Instalar la app</h2>
      {instalada ? (
        <p className="flex items-center gap-2 text-sm text-marca-700">
          <Check className="size-4 shrink-0" /> Ya la tienes instalada en este dispositivo.
        </p>
      ) : instalando ? (
        <p className="text-sm text-slate-500">Instalando…</p>
      ) : disponible ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Instálala para abrirla desde el icono.</p>
          <Boton icono={Download} onClick={alInstalar}>
            Instalar aplicación
          </Boton>
        </div>
      ) : resultado === 'dismissed' ? (
        <p className="text-sm text-slate-500">
          Vale, no se ha instalado. Recarga la página más tarde si quieres volver a intentarlo.
        </p>
      ) : esIOS ? (
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <Share className="mt-0.5 size-4 shrink-0" />
          Toca compartir y «Añadir a pantalla de inicio».
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          Tu navegador todavía no ofrece instalarla desde aquí.
        </p>
      )}
    </div>
  )
}

function Demo() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <h1 className="text-xl font-bold text-slate-900">Vista previa · Instalar la app</h1>
      <SeccionInstalarDemo />
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <button
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white"
          onClick={() => {
            const evento = new Event('beforeinstallprompt', { cancelable: true })
            evento.prompt = () => {}
            evento.userChoice = Promise.resolve({ outcome: 'accepted' })
            window.dispatchEvent(evento)
          }}
        >
          Simular beforeinstallprompt (aceptará)
        </button>
        <button
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white"
          onClick={() => {
            const evento = new Event('beforeinstallprompt', { cancelable: true })
            evento.prompt = () => {}
            evento.userChoice = Promise.resolve({ outcome: 'dismissed' })
            window.dispatchEvent(evento)
          }}
        >
          Simular beforeinstallprompt (cancelará)
        </button>
        <button
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white"
          onClick={() => window.dispatchEvent(new Event('appinstalled'))}
        >
          Simular appinstalled
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Demo />)
