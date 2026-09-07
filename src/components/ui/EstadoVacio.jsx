export default function EstadoVacio({ icono: Icono, titulo, descripcion, accion }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {Icono && (
        <div className="mb-3 rounded-full bg-slate-100 p-3">
          <Icono className="size-6 text-slate-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-slate-500">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}
