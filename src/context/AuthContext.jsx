import { createContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { escucharUsuario } from '@/services/usuarios'
import { escucharEsAdmin } from '@/services/admin'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null) // credencial de Firebase Auth
  const [datos, setDatos] = useState(null) // documento en usuarios/{uid}
  const [esAdmin, setEsAdmin] = useState(false) // ¿está en la whitelist admins/{uid}?
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // `auth` es null cuando falta configurar Firebase (ver src/config/firebase.js);
    // en ese caso <AvisoConfiguracion> ya se encarga de informar al usuario.
    if (!auth) {
      setCargando(false)
      return undefined
    }

    return onAuthStateChanged(auth, (credencial) => {
      setUsuario(credencial)
      if (!credencial) {
        setDatos(null)
        setEsAdmin(false)
        setCargando(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!usuario) return undefined

    return escucharEsAdmin(
      usuario.uid,
      (valor) => setEsAdmin(valor),
      (error) => {
        console.error('[Auth] No se pudo comprobar el rol de administrador:', error)
        setEsAdmin(false)
      },
    )
  }, [usuario])

  // El documento del usuario se escucha en tiempo real: al cambiar el perfil
  // o las metas, toda la app se entera sin recargar.
  useEffect(() => {
    if (!usuario) return undefined

    setCargando(true)
    return escucharUsuario(
      usuario.uid,
      (documento) => {
        setDatos(documento)
        setCargando(false)
      },
      (error) => {
        console.error('[Auth] No se pudo leer el usuario:', error)
        setCargando(false)
      },
    )
  }, [usuario])

  const valor = useMemo(
    () => ({
      usuario,
      datos,
      cargando,
      autenticado: Boolean(usuario),
      uid: usuario?.uid ?? null,
      metas: datos?.metas ?? null,
      perfilCompleto: Boolean(datos?.onboardingCompleto),
      esAdmin,
    }),
    [usuario, datos, cargando, esAdmin],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
