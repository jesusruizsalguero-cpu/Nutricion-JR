import { Navigate, Route, Routes } from 'react-router-dom'
import { configuracionIncompleta } from '@/config/firebase'
import RutaProtegida from '@/routes/RutaProtegida'
import RutaPublica from '@/routes/RutaPublica'
import AvisoConfiguracion from '@/components/AvisoConfiguracion'
import Layout from '@/components/layout/Layout'

import Login from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import Panel from '@/pages/Panel'
import MiDieta from '@/pages/MiDieta'
import Perfil from '@/pages/Perfil'

export default function App() {
  // Sin claves de Firebase la app no puede hacer nada útil: mejor decirlo claro.
  if (configuracionIncompleta) {
    return <AvisoConfiguracion />
  }

  return (
    <Routes>
      {/* Pública — si ya hay sesión, redirige al panel */}
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
          <Route path="/perfil" element={<Perfil />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
