import { AlertTriangle, ExternalLink } from 'lucide-react'

/**
 * Pantalla que sustituye a la app cuando faltan las claves de Firebase.
 * Evita el error críptico "auth/invalid-api-key" del SDK.
 */
export default function AvisoConfiguracion() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="tarjeta max-w-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2">
            <AlertTriangle className="size-5 text-amber-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Falta configurar Firebase</h1>
        </div>

        <p className="text-sm text-slate-600">
          Para que la aplicación funcione necesitas rellenar el archivo{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code> con las claves
          de tu app web.
        </p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Abre la{' '}
            <a
              href="https://console.firebase.google.com/project/nutricion-jr/settings/general"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-marca-700 underline"
            >
              configuración del proyecto
              <ExternalLink className="size-3" />
            </a>
          </li>
          <li>
            En <strong>Tus apps</strong>, crea o selecciona una <strong>App web</strong>.
          </li>
          <li>
            Copia los valores de <code className="text-xs">firebaseConfig</code> en el archivo{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>.
          </li>
          <li>Reinicia el servidor de desarrollo.</li>
        </ol>

        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
          {`VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=nutricion-jr.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nutricion-jr
VITE_FIREBASE_STORAGE_BUCKET=nutricion-jr.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123`}
        </pre>
      </div>
    </div>
  )
}
