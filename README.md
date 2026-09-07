# Nutrición JR

Aplicación web para el seguimiento de nutrición diaria: registro de comidas,
macronutrientes, agua y progreso corporal.

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS 4**
- **Firebase** (Auth, Firestore, Storage)
- **React Router 7**, **Recharts**, **date-fns**, **lucide-react**

## Puesta en marcha

```bash
npm install
cp .env.example .env   # rellena los valores de tu app web de Firebase
npm run dev
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | ESLint |
| `npm run seed` | Siembra el catálogo de alimentos |

## Estructura

```
src/
  components/   UI, layout, nutrición y alimentos
  config/       inicialización de Firebase
  context/      AuthContext
  hooks/        useAuth, useDiario, useProgreso
  pages/        Login, Registro, Onboarding
  routes/       rutas públicas y protegidas
  services/     acceso a Firestore
  utils/        fechas, formato y cálculos nutricionales
```

## Configuración

Las claves de Firebase van en `.env` (no se versiona). Las de `.env.example`
no son secretas —viajan en el bundle del navegador—; la seguridad real está en
`firestore.rules` y `storage.rules`.
