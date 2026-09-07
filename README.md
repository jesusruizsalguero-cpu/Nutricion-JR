# Nutrición JR

Aplicación web que **diseña una dieta personalizada**: calcula las necesidades
energéticas a partir de la edad, el peso, la altura, el deporte practicado y el
objetivo, aplica las restricciones de las patologías declaradas y genera un plan
semanal de comidas con alimentos y gramajes, además de la lista de la compra.

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS 4**
- **Firebase** (Authentication con Google SSO, Firestore)
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

La configuración de Firebase (Authentication + Firestore) está detallada paso a
paso en [CONFIGURACION-FIREBASE.md](CONFIGURACION-FIREBASE.md).

## Estructura

```
src/
  components/   UI, layout, nutrición y alimentos
  config/       inicialización de Firebase
  context/      AuthContext
  components/
    dieta/      menú del día y lista de la compra
    perfil/     secciones del formulario de perfil
  data/         catálogo de alimentos (valores por 100 g)
  hooks/        useAuth, usePlan, useDiario, useProgreso
  pages/        Login (Google SSO), Onboarding, Panel, MiDieta, Perfil
  routes/       rutas públicas y protegidas
  services/     acceso a Firestore (usuarios, planes, alimentos, diario)
  utils/        nutricion (metas), salud (patologías y deporte),
                generadorDieta (motor del plan), fechas y formato
dev/            vista previa de la dieta sin Firebase (solo desarrollo)
```

## Cómo se diseña la dieta

1. **Metas diarias** (`src/utils/nutricion.js`) — metabolismo basal con
   Mifflin-St Jeor, por el factor de actividad, más el gasto real de los
   entrenamientos prorrateado por día. Después se aplica el ajuste del objetivo
   (perder grasa, ganar músculo, fondo físico…) y el de las patologías, con un
   suelo de seguridad: nunca por debajo del metabolismo basal.
2. **Restricciones** (`src/utils/salud.js`) — cada patología declara qué
   alimentos excluye, cómo mueve el reparto de macros y qué aviso mostrar.
   Las preferencias y alergias son filtros duros sobre el catálogo.
3. **Generación** (`src/utils/generadorDieta.js`) — cada comida se compone de
   huecos por rol (proteína, guarnición, verdura, grasa). Se prueban varias
   combinaciones y, en cada una, se ajustan los gramos por descenso de
   coordenadas hasta acercarse a las calorías y macros de esa comida. Es
   determinista: la misma semilla da el mismo plan.

Los planes se guardan en `usuarios/{uid}/planes/{planId}` y el usuario apunta al
activo en `planActivo`.

> El plan es orientativo. La app no diagnostica ni sustituye a un
> dietista-nutricionista, y así se indica en pantalla.

## Configuración

Las claves de Firebase van en `.env` (no se versiona). Las de `.env.example`
no son secretas —viajan en el bundle del navegador—; la seguridad real está en
`firestore.rules`.
