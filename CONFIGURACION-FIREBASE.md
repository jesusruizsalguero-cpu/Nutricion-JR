# Configuración de Firebase — Autenticación + Firestore

Proyecto: **nutricion-jr**

Este proyecto usa solo **Authentication** y **Firestore**. No usa Firebase
Storage — no hace falta activarlo en la consola.

Los pasos 1–3 hay que hacerlos en la consola web (requieren tu sesión de Google).
El paso 4 en adelante es en tu máquina.

---

## 1. Habilitar Authentication

Consola → **Compilación → Authentication → Comenzar**

https://console.firebase.google.com/project/nutricion-jr/authentication/providers

En la pestaña **Método de acceso**, habilita **únicamente**:

| Proveedor | Qué configurar |
| --- | --- |
| **Google** | Actívalo y elige un *correo de asistencia del proyecto*. |

La app usa solo SSO con Google: no hay registro por correo y contraseña, así que
no hace falta habilitar ese proveedor.

Luego, en la pestaña **Settings → Dominios autorizados**, comprueba que estén:

- `localhost` (viene por defecto — necesario para `npm run dev`)
- tu dominio de producción, cuando lo tengas

---

## 2. Crear la base de datos Firestore

Consola → **Compilación → Firestore Database → Crear base de datos**

https://console.firebase.google.com/project/nutricion-jr/firestore

- **Modo:** empieza en *modo de producción* (bloquea todo). Las reglas reales
  se despliegan en el paso 5; no uses modo de prueba, caduca a los 30 días y
  deja la base abierta mientras tanto.
- **Ubicación:** `eur3 (europe-west)` si estás en España. **No se puede cambiar
  después**, así que elígela con calma.

---

## 3. Registrar la app web y copiar las claves

Consola → **Configuración del proyecto (⚙) → Tus apps → Web (`</>`)**

https://console.firebase.google.com/project/nutricion-jr/settings/general

Registra la app (por ejemplo, con el alias `nutricion-jr-web`) y copia el bloque
`firebaseConfig` que aparece al terminar. Pasa cada valor al archivo `.env`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=nutricion-jr.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nutricion-jr
VITE_FIREBASE_STORAGE_BUCKET=nutricion-jr.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

> Estas claves **no son secretas**: viajan dentro del bundle del navegador y
> cualquiera puede leerlas. Lo que protege tus datos son las reglas de
> seguridad del paso 5, no ocultar la `apiKey`.

`.env` está en `.gitignore`; `.env.example` sí se versiona, sin valores.

---

## 4. Instalar dependencias

Node.js no está instalado en este equipo. Instálalo primero:

```bash
winget install OpenJS.NodeJS.LTS
```

Cierra y vuelve a abrir la terminal para que `node` entre en el `PATH`, y luego:

```bash
npm install
```

---

## 5. Desplegar las reglas y los índices

Las reglas ya están escritas en el repo (`firestore.rules`) y los índices en
`firestore.indexes.json`. Para subirlas:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

`.firebaserc` ya apunta a `nutricion-jr`, así que no hace falta `firebase use`.

### Qué protegen esas reglas

- `usuarios/{uid}` y todas sus subcolecciones (`diario`, `progreso`,
  `favoritos`): **solo su dueño** puede leer y escribir.
- `alimentos/{id}`: cualquier usuario autenticado lee los públicos y los suyos;
  solo el creador puede editar o borrar los suyos, y no puede reasignar el
  campo `creadoPor`.
- Todo lo que no esté contemplado queda **denegado por defecto**.

---

## 6. Comprobar que funciona

```bash
npm run dev
```

Si el `.env` está vacío, la app no revienta: muestra una pantalla de aviso con
estos mismos pasos (`src/components/AvisoConfiguracion.jsx`).

Con las claves puestas, entra desde `/login` con **Continuar con Google**.
Deberías ver:

- un usuario nuevo en **Authentication → Usuarios**
- un documento nuevo en **Firestore → `usuarios/{uid}`**

> El acceso abre una ventana emergente de Google. Si el navegador la bloquea
> verás el aviso correspondiente: permite las ventanas emergentes para
> `localhost` y vuelve a intentarlo.

---

## Modelo de datos

```
usuarios/{uid}
  uid, email, nombre, fotoURL, onboardingCompleto, creadoEn
  perfil: { sexo, fechaNacimiento, altura, peso, nivelActividad, objetivo }
  metas:  { calorias, proteinas, carbohidratos, grasas, agua, tmb, gastoTotal }

  diario/{YYYY-MM-DD}
    fecha, agua, notas
    items/{itemId}
      alimentoId, nombre, marca, comida, gramos, unidad,
      kcal, proteinas, carbohidratos, grasas, fibra, azucares, sodio

  progreso/{id}
    fecha, peso, grasaCorporal, cintura, cadera, pecho, notas

alimentos/{id}          ← catálogo compartido
  nombre, nombreBusqueda, marca, categoria, unidadBase,
  kcal, proteinas, carbohidratos, grasas, fibra, azucares, sodio,
  porcionHabitual, publico, creadoPor
```

Dos decisiones que conviene recordar:

- **Los macros se guardan ya calculados en cada item del diario.** Si alguien
  corrige el alimento en el catálogo, tu registro de ayer no cambia.
- **`nombreBusqueda`** es el nombre en minúsculas y sin acentos. Firestore no
  tiene búsqueda de texto completo, así que se consulta por rango de prefijo
  (`>= texto` y `<= texto + U+F8FF`). De ahí los índices compuestos.

---

## Emuladores (opcional, para desarrollar sin tocar producción)

```bash
firebase emulators:start
```

Y en `.env`: `VITE_USAR_EMULADORES=true`. Puertos: Auth `9099`,
Firestore `8080`, interfaz `4000`.
