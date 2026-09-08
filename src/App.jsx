import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { configuracionIncompleta } from '@/config/firebase'
import RutaProtegida from '@/routes/RutaProtegida'
import RutaPublica from '@/routes/RutaPublica'
import RutaAdmin from '@/routes/RutaAdmin'
import AvisoConfiguracion from '@/components/AvisoConfiguracion'
import ActualizacionApp from '@/components/ActualizacionApp'
import Layout from '@/components/layout/Layout'

import Portada from '@/pages/Portada'
import Fuentes from '@/pages/Fuentes'
import Login from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import Panel from '@/pages/Panel'
import MiDieta from '@/pages/MiDieta'
import Perfil from '@/pages/Perfil'
import Asistente from '@/pages/Asistente'
import Suplementacion from '@/pages/Suplementacion'
import Admin from '@/pages/Admin'

/** Marca de que la portada ya se ha visto en esta apertura de la app. */
const CLAVE_PORTADA = 'portadaVista'

export default function App() {
  const navegar = useNavigate()

  // La portada se muestra al abrir la app, con sesión o sin ella, pero no
  // vuelve a aparecer al navegar dentro. Se recuerda en sessionStorage, que
  // se vacía al cerrar la pestaña: en la siguiente apertura vuelve a salir.
  const [portadaPendiente, setPortadaPendiente] = useState(() => {
    try {
      return sessionStorage.getItem(CLAVE_PORTADA) !== 'si'
    } catch {
      // Navegador con el almacenamiento bloqueado: mejor enseñarla que romper.
      return true
    }
  })

  function cerrarPortada(destino) {
    try {
      sessionStorage.setItem(CLAVE_PORTADA, 'si')
    } catch {
      // Si no se puede guardar, la portada volverá a salir; no es grave.
    }
    if (destino) navegar(destino)
    setPortadaPendiente(false)
  }

  return (
    <>
      {/* Independiente de Firebase: el service worker se registra igualmente
          aunque falte la configuración, para poder avisar de actualizaciones
          incluso en esa pantalla. */}
      <ActualizacionApp />

      {/* La portada se pinta ENCIMA de las rutas, no en su lugar. Si las
          sustituyera, al cerrarla las rutas se montarían en la dirección
          anterior y la redirección de RutaProtegida se llevaría por delante
          el destino pedido. Montadas debajo, la navegación es la última
          palabra. */}
      {!configuracionIncompleta && portadaPendiente && (
        <div className="fixed inset-0 z-50">
          <Portada onEntrar={() => cerrarPortada()} onVerFuentes={() => cerrarPortada('/fuentes')} />
        </div>
      )}

      {/* Sin claves de Firebase la app no puede hacer nada útil: mejor decirlo claro. */}
      {configuracionIncompleta ? (
        <AvisoConfiguracion />
      ) : (
        <Routes>
          {/* La procedencia de los datos se puede consultar sin cuenta. */}
          <Route path="/fuentes" element={<Fuentes />} />

          <Route element={<RutaPublica />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Privadas */}
          <Route element={<RutaProtegida />}>
            {/* El asistente inicial ocupa la pantalla entera, sin navegación */}
            <Route path="/bienvenida" element={<Onboarding />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Panel />} />
              <Route path="/dieta" element={<MiDieta />} />
              <Route path="/asistente" element={<Asistente />} />
              <Route path="/suplementacion" element={<Suplementacion />} />
              <Route path="/perfil" element={<Perfil />} />

              {/* Zona de administración: solo accesible para uids en la whitelist */}
              <Route element={<RutaAdmin />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  )
}
