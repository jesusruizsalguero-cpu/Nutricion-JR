import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function UsageCard() {
  const { usuario } = useAuth()
  const [uso, setUso] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) return

    const cargar = async () => {
      try {
        const token = await usuario.getIdToken()
        const baseUrl = import.meta.env.VITE_ASISTENTE_URL || 'http://localhost:8787'
        const resp = await fetch(`${baseUrl}/usage`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!resp.ok) throw new Error('Error al cargar uso')
        const datos = await resp.json()
        setUso(datos)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [usuario])

  if (!usuario || cargando) return null
  if (error) return <div className="text-xs text-red-500">Uso: Error</div>

  return (
    uso && (
      <div className="fixed bottom-20 right-4 bg-gray-900 text-white text-xs p-3 rounded border border-gray-700 max-w-xs">
        <div className="font-mono text-gray-400 mb-2">Uso API hoy</div>
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span>{uso.consultas}/{uso.limite}</span>
            <span className="text-green-400">${uso.costoEstimado}</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div
              className={`h-full rounded transition-all ${
                uso.porcentaje > 80 ? 'bg-red-500' : uso.porcentaje > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(uso.porcentaje, 100)}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">{uso.porcentaje}% del límite diario</div>
      </div>
    )
  )
}
