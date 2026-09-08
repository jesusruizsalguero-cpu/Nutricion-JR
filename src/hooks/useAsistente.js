import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import * as asistenteService from '@/services/asistente'
import { actualizarPlan } from '@/services/planes'
import { aplicarAccion, catalogoPermitido, ErrorEdicion } from '@/utils/edicionPlan'
import { calcularEdad, COMIDAS_POR_ID } from '@/utils/nutricion'

/**
 * Conversación con el asistente. Los mensajes se guardan en Firestore para que
 * la charla siga ahí al recargar o al entrar desde otro dispositivo.
 *
 * El asistente puede modificar la dieta: cuando el modelo pide un cambio, se
 * aplica aquí sobre el plan real y se guarda. El mensaje de confirmación lo
 * redacta el código con lo que ha ocurrido de verdad, no el modelo, para que
 * no pueda decir que ha cambiado algo que no ha cambiado.
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

  const perfil = datos?.perfil ?? null

  // Lo que el asistente sabe del usuario: su perfil, sus metas, el menú de hoy
  // y qué alimentos puede usar para sustituir.
  const contexto = useMemo(
    () => ({
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
      catalogo: perfil ? catalogoPermitido(perfil) : [],
    }),
    [datos, perfil, metas, plan],
  )

  /**
   * Aplica los cambios pedidos por el modelo y devuelve el texto que se le
   * enseña al usuario. Cada acción se valida por separado: si una falla, se
   * dice por qué y las demás siguen su curso.
   */
  const aplicarCambios = useCallback(
    async (acciones) => {
      let planActual = plan
      const resultados = []

      for (const accion of acciones) {
        try {
          const { plan: modificado, descripcion } = aplicarAccion(planActual, perfil, accion)
          planActual = modificado
          resultados.push(descripcion)
        } catch (e) {
          if (e instanceof ErrorEdicion) resultados.push(e.message)
          else {
            console.error('[Asistente] Fallo al aplicar el cambio:', e)
            resultados.push('No he podido hacer ese cambio.')
          }
        }
      }

      // Solo se guarda si algún cambio ha prosperado.
      if (planActual !== plan && planActual?.id) {
        const { id, ...contenido } = planActual
        await actualizarPlan(uid, id, contenido)
      }

      return resultados.join('\n\n')
    },
    [plan, perfil, uid],
  )

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
        const { respuesta, acciones } = await asistenteService.preguntar(
          historial.map(({ rol, texto: contenido }) => ({ rol, texto: contenido })),
          contexto,
        )

        const confirmacion = acciones.length > 0 ? await aplicarCambios(acciones) : ''
        const salida = [respuesta, confirmacion].filter(Boolean).join('\n\n')

        await asistenteService.guardarMensaje(uid, {
          rol: 'asistente',
          texto: salida || 'No he sabido qué responder. Prueba a decírmelo de otra forma.',
        })
      } catch (e) {
        setError(e.message)
      } finally {
        setPensando(false)
      }
    },
    [uid, mensajes, contexto, pensando, aplicarCambios],
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

  return { mensajes, cargando, pensando, error, enviar, limpiar, tienePlan: Boolean(plan) }
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
      id: comida.id,
      etiqueta: COMIDAS_POR_ID[comida.id]?.etiqueta ?? comida.etiqueta,
      // Con el id delante, el modelo puede nombrar los alimentos sin inventárselos.
      alimentos: (comida.alimentos ?? [])
        .map((alimento) => `${alimento.nombre} (${alimento.id}) ${alimento.gramos} g`)
        .join(', '),
    })),
  }
}
