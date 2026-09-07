import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as limitar,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { normalizar } from '@/utils/formato'

const coleccion = () => collection(db, 'alimentos')

// U+F8FF: el último carácter del área de uso privado. Sirve como cota
// superior para convertir "empieza por X" en un rango que Firestore entiende.
const FIN_PREFIJO = String.fromCharCode(0xf8ff)

/**
 * Búsqueda por prefijo. Firestore no tiene full-text, así que guardamos
 * `nombreBusqueda` normalizado y consultamos el rango [texto, texto+FIN_PREFIJO].
 */
export async function buscarAlimentos(termino, { uid, categoria = null, tope = 25 } = {}) {
  const texto = normalizar(termino)

  const restricciones = [where('publico', '==', true)]
  if (categoria) restricciones.push(where('categoria', '==', categoria))
  if (texto) {
    restricciones.push(
      where('nombreBusqueda', '>=', texto),
      where('nombreBusqueda', '<=', texto + FIN_PREFIJO),
    )
  }
  restricciones.push(orderBy('nombreBusqueda'), limitar(tope))

  const publicos = await getDocs(query(coleccion(), ...restricciones))
  const resultados = publicos.docs.map(mapear)

  // Los alimentos propios del usuario se muestran primero.
  if (uid) {
    const propios = await getDocs(
      query(coleccion(), where('creadoPor', '==', uid), orderBy('nombreBusqueda'), limitar(tope)),
    )
    const coincidencias = propios.docs
      .map(mapear)
      .filter((a) => !texto || a.nombreBusqueda?.startsWith(texto))
      .filter((a) => !resultados.some((r) => r.id === a.id))
    return [...coincidencias, ...resultados]
  }

  return resultados
}

export async function obtenerAlimento(id) {
  const snapshot = await getDoc(doc(db, 'alimentos', id))
  return snapshot.exists() ? mapear(snapshot) : null
}

export async function listarMisAlimentos(uid) {
  const snapshot = await getDocs(
    query(coleccion(), where('creadoPor', '==', uid), orderBy('nombreBusqueda')),
  )
  return snapshot.docs.map(mapear)
}

/** Los valores nutricionales siempre se guardan por 100 g / 100 ml. */
export async function crearAlimento(uid, datos) {
  const referencia = await addDoc(coleccion(), {
    nombre: datos.nombre.trim(),
    nombreBusqueda: normalizar(datos.nombre),
    marca: datos.marca?.trim() || null,
    categoria: datos.categoria || 'otros',
    unidadBase: datos.unidadBase || 'g',
    kcal: Number(datos.kcal) || 0,
    proteinas: Number(datos.proteinas) || 0,
    carbohidratos: Number(datos.carbohidratos) || 0,
    grasas: Number(datos.grasas) || 0,
    fibra: Number(datos.fibra) || 0,
    azucares: Number(datos.azucares) || 0,
    sodio: Number(datos.sodio) || 0,
    porcionHabitual: Number(datos.porcionHabitual) || 100,
    publico: Boolean(datos.publico),
    creadoPor: uid,
    creadoEn: serverTimestamp(),
  })
  return referencia.id
}

export async function actualizarAlimento(id, datos) {
  const cambios = { ...datos, actualizadoEn: serverTimestamp() }
  if (datos.nombre) cambios.nombreBusqueda = normalizar(datos.nombre)
  await updateDoc(doc(db, 'alimentos', id), cambios)
}

export async function eliminarAlimento(id) {
  await deleteDoc(doc(db, 'alimentos', id))
}

function mapear(snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

export const CATEGORIAS = [
  { id: 'frutas', etiqueta: 'Frutas' },
  { id: 'verduras', etiqueta: 'Verduras y hortalizas' },
  { id: 'carnes', etiqueta: 'Carnes' },
  { id: 'pescados', etiqueta: 'Pescados y mariscos' },
  { id: 'lacteos', etiqueta: 'Lácteos y huevos' },
  { id: 'cereales', etiqueta: 'Cereales y tubérculos' },
  { id: 'legumbres', etiqueta: 'Legumbres' },
  { id: 'frutosSecos', etiqueta: 'Frutos secos y semillas' },
  { id: 'grasas', etiqueta: 'Aceites y grasas' },
  { id: 'bebidas', etiqueta: 'Bebidas' },
  { id: 'procesados', etiqueta: 'Procesados y snacks' },
  { id: 'otros', etiqueta: 'Otros' },
]
