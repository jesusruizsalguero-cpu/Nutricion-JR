import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as diarioService from '@/services/diario'
import { agruparPorComida, sumarTotales } from '@/utils/nutricion'

/**
 * Estado del diario para una fecha concreta (YYYY-MM-DD).
 * Los totales se derivan de los items, no se cachean en Firestore, para que
 * nunca puedan quedar desincronizados.
 */
export function useDiario(fecha) {
  const { uid } = useAuth()
  const [items, setItems] = useState([])
  const [dia, setDia] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid || !fecha) return undefined

    setCargando(true)
    setError(null)

    const cancelarItems = diarioService.escucharItemsDelDia(
      uid,
      fecha,
      (lista) => {
        setItems(lista)
        setCargando(false)
      },
      (e) => {
        setError(e)
        setCargando(false)
      },
    )
    const cancelarDia = diarioService.escucharDia(uid, fecha, setDia, setError)

    return () => {
      cancelarItems()
      cancelarDia()
    }
  }, [uid, fecha])

  const totales = useMemo(() => sumarTotales(items), [items])
  const porComida = useMemo(() => agruparPorComida(items), [items])

  const agregar = useCallback(
    (datos) => diarioService.agregarItem(uid, fecha, datos),
    [uid, fecha],
  )

  const actualizar = useCallback(
    (itemId, datos) => diarioService.actualizarItem(uid, fecha, itemId, datos),
    [uid, fecha],
  )

  const eliminar = useCallback(
    (itemId) => diarioService.eliminarItem(uid, fecha, itemId),
    [uid, fecha],
  )

  const agregarAgua = useCallback(
    (ml) => diarioService.registrarAgua(uid, fecha, ml),
    [uid, fecha],
  )

  return {
    items,
    porComida,
    totales,
    agua: dia?.agua ?? 0,
    notas: dia?.notas ?? '',
    cargando,
    error,
    agregar,
    actualizar,
    eliminar,
    agregarAgua,
    guardarNotas: (notas) => diarioService.guardarNotas(uid, fecha, notas),
  }
}
