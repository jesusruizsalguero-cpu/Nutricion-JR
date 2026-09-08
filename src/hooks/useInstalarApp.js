import { useCallback, useEffect, useState } from 'react'

/**
 * Botón de instalación propio, en vez de depender de que cada persona
 * encuentre la opción en el menú de su navegador — en Chrome/Edge está
 * escondida un par de niveles adentro, y en algún perfil de Edge hemos visto
 * que directamente no aparece aunque la app cumpla todos los requisitos.
 *
 * El navegador dispara `beforeinstallprompt` cuando decide que la página es
 * instalable. Por defecto también mostraría su propio aviso; `preventDefault()`
 * lo cancela y guarda el evento para lanzarlo nosotros cuando el usuario pulse
 * el botón, con nuestro propio texto y en el sitio de la app que queramos.
 */
export function useInstalarApp() {
  const [promptGuardado, setPromptGuardado] = useState(null)
  const [instalada, setInstalada] = useState(estaEnModoInstalado())
  // Entre que el usuario acepta y llega `appinstalled` pasa un instante en
  // que ya no hay prompt guardado pero tampoco está instalada todavía: sin
  // este estado, la interfaz caería un momento al mensaje de "tu navegador
  // no lo ofrece", justo después de que el usuario haya dicho que sí.
  const [instalando, setInstalando] = useState(false)

  useEffect(() => {
    function alPoderInstalar(evento) {
      evento.preventDefault()
      setPromptGuardado(evento)
    }
    function alInstalar() {
      setInstalada(true)
      setInstalando(false)
      setPromptGuardado(null)
    }

    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!promptGuardado) return null

    promptGuardado.prompt()
    const { outcome } = await promptGuardado.userChoice
    // El evento solo se puede usar una vez, aceptes o no: aparezca o no otro
    // aviso más adelante, hace falta esperar a un nuevo beforeinstallprompt.
    setPromptGuardado(null)
    if (outcome === 'accepted') setInstalando(true)
    return outcome
  }, [promptGuardado])

  return {
    instalada,
    instalando,
    disponible: Boolean(promptGuardado),
    // Ni instalada ni con el evento disponible: o ya se descartó el aviso en
    // este navegador, o es un navegador (Safari/iOS) que no dispara este
    // evento — ahí se muestran instrucciones manuales en vez de un botón.
    esIOS: esIOS(),
    instalar,
  }
}

function estaEnModoInstalado() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Propiedad específica de Safari en iOS; no existe en el resto.
    window.navigator.standalone === true
  )
}

function esIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS 13+ se identifica como Mac, pero con pantalla táctil.
  const iPadModerno = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/i.test(ua) || iPadModerno
}
