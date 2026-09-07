import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Salad } from 'lucide-react'
import Boton from '@/components/ui/Boton'
import Campo from '@/components/ui/Campo'
import { registrar, iniciarSesionConGoogle } from '@/services/autenticacion'
import { mensajeErrorAuth } from '@/utils/formato'

export default function Registro() {
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', repetir: '' })
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)

  function cambiar(campo, valor) {
    setDatos((previo) => ({ ...previo, [campo]: valor }))
    if (errores[campo]) setErrores((previo) => ({ ...previo, [campo]: null }))
  }

  function validar() {
    const nuevos = {}
    if (!datos.nombre.trim()) nuevos.nombre = 'Dinos cómo te llamas.'
    if (datos.password.length < 6) nuevos.password = 'Mínimo 6 caracteres.'
    if (datos.password !== datos.repetir) nuevos.repetir = 'Las contraseñas no coinciden.'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!validar()) return

    setCargando(true)
    try {
      await registrar(datos)
      // Tras registrarse, <RutaProtegida> lleva al onboarding.
    } catch (e) {
      setErrores({ general: mensajeErrorAuth(e.code) })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 rounded-2xl bg-marca-600 p-3">
            <Salad className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Empieza a registrar tus comidas hoy</p>
        </div>

        <form onSubmit={enviar} className="tarjeta space-y-4">
          <Campo
            etiqueta="Nombre"
            autoComplete="name"
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            error={errores.nombre}
            placeholder="Jesús Ruiz"
            required
          />
          <Campo
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="email"
            value={datos.email}
            onChange={(e) => cambiar('email', e.target.value)}
            placeholder="tu@correo.com"
            required
          />
          <Campo
            etiqueta="Contraseña"
            type="password"
            autoComplete="new-password"
            value={datos.password}
            onChange={(e) => cambiar('password', e.target.value)}
            error={errores.password}
            ayuda="Al menos 6 caracteres."
            required
          />
          <Campo
            etiqueta="Repite la contraseña"
            type="password"
            autoComplete="new-password"
            value={datos.repetir}
            onChange={(e) => cambiar('repetir', e.target.value)}
            error={errores.repetir}
            required
          />

          {errores.general && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errores.general}
            </p>
          )}

          <Boton type="submit" anchoCompleto cargando={cargando}>
            Crear cuenta
          </Boton>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">o</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Boton
            variante="secundario"
            anchoCompleto
            onClick={iniciarSesionConGoogle}
            disabled={cargando}
          >
            Continuar con Google
          </Boton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-marca-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
