import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import Boton from '@/components/ui/Boton'

/**
 * Registra el service worker y avisa cuando hay una versión nueva descargada.
 *
 * El service worker nuevo se instala en segundo plano en cuanto está
 * disponible, pero se queda esperando ("waiting") sin activarse: si se
 * activara solo, a media sesión podría cambiar el código bajo los pies del
 * usuario. `updateServiceWorker(true)` es lo que le dice que tome el control
 * y recargue, y aquí solo se llama cuando el usuario pulsa el botón.
 *
 * Vive en App.jsx, fuera de las rutas protegidas: así avisa igual si el
 * usuario está en el login que si está dentro de la app.
 */
export default function ActualizacionApp() {
  const [avisoDescartado, setAvisoDescartado] = useState(false)

  const {
    offlineReady: [listaSinConexion, setListaSinConexion],
    needRefresh: [hayActualizacion],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(url, registro) {
      if (!registro) return
      // Comprueba si hay versión nueva al volver a la pestaña, no solo al
      // cargar: es cuando más tiempo lleva la app abierta y más probable es
      // que haya un despliegue nuevo esperando.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registro.update()
      })
    },
    onRegisterError(error) {
      console.error('[PWA] No se pudo registrar el service worker:', error)
    },
  })

  // El aviso de "lista sin conexión" es informativo y se retira solo.
  useEffect(() => {
    if (!listaSinConexion) return undefined
    const temporizador = setTimeout(() => setListaSinConexion(false), 4000)
    return () => clearTimeout(temporizador)
  }, [listaSinConexion, setListaSinConexion])

  if (hayActualizacion && !avisoDescartado) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:pr-6">
        <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Hay una versión nueva</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Actualiza para tener los últimos cambios de Nutrición JR.
            </p>
            <div className="mt-3 flex gap-2">
              <Boton tamano="sm" icono={RefreshCw} onClick={() => updateServiceWorker(true)}>
                Actualizar
              </Boton>
              <Boton
                tamano="sm"
                variante="fantasma"
                onClick={() => setAvisoDescartado(true)}
              >
                Ahora no
              </Boton>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAvisoDescartado(true)}
            aria-label="Cerrar aviso"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  if (listaSinConexion) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:pr-6">
        <p className="rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg">
          Nutrición JR ya está lista para usarse sin conexión.
        </p>
      </div>
    )
  }

  return null
}
