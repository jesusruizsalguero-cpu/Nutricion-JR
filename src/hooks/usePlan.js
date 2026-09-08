import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import * as planesService from '@/services/planes'
import { generarPlan, regenerarDia } from '@/utils/generadorDieta'
import {
  ajustarCantidad,
  anadirAlimento,
  crearPlanVacio,
  ErrorEdicion,
  quitarAlimento,
} from '@/utils/edicionPlan'

/**
 * Plan de dieta activo del usuario. La generación es local (no cuesta nada
 * recalcularla) y solo se sube a Firestore el resultado, para que el mismo
 * plan se vea igual en cualquier dispositivo.
 */
export function usePlan() {
  const { uid, datos, metas } = useAuth()
  const planActivo = datos?.planActivo ?? null

  const [plan, setPlan] = useState(null)
  const [cargando, setCargando] = useState(Boolean(planActivo))
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid || !planActivo) {
      setPlan(null)
      setCargando(false)
      return undefined
    }

    setCargando(true)
    return planesService.escucharPlan(
      uid,
      planActivo,
      (documento) => {
        setPlan(documento)
        setCargando(false)
      },
      (e) => {
        console.error('[Plan] No se pudo leer el plan:', e)
        setError(e)
        setCargando(false)
      },
    )
  }, [uid, planActivo])

  const generar = useCallback(
    async ({ numeroComidas = 4, dias = 7 } = {}) => {
      if (!uid || !datos?.perfil || !metas) return null

      setTrabajando(true)
      setError(null)
      try {
        const nuevo = generarPlan({ perfil: datos.perfil, metas, numeroComidas, dias })
        const id = await planesService.guardarPlan(uid, nuevo)
        return id
      } catch (e) {
        console.error('[Plan] No se pudo generar el plan:', e)
        setError(e)
        return null
      } finally {
        setTrabajando(false)
      }
    },
    [uid, datos?.perfil, metas],
  )

  const cambiarDia = useCallback(
    async (indiceDia) => {
      if (!uid || !plan || !datos?.perfil) return

      setTrabajando(true)
      try {
        const actualizado = regenerarDia(plan, indiceDia, datos.perfil)
        setPlan(actualizado) // respuesta inmediata; Firestore confirma después
        await planesService.actualizarPlan(uid, plan.id, quitarId(actualizado))
      } catch (e) {
        console.error('[Plan] No se pudo regenerar el día:', e)
        setError(e)
      } finally {
        setTrabajando(false)
      }
    },
    [uid, plan, datos?.perfil],
  )

  /**
   * Aplica una edición manual sobre el plan y la guarda. Se pinta al momento
   * y Firestore confirma después: retocar gramos debe sentirse inmediato.
   */
  const editar = useCallback(
    async (operacion, argumentos) => {
      if (!uid || !plan || !datos?.perfil) return

      setError(null)
      try {
        const { plan: modificado } = operacion(plan, datos.perfil, argumentos)
        setPlan(modificado)
        await planesService.actualizarPlan(uid, plan.id, quitarId(modificado))
      } catch (e) {
        if (e instanceof ErrorEdicion) setError(e)
        else {
          console.error('[Plan] No se pudo editar:', e)
          setError(new Error('No se ha podido guardar el cambio.'))
        }
      }
    },
    [uid, plan, datos?.perfil],
  )

  const cambiarGramos = useCallback(
    (dia, comida, alimento, gramos) => editar(ajustarCantidad, { dia, comida, alimento, gramos }),
    [editar],
  )

  const anadir = useCallback(
    (dia, comida, alimento, gramos) => editar(anadirAlimento, { dia, comida, alimento, gramos }),
    [editar],
  )

  const quitar = useCallback(
    (dia, comida, alimento) => editar(quitarAlimento, { dia, comida, alimento }),
    [editar],
  )

  /** Crea un plan vacío para montarlo a mano y lo deja como plan activo. */
  const crearVacio = useCallback(
    async ({ numeroComidas = 4, dias = 7 } = {}) => {
      if (!uid || !datos?.perfil || !metas) return null

      setTrabajando(true)
      setError(null)
      try {
        const vacio = crearPlanVacio({ perfil: datos.perfil, metas, numeroComidas, dias })
        return await planesService.guardarPlan(uid, vacio, { nombre: vacio.nombre })
      } catch (e) {
        console.error('[Plan] No se pudo crear la dieta vacía:', e)
        setError(e)
        return null
      } finally {
        setTrabajando(false)
      }
    },
    [uid, datos?.perfil, metas],
  )

  return {
    plan,
    cargando,
    trabajando,
    error,
    generar,
    cambiarDia,
    crearVacio,
    cambiarGramos,
    anadir,
    quitar,
  }
}

/** El id es del documento, no del contenido: no debe volver a guardarse dentro. */
function quitarId({ id, ...resto }) {
  return resto
}
