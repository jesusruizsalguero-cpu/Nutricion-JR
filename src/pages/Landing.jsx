import { ArrowRight, Smartphone, Apple, Download, Zap, BarChart3, Users } from 'lucide-react'

export default function Landing({ onEntrar }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-marca-50">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-marca-100 p-2">
              <Zap className="size-5 text-marca-700" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Nutrición JR</h1>
          </div>
          <button
            type="button"
            onClick={onEntrar}
            className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-marca-700 transition-colors"
          >
            Entrar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
        {/* Hero */}
        <section className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Tu dieta personalizada
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Calcula tu plan nutricional según tu edad, peso, deporte y condición física.
            Datos reales de USDA y BEDCA.
          </p>
          <button
            type="button"
            onClick={onEntrar}
            className="inline-flex items-center gap-2 rounded-xl bg-marca-600 px-8 py-4
                       text-base font-semibold text-white hover:bg-marca-700 transition-colors
                       shadow-lg hover:shadow-xl"
          >
            Empezar ahora
            <ArrowRight className="size-5" />
          </button>
        </section>

        {/* Features */}
        <section className="grid sm:grid-cols-3 gap-8 mb-20">
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-lg bg-marca-100 p-3">
              <BarChart3 className="size-6 text-marca-700" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Planes ajustados</h3>
            <p className="text-sm text-slate-600">
              Macros y calorías calculadas exactamente para tu objetivo
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-lg bg-marca-100 p-3">
              <Users className="size-6 text-marca-700" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Para cualquiera</h3>
            <p className="text-sm text-slate-600">
              Atletas, sedentarios, con patologías: cada uno su dieta
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-lg bg-marca-100 p-3">
              <Smartphone className="size-6 text-marca-700" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Sin internet</h3>
            <p className="text-sm text-slate-600">
              Funciona offline. Instálala en tu móvil como app
            </p>
          </div>
        </section>

        {/* Instalación */}
        <section className="mb-20">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Cómo instalar
          </h3>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* iOS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                <Apple className="size-8 text-slate-900" />
                <h4 className="text-xl font-semibold text-slate-900">iPhone / iPad</h4>
              </div>
              <ol className="space-y-4 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">1.</span> Abre esta
                  página en Safari
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2.</span> Toca el icono
                  de Compartir (cuadrado con flecha)
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3.</span> Elige &quot;Añadir
                  a pantalla de inicio&quot;
                </li>
                <li>
                  <span className="font-semibold text-slate-900">4.</span> Confirma el
                  nombre y pulsa Añadir
                </li>
              </ol>
              <p className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                ℹ️ La app funcionará sin conexión usando los datos que ya hayas consultado
              </p>
            </div>

            {/* Android */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="size-8 text-slate-900" />
                <h4 className="text-xl font-semibold text-slate-900">Android</h4>
              </div>
              <ol className="space-y-4 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">1.</span> Abre esta
                  página en Chrome, Edge o Firefox
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2.</span> Toca el menú
                  (⋮ tres puntos arriba a la derecha)
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3.</span> Busca
                  &quot;Instalar&quot; o &quot;Añadir a pantalla de inicio&quot;
                </li>
                <li>
                  <span className="font-semibold text-slate-900">4.</span> Confirma y
                  listo
                </li>
              </ol>
              <p className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                ℹ️ Se actualiza automáticamente. No necesitas descargar nada
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">💡 Consejo:</span> Una vez instalada,
              aparece como una app más en tu pantalla de inicio. Se abre sin barra de
              navegador, igual que cualquier app nativa.
            </p>
          </div>
        </section>

        {/* APK */}
        <section className="mb-20 rounded-2xl bg-gradient-to-br from-marca-50 to-marca-100 border border-marca-200 p-8 sm:p-12">
          <div className="flex items-start gap-4 mb-4">
            <Download className="size-8 text-marca-700 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-xl font-semibold text-marca-900 mb-2">
                ¿Prefieres un APK?
              </h4>
              <p className="text-marca-800 mb-4">
                Si usas Android y prefieres una descarga clásica, disponemos de APK
                firmado. Es exactamente lo mismo que la PWA instalada, con las mismas
                actualizaciones automáticas.
              </p>
              <p className="text-sm text-marca-700">
                Está disponible en las <strong>Releases</strong> del repositorio de
                GitHub. La PWA es más sencilla y no requiere descargas.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Preguntas frecuentes
          </h3>

          <div className="space-y-4">
            <details className="group rounded-lg border border-slate-200 bg-white p-6 cursor-pointer">
              <summary className="font-semibold text-slate-900 flex items-center justify-between select-none">
                ¿Es gratis?
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-sm text-slate-600">
                Sí, completamente gratis. Solo necesitas una cuenta de Google para
                iniciar sesión.
              </p>
            </details>

            <details className="group rounded-lg border border-slate-200 bg-white p-6 cursor-pointer">
              <summary className="font-semibold text-slate-900 flex items-center justify-between select-none">
                ¿Mis datos son privados?
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-sm text-slate-600">
                Sí. Tu perfil y dieta se guardan encriptados en servidores de Firebase
                (Google). Solo tú tienes acceso.
              </p>
            </details>

            <details className="group rounded-lg border border-slate-200 bg-white p-6 cursor-pointer">
              <summary className="font-semibold text-slate-900 flex items-center justify-between select-none">
                ¿Funciona sin internet?
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-sm text-slate-600">
                Parcialmente. La dieta y los datos nutricionales que hayas consultado
                se guardan. La sincronización con el servidor se retoma cuando hay
                conexión.
              </p>
            </details>

            <details className="group rounded-lg border border-slate-200 bg-white p-6 cursor-pointer">
              <summary className="font-semibold text-slate-900 flex items-center justify-between select-none">
                ¿Puedo usar la web en lugar de instalar?
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-sm text-slate-600">
                Por supuesto. La app funciona igual en el navegador. Instalarla solo te
                da un acceso más rápido desde la pantalla de inicio.
              </p>
            </details>
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center py-12">
          <h3 className="text-3xl font-bold text-slate-900 mb-4">Listo para empezar</h3>
          <p className="text-slate-600 mb-8">
            Tu dieta personalizada te espera
          </p>
          <button
            type="button"
            onClick={onEntrar}
            className="inline-flex items-center gap-2 rounded-xl bg-marca-600 px-8 py-4
                       text-base font-semibold text-white hover:bg-marca-700 transition-colors
                       shadow-lg hover:shadow-xl"
          >
            Entrar a Nutrición JR
            <ArrowRight className="size-5" />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-20 py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-slate-600">
          <p className="mb-2">Datos nutricionales de</p>
          <p className="font-medium text-slate-900">USDA FoodData Central y BEDCA</p>
        </div>
      </footer>
    </div>
  )
}
