import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import * as asistenteService from '@/services/asistente'
import { actualizarPlan } from '@/services/planes'
import { aplicarAccion, ErrorEdicion, prepararAlimentoNuevo } from '@/utils/edicionPlan'
import { crearAlimento, listarMisAlimentos } from '@/services/alimentos'
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
  // Alimentos que el usuario ha dado de alta desde el chat. Se cargan una vez
  // y se van sumando en memoria conforme se añaden.
  const [propios, setPropios] = useState([])
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

  useEffect(() => {
    if (!uid) return
    listarMisAlimentos(uid)
      .then((lista) => setPropios(lista.map(aFormatoDeCatalogo).filter(Boolean)))
      .catch((e) => console.error('[Asistente] No se pudieron leer tus alimentos:', e))
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
            deportes: perfil.deportes ?? [],
            sesionesSemana: perfil.sesionesSemana,
            minutosSesion: perfil.minutosSesion,
            patologias: perfil.patologias ?? [],
            preferencias: perfil.preferencias ?? [],
          }
        : null,
      metas: metas ?? null,
      menuDeHoy: resumirMenuDeHoy(plan),
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
      let disponibles = propios
      const resultados = []

      for (const accion of acciones) {
        try {
          if (accion.nombre === 'anadir_alimento') {
            const { dia, comida, quitar, ...datos } = accion.argumentos ?? {}
            const alimento = prepararAlimentoNuevo(datos)

            // Si ya lo dio de alta antes, se reutiliza en vez de duplicarlo.
            const yaExiste = disponibles.find((a) => a.id === alimento.id)
            if (!yaExiste) {
              await guardarAlimentoPropio(uid, alimento)
              disponibles = [...disponibles, alimento]
              setPropios(disponibles)
            }

            const alta = yaExiste
              ? `${alimento.nombre} ya estaba en tu lista.`
              : `He añadido ${alimento.nombre} a tu lista (${alimento.kcal} kcal por 100 g); compruébalo por si acaso.`

            // El modelo solo llama a una herramienta por respuesta, así que dar
            // de alta el alimento incluye colocarlo: si no, quedaba añadido pero
            // el menú seguía igual y parecía que no había hecho nada.
            if (dia && comida && quitar) {
              const { plan: modificado, descripcion } = aplicarAccion(
                planActual,
                perfil,
                { nombre: 'sustituir_alimento', argumentos: { dia, comida, quitar, poner: alimento.id } },
                disponibles,
              )
              planActual = modificado
              resultados.push({ exito: true, texto: `${alta} ${descripcion}` })
            } else {
              resultados.push({ exito: true, texto: alta })
            }
            continue
          }

          const { plan: modificado, descripcion, alimentoCreado } = aplicarAccion(
            planActual,
            perfil,
            accion,
            disponibles,
          )
          planActual = modificado

          // El asistente puede definir un alimento nuevo dentro de la propia
          // sustitución; si lo ha hecho, se guarda en la lista del usuario.
          if (alimentoCreado) {
            await guardarAlimentoPropio(uid, alimentoCreado)
            disponibles = [...disponibles, alimentoCreado]
            setPropios(disponibles)
          }

          resultados.push({ exito: true, texto: descripcion })
        } catch (e) {
          if (e instanceof ErrorEdicion) resultados.push({ exito: false, texto: e.message })
          else {
            console.error('[Asistente] Fallo al aplicar el cambio:', e)
            resultados.push({ exito: false, texto: 'No he podido hacer ese cambio.' })
          }
        }
      }

      // Solo se guarda si algún cambio ha prosperado.
      if (planActual !== plan && planActual?.id) {
        const { id, ...contenido } = planActual
        await actualizarPlan(uid, id, contenido)
      }

      return resultados
    },
    [plan, perfil, uid, propios],
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
          historialParaElModelo(historial),
          contexto,
        )

        const resultados = acciones.length > 0 ? await aplicarCambios(acciones) : []

        // Si se ha ejecutado algo, manda lo que ha pasado de verdad: el texto
        // del modelo en esos casos era ruido del tipo "voy a lanzar la
        // herramienta X", que además destapaba las tripas de la app.
        if (resultados.length > 0) {
          for (const resultado of resultados) {
            await asistenteService.guardarMensaje(uid, {
              rol: 'asistente',
              texto: resultado.texto,
              origen: 'accion',
              exito: resultado.exito,
            })
          }
        } else if (respuesta) {
          await asistenteService.guardarMensaje(uid, { rol: 'asistente', texto: respuesta })
        } else {
          await asistenteService.guardarMensaje(uid, {
            rol: 'asistente',
            texto: 'No he sabido qué responder. Prueba a decírmelo de otra forma.',
          })
        }
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

/**
 * Historial que se le manda al modelo.
 *
 * Se dejan fuera las confirmaciones de los cambios que SÍ salieron bien:
 * devolvérselas como turnos suyos le enseñaba el formato ("Hecho. En la cena he
 * cambiado...") y acababa escribiendo esas frases por su cuenta, sin llamar a
 * ninguna herramienta y sin que nada cambiara. El estado real ya le llega en el
 * menú del contexto, actualizado en cada turno.
 *
 * Los fallos sí se le devuelven, y esto importa: sin verlos repetía una y otra
 * vez la misma llamada imposible en vez de proponer otra cosa.
 */
function historialParaElModelo(mensajes) {
  return mensajes
    .filter((mensaje) => mensaje.origen !== 'accion' || mensaje.exito === false)
    .map(({ rol, texto }) => ({ rol, texto }))
}

/** Guarda en Firestore un alimento que el usuario ha dado de alta por el chat. */
function guardarAlimentoPropio(uid, alimento) {
  return crearAlimento(uid, {
    nombre: alimento.nombre,
    categoria: alimento.rol,
    kcal: alimento.kcal,
    proteinas: alimento.proteinas,
    carbohidratos: alimento.carbohidratos,
    grasas: alimento.grasas,
    fibra: alimento.fibra,
    sodio: alimento.sodio,
    publico: false,
  })
}

/**
 * Un alimento guardado en Firestore, con la forma que usan el generador y el
 * editor. Los alimentos propios se guardan con la categoría puesta al rol.
 */
function aFormatoDeCatalogo(alimento) {
  if (!alimento?.nombre) return null

  return {
    id: alimento.id,
    nombre: alimento.nombre,
    rol: alimento.categoria ?? 'proteina',
    origen: 'vegetal',
    kcal: alimento.kcal ?? 0,
    proteinas: alimento.proteinas ?? 0,
    carbohidratos: alimento.carbohidratos ?? 0,
    grasas: alimento.grasas ?? 0,
    saturadas: 0,
    fibra: alimento.fibra ?? 0,
    sodio: alimento.sodio ?? 0,
    contiene: [],
    ig: 'medio',
    purinas: 'bajo',
    potasio: 'medio',
    fodmap: 'bajo',
    racion: { min: 50, max: 300, paso: 10 },
    momentos: ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],
    propio: true,
  }
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
      // Sin identificadores: al verlos, el modelo acababa copiando la línea
      // entera ("Yogur de soja (yogur-soja) 250 g") como nombre del alimento.
      // El nombre a secas es lo que una persona diría, y el editor lo resuelve.
      alimentos: (comida.alimentos ?? [])
        .map((alimento) => `${alimento.nombre} ${alimento.gramos} g`)
        .join(', '),
    })),
  }
}
