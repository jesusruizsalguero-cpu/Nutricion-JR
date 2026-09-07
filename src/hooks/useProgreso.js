import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as progresoService from '@/services/progreso'

export function useProgreso() {
  const { uid } = useAuth()
  const [mediciones, setMediciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return undefined

    setCargando(true)
    return progresoService.escucharProgreso(
      uid,
      (lista) => {
        setMediciones(lista)
        setCargando(false)
      },
      (e) => {
        setError(e)
        setCargando(false)
      },
    )
  }, [uid])

  const registrar = useCallback(
    (medicion) => progresoService.registrarMedicion(uid, medicion),
    [uid],
  )

  const eliminar = useCallback((id) => progresoService.eliminarMedicion(uid, id), [uid])

  const ultimoPeso = mediciones.find((m) => m.peso)?.peso ?? null

  return { mediciones, ultimoPeso, cargando, error, registrar, eliminar }
}
