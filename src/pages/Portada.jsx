import { ArrowRight, Salad } from 'lucide-react'

/**
 * Portada: la pantalla de arranque de la app, se vea con sesión iniciada o
 * sin ella. Además de dar la bienvenida, deja claro de dónde salen los datos
 * nutricionales — no de estimaciones propias, sino de las dos bases de
 * composición de alimentos que la sustentan.
 *
 * Recibe las acciones en vez de enlaces porque se pinta por encima de las
 * rutas, no como una de ellas: un <Link> cambiaría la dirección pero dejaría
 * la portada delante.
 *
 * La altura sale del contenedor fijo que la envuelve (h-full), no de unidades
 * de viewport: instalada en iOS, 100vh/dvh incluye la franja de la barra de
 * estado, y lo que sobresale de un contenedor fijo no se puede alcanzar
 * haciendo scroll — el pie quedaba cortado.
 */
export default function Portada({ onEntrar, onVerFuentes }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-marca-700 via-marca-600 to-marca-800">
      {/* Dos halos suaves para que el fondo no sea un plano liso. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-marca-400/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-marca-900/40 blur-3xl"
      />

      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-7 rounded-3xl bg-white/15 p-5 ring-1 ring-white/25 backdrop-blur-sm">
          <Salad className="size-14 text-white" aria-hidden="true" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">NUTRICIÓN-JR</h1>

        <p className="mt-4 max-w-sm text-balance text-sm text-marca-50/90 sm:text-base">
          Tu dieta calculada según tu edad, deporte y condición física.
        </p>

        <nav className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={onEntrar}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5
                       text-sm font-semibold text-marca-800 shadow-lg transition-colors
                       hover:bg-marca-50 active:bg-marca-100"
          >
            Entrar
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onVerFuentes}
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3
                       text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Fuentes de datos nutricionales
          </button>
        </nav>
      </main>

      <footer className="relative px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
        <p className="text-xs text-marca-100/80">Datos nutricionales de</p>
        <p className="mt-1 text-xs font-medium text-white/90">USDA FoodData Central y BEDCA</p>
      </footer>
    </div>
  )
}
