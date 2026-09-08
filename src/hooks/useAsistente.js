import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import * as asistenteService from '@/services/asistente'
import { calcularEdad } from '@/utils/nutricion'

/**
 * Conversación con el asistente. Los mensajes se guardan en Firestore para que
 * la charla siga ahí al recargar o al entrar desde otro dispositivo.
 */
export function useAsistente() {
  const { uid, datos, metas } = useAuth()
  const { plan } = usePlan()

  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return undefined

    setCargando(true)
    return asistenteService.escucharConversacion(
      uid,
      (lista) => {
        setMensajes(lista)
        setCargando(false)
      },
      (e) => {
        console.error('[Asistente] No se pudo leer la conversación:', e)
        setError('No se ha podido cargar la conversación.')
        setCargando(false)
      },
    )
  }, [uid])

  // Lo que el asistente sabe del usuario: su perfil, sus metas y el menú de hoy.
  const contexto = useMemo(() => {
    const perfil = datos?.perfil
    return {
      nombre: datos?.nombre ?? null,
      perfil: perfil
        ? {
            sexo: perfil.sexo,
            edad: calcularEdad(perfil.fechaNacimiento),
            altura: perfil.altura,
            peso: perfil.peso,
            objetivo: perfil.objetivo,
            nivelActividad: perfil.nivelActividad,
            deporte: perfil.deporte,
            sesionesSemana: perfil.sesionesSemana,
            minutosSesion: perfil.minutosSesion,
            patologias: perfil.patologias ?? [],
            preferencias: perfil.preferencias ?? [],
          }
        : null,
      metas: metas ?? null,
      menuDeHoy: resumirMenuDeHoy(plan),
    }
  }, [datos, metas, plan])

  const enviar = useCallback(
    async (texto) => {
      const limpio = texto.trim()
      if (!limpio || !uid || pensando) return

      setError(null)
      setPensando(true)

      // El mensaje del usuario se guarda antes de preguntar: si la respuesta
      // falla, lo escrito no se pierde y se puede reintentar.
      const historial = [...mensajes, { rol: 'usuario', texto: limpio }]
      try {
        await asistenteService.guardarMensaje(uid, { rol: 'usuario', texto: limpio })
      } catch (e) {
        console.error('[Asistente] No se pudo guardar el mensaje:', e)
      }

      try {
        const respuesta = await asistenteService.preguntar(
          historial.map(({ rol, texto: contenido }) => ({ rol, texto: contenido })),
          contexto,
        )
        await asistenteService.guardarMensaje(uid, { rol: 'asistente', texto: respuesta })
      } catch (e) {
        setError(e.message)
      } finally {
        setPensando(false)
      }
    },
    [uid, mensajes, contexto, pensando],
  )

  const limpiar = useCallback(async () => {
    if (!uid) return
    try {
      await asistenteService.borrarConversacion(uid)
      setError(null)
    } catch (e) {
      console.error('[Asistente] No se pudo borrar la conversación:', e)
      setError('No se ha podido borrar la conversación.')
    }
  }, [uid])

  return { mensajes, cargando, pensando, error, enviar, limpiar }
}

/** El menú del día en el formato compacto que espera el Worker. */
function resumirMenuDeHoy(plan) {
  if (!plan?.dias?.length) return null

  // El plan empieza en lunes y getDay() devuelve 0 para el domingo.
  const indice = ((new Date().getDay() + 6) % 7) % plan.dias.length
  const dia = plan.dias[indice]

  return {
    nombre: dia.nombre,
    kcal: dia.totales?.kcal ?? null,
    comidas: (dia.comidas ?? []).map((comida) => ({
      etiqueta: comida.etiqueta,
      alimentos: (comida.alimentos ?? [])
        .map((alimento) => `${alimento.nombre} ${alimento.gramos} g`)
        .join(', '),
    })),
  }
}
