import { Navigate, Route, Routes } from 'react-router-dom'
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
import Admin from '@/pages/Admin'

export default function App() {
  return (
    <>
      {/* Independiente de Firebase: el service worker se registra igualmente
          aunque falte la configuración, para poder avisar de actualizaciones
          incluso en esa pantalla. */}
      <ActualizacionApp />

      {/* Sin claves de Firebase la app no puede hacer nada útil: mejor decirlo claro. */}
      {configuracionIncompleta ? (
        <AvisoConfiguracion />
      ) : (
        <Routes>
          {/* La procedencia de los datos se puede consultar sin cuenta. */}
          <Route path="/fuentes" element={<Fuentes />} />

          {/* Públicas — si ya hay sesión, redirigen al panel */}
          <Route element={<RutaPublica />}>
            <Route path="/portada" element={<Portada />} />
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
