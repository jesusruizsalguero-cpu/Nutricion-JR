import { Navigate, Route, Routes } from 'react-router-dom'
import { configuracionIncompleta } from '@/config/firebase'
import RutaProtegida from '@/routes/RutaProtegida'
import RutaPublica from '@/routes/RutaPublica'
import Layout from '@/components/layout/Layout'
import AvisoConfiguracion from '@/components/AvisoConfiguracion'

import Login from '@/pages/Login'
import Registro from '@/pages/Registro'
import Onboarding from '@/pages/Onboarding'
import Panel from '@/pages/Panel'
import Diario from '@/pages/Diario'
import Alimentos from '@/pages/Alimentos'
import Progreso from '@/pages/Progreso'
import Perfil from '@/pages/Perfil'
import NoEncontrado from '@/pages/NoEncontrado'

export default function App() {
  // Sin claves de Firebase la app no puede hacer nada útil: mejor decirlo claro.
  if (configuracionIncompleta) {
    return <AvisoConfiguracion />
  }

  return (
    <Routes>
      {/* Públicas — si ya hay sesión, redirigen al panel */}
      <Route element={<RutaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      {/* Privadas */}
      <Route element={<RutaProtegida />}>
        <Route path="/bienvenida" element={<Onboarding />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Panel />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/diario/:fecha" element={<Diario />} />
          <Route path="/alimentos" element={<Alimentos />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
      </Route>

      <Route path="/404" element={<NoEncontrado />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
