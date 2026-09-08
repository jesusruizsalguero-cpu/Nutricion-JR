/**
 * Catálogo de suplementos y reglas de recomendación.
 *
 * Criterio de qué entra aquí: solo suplementos con respaldo razonable y
 * márgenes de seguridad amplios. Quedan fuera a propósito los quemagrasas,
 * los "testosterone boosters" y cualquier cosa cuyo perfil de riesgo no se
 * pueda valorar sin una analítica.
 *
 * Nada de esto sustituye a un médico. La app lo repite en pantalla, y varias
 * reglas directamente frenan la recomendación cuando hay una patología por
 * medio (el riñón y el embarazo son los casos claros).
 *
 * Cada suplemento declara:
 *   nombre       cómo se conoce en la tienda
 *   descripcion  qué hace, en una frase
 *   momento      cuándo tomarlo
 *   cuando(p)    si aplica a este perfil; recibe { perfil, metas, edad }
 *   motivo(p)    por qué se le recomienda a esta persona en concreto
 *   evitarSi(p)  motivo por el que NO se le debe recomendar, si lo hay
 */

import { DEPORTES } from '@/utils/salud'

const tieneDeporte = (perfil, ...cuales) =>
  (perfil.deportes ?? []).some((d) => cuales.includes(d))

// Caminar y el yoga no crean la demanda de proteína que justifica un
// suplemento: para eso hace falta algún deporte de intensidad.
const DEPORTES_SUAVES = ['caminar', 'yoga']

const entrenaFuerte = (perfil) =>
  (perfil.sesionesSemana ?? 0) >= 3 &&
  (perfil.deportes ?? []).some((d) => !DEPORTES_SUAVES.includes(d))

const tiene = (perfil, patologia) => (perfil.patologias ?? []).includes(patologia)

export const SUPLEMENTOS = [
  {
    id: 'proteina-suero',
    nombre: 'Proteína de suero (whey)',
    descripcion:
      'Proteína de rápida absorción. No es imprescindible —la comida cuenta igual—, pero ayuda a llegar a la proteína del día cuando cuesta con solo alimentos.',
    momento: 'Después de entrenar, o en cualquier comida a la que le falte proteína.',
    cuando: ({ perfil, metas }) =>
      entrenaFuerte(perfil) && metas?.proteinaPorKg >= 1.6 && !(perfil.preferencias ?? []).includes('vegano'),
    motivo: ({ metas }) =>
      `Tu meta es de ${Math.round(metas.proteinas)} g de proteína al día (${metas.proteinaPorKg.toFixed(1)} g/kg), y esa cifra cuesta cubrirla solo con comida.`,
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'renal')
        ? 'Con enfermedad renal la proteína se controla por prescripción médica, no se suplementa por libre.'
        : (perfil.preferencias ?? []).includes('sinLactosa')
          ? 'Llevas lactosa marcada: si lo tomas, que sea un aislado o una proteína vegetal.'
          : null,
  },
  {
    id: 'proteina-vegetal',
    nombre: 'Proteína vegetal (guisante y arroz)',
    descripcion:
      'Alternativa sin lácteos. Combinando guisante y arroz el perfil de aminoácidos queda completo.',
    momento: 'Después de entrenar, o repartida en las comidas con menos proteína.',
    cuando: ({ perfil, metas }) =>
      entrenaFuerte(perfil) &&
      metas?.proteinaPorKg >= 1.6 &&
      (perfil.preferencias ?? []).some((p) => ['vegano', 'vegetariano', 'sinLactosa'].includes(p)),
    motivo: () => 'Encaja con las preferencias alimentarias que has marcado y evita los lácteos.',
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'renal')
        ? 'Con enfermedad renal la proteína se controla por prescripción médica.'
        : null,
  },
  {
    id: 'creatina',
    nombre: 'Creatina monohidrato',
    descripcion:
      'De los suplementos deportivos, el que más evidencia acumula. Mejora el rendimiento en esfuerzos cortos e intensos y ayuda a ganar fuerza.',
    momento: '3-5 g al día, a la hora que te resulte cómoda. Da igual antes o después de entrenar.',
    cuando: ({ perfil }) =>
      tieneDeporte(perfil, 'fuerza', 'crossfit', 'combate', 'equipo', 'raqueta') &&
      (perfil.sesionesSemana ?? 0) >= 2,
    motivo: ({ perfil }) => {
      const cuales = (perfil.deportes ?? [])
        .filter((d) => ['fuerza', 'crossfit', 'combate', 'equipo', 'raqueta'].includes(d))
        .map((d) => DEPORTES[d]?.etiqueta?.toLowerCase())
        .filter(Boolean)
      return `Practicas ${cuales.join(' y ')}, donde el esfuerzo es corto e intenso, que es justo donde la creatina rinde.`
    },
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'renal')
        ? 'Con enfermedad renal no se recomienda sin que lo valore tu nefrólogo.'
        : tiene(perfil, 'embarazo')
          ? 'En el embarazo no hay datos suficientes para recomendarla.'
          : null,
  },
  {
    id: 'vitamina-d',
    nombre: 'Vitamina D3',
    descripcion:
      'Interviene en el hueso, el músculo y el sistema inmune. El déficit es muy común en España pese al sol, sobre todo en invierno.',
    momento: 'Con una comida que lleve grasa, para que se absorba. Cualquier momento del día.',
    cuando: () => true,
    motivo: () =>
      'El déficit es frecuente incluso aquí. Antes de tomarla, pide que te miren los niveles en una analítica: la dosis depende de eso.',
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'renal')
        ? 'Con enfermedad renal la vitamina D se ajusta con analíticas; que la pauten en consulta.'
        : null,
  },
  {
    id: 'omega-3',
    nombre: 'Omega-3 (EPA y DHA)',
    descripcion:
      'Ácidos grasos del pescado azul. Tienen efecto sobre triglicéridos e inflamación.',
    momento: 'Con la comida principal, para que siente mejor y se absorba.',
    cuando: ({ perfil }) =>
      (perfil.preferencias ?? []).some((p) => ['vegano', 'vegetariano', 'sinPescado'].includes(p)) ||
      tiene(perfil, 'colesterol'),
    motivo: ({ perfil }) =>
      tiene(perfil, 'colesterol')
        ? 'Tienes el colesterol marcado, y el omega-3 actúa sobre el perfil lipídico.'
        : 'No tomas pescado azul, que es de donde se saca el EPA y el DHA. Búscalo de algas si eres vegano.',
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'embarazo')
        ? 'En el embarazo elige uno específico y sin vitamina A; que te lo confirme tu matrona o tu médico.'
        : null,
  },
  {
    id: 'vitamina-b12',
    nombre: 'Vitamina B12',
    descripcion:
      'Solo está en alimentos de origen animal. En dieta vegana no es opcional: su déficit es neurológico y tarda años en dar la cara.',
    momento: 'Una dosis semanal (2000 µg) o una diaria pequeña. Da igual el momento del día.',
    cuando: ({ perfil }) => (perfil.preferencias ?? []).includes('vegano'),
    motivo: () => 'Sigues una dieta vegana, y la B12 no se obtiene de fuentes vegetales.',
    evitarSi: () => null,
  },
  {
    id: 'hierro',
    nombre: 'Hierro',
    descripcion:
      'El hierro de origen vegetal se absorbe peor. Ojo: suplementarlo sin déficit real no es inocuo, así que hace falta analítica antes.',
    momento: 'En ayunas y con vitamina C (un zumo de naranja). Nunca junto a lácteos, café o té.',
    cuando: ({ perfil }) =>
      (perfil.preferencias ?? []).includes('vegano') ||
      ((perfil.preferencias ?? []).includes('vegetariano') && perfil.sexo === 'mujer'),
    motivo: () =>
      'Tu alimentación aporta hierro de peor absorción. Confírmalo con una analítica antes de tomar nada: el exceso de hierro también hace daño.',
    evitarSi: () => 'Solo si una analítica confirma el déficit. No lo tomes por tu cuenta.',
  },
  {
    id: 'cafeina',
    nombre: 'Cafeína',
    descripcion:
      'Mejora el rendimiento y la percepción de esfuerzo. 3 mg por kg de peso es la dosis habitual.',
    momento: '30-60 minutos antes de entrenar. Evítala por la tarde si te cuesta dormir.',
    // En el embarazo no se propone siquiera: la cafeína ahí se limita, no se
    // busca. Recomendarla con una advertencia sería un mensaje contradictorio.
    cuando: ({ perfil }) =>
      (perfil.sesionesSemana ?? 0) >= 3 &&
      (perfil.deportes ?? []).some((d) => !DEPORTES_SUAVES.includes(d)) &&
      !tiene(perfil, 'embarazo'),
    motivo: ({ perfil }) =>
      `Entrenas ${perfil.sesionesSemana} veces por semana y la cafeína es de lo más contrastado para rendir en esas sesiones.`,
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'hipertension')
        ? 'Con hipertensión sube la tensión de forma puntual: consúltalo antes.'
        : null,
  },
  {
    id: 'magnesio',
    nombre: 'Magnesio',
    descripcion:
      'Participa en la contracción muscular y el descanso. Útil si la dieta va corta de verdura, legumbre y fruto seco.',
    momento: 'Por la noche, con la cena.',
    cuando: ({ perfil }) => (perfil.sesionesSemana ?? 0) >= 4 || tiene(perfil, 'sii'),
    motivo: ({ perfil }) =>
      tiene(perfil, 'sii')
        ? 'Con intestino irritable la dieta suele quedarse corta de alimentos ricos en magnesio.'
        : 'Con tu volumen de entrenamiento las necesidades suben.',
    evitarSi: ({ perfil }) =>
      tiene(perfil, 'renal')
        ? 'Con enfermedad renal el magnesio se acumula: no lo tomes sin control médico.'
        : null,
  },
  {
    id: 'yodo-folico',
    nombre: 'Ácido fólico y yodo',
    descripcion:
      'Suplementación estándar en el embarazo. El fólico previene defectos del tubo neural y el yodo interviene en el desarrollo neurológico.',
    momento: 'Una vez al día, con el desayuno.',
    cuando: ({ perfil }) => tiene(perfil, 'embarazo'),
    motivo: () => 'Es la pauta habitual durante el embarazo, y aquí la dosis la marca tu médico.',
    evitarSi: () => 'Debe pautarlo tu médico o tu matrona: la dosis y el momento dependen de tu caso.',
  },
]

/**
 * Suplementos que encajan con este perfil.
 * Los que tienen un motivo para evitarse no se descartan sin más: se muestran
 * con la advertencia, porque saber por qué algo NO te conviene es tan útil
 * como la propia recomendación.
 */
export function recomendarSuplementos(perfil, metas) {
  if (!perfil || !metas) return []

  const contexto = { perfil, metas }

  return SUPLEMENTOS.filter((s) => {
    try {
      return s.cuando(contexto)
    } catch {
      return false
    }
  }).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    momento: s.momento,
    motivo: s.motivo(contexto),
    advertencia: s.evitarSi(contexto),
  }))
}
