import { Loader2 } from 'lucide-react'

export default function Cargando({ pantallaCompleta = false, mensaje }) {
  const contenido = (
    <div className="flex flex-col items-center gap-3 text-slate-500">
      <Loader2 className="size-7 animate-spin text-marca-600" />
      {mensaje && <p className="text-sm">{mensaje}</p>}
      <span className="sr-only">Cargando</span>
    </div>
  )

  if (pantallaCompleta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">{contenido}</div>
    )
  }

  return <div className="flex justify-center py-12">{contenido}</div>
}

/** Bloque gris con pulso, para placeholders de listas y tarjetas. */
export function Esqueleto({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
}
