import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, Users } from 'lucide-react'
import Cargando from '@/components/ui/Cargando'
import EstadoVacio from '@/components/ui/EstadoVacio'
import { useAuth } from '@/hooks/useAuth'
import { bloquearUsuario, desbloquearUsuario, listarUsuarios } from '@/services/admin'
import { fechaCorta } from '@/utils/fechas'

/**
 * Zona de administración: solo entra quien esté en la whitelist admins/{uid}
 * (ver RutaAdmin y firestore.rules). Para dar de alta a un admin hay que
 * crear el documento a mano en la consola de Firebase, en la colección
 * `admins`, con id = uid del usuario y campo `activo: true`.
 */
export default function Admin() {
  const { uid: miUid } = useAuth()
  const [usuarios, setUsuarios] = useState(null)
  const [error, setError] = useState(null)
  const [cambiando, setCambiando] = useState(null) // uid cuyo bloqueo se está guardando

  useEffect(() => {
    cargarUsuarios()
  }, [])

  function cargarUsuarios() {
    listarUsuarios()
      .then(setUsuarios)
      .catch((error) => {
        console.error('[Admin] No se pudo listar usuarios:', error)
        setError('No se pudo cargar la lista de usuarios.')
      })
  }

  async function alternarBloqueo(usuario) {
    setCambiando(usuario.id)
    try {
      if (usuario.bloqueado) {
        await desbloquearUsuario(usuario.id)
      } else {
        await bloquearUsuario(usuario.id)
      }
      setUsuarios((previo) =>
        previo.map((u) => (u.id === usuario.id ? { ...u, bloqueado: !u.bloqueado } : u)),
      )
    } catch (error) {
      console.error('[Admin] No se pudo cambiar el bloqueo:', error)
      setError('No se pudo guardar el cambio. Inténtalo de nuevo.')
    } finally {
      setCambiando(null)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-marca-600" aria-hidden="true" />
        <h1 className="text-xl font-bold text-slate-900">Administración</h1>
      </header>

      <div className="tarjeta">
        <h2 className="mb-4 font-semibold text-slate-900">Usuarios registrados</h2>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!error && !usuarios && <Cargando mensaje="Cargando usuarios…" />}

        {usuarios && usuarios.length === 0 && (
          <EstadoVacio
            icono={Users}
            titulo="Todavía no hay usuarios"
            descripcion="Aparecerán aquí en cuanto alguien inicie sesión con Google."
          />
        )}

        {usuarios && usuarios.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-medium">Nombre</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Onboarding</th>
                  <th className="py-2 pr-4 font-medium">Alta</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="py-2 pr-4 font-medium text-slate-900">{usuario.nombre}</td>
                    <td className="py-2 pr-4 text-slate-600">{usuario.email}</td>
                    <td className="py-2 pr-4">
                      {usuario.onboardingCompleto ? (
                        <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-medium text-marca-700">
                          Completo
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {usuario.creadoEn?.toDate ? fechaCorta(usuario.creadoEn.toDate()) : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {usuario.bloqueado ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Bloqueado
                        </span>
                      ) : (
                        <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-medium text-marca-700">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {usuario.id === miUid ? (
                        <span className="text-xs text-slate-400">Eres tú</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alternarBloqueo(usuario)}
                          disabled={cambiando === usuario.id}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            usuario.bloqueado
                              ? 'text-marca-700 hover:bg-marca-50'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {usuario.bloqueado ? (
                            <ShieldCheck className="size-4" aria-hidden="true" />
                          ) : (
                            <ShieldOff className="size-4" aria-hidden="true" />
                          )}
                          {usuario.bloqueado ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
