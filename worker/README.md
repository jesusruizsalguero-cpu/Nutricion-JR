# Backend del asistente (Cloudflare Worker)

Este Worker es el intermediario entre la app y la API de NVIDIA. Existe por una
razón concreta: **la clave de la IA no puede estar en el código de React**. Todo
lo que se importa desde `src/` acaba en el fichero JavaScript que descarga el
navegador, así que cualquiera podría abrir el inspector en la web publicada,
copiar la clave y gastar la cuota de la cuenta. Aquí la clave es un secreto del
Worker y nunca sale del servidor.

El endpoint tampoco es abierto: exige un ID token de Firebase válido y comprueba
su firma contra las claves públicas de Google. Sin eso sería un proxy de IA
gratuito para todo internet, pagado por esta cuenta.

## Qué hace

```
POST /  { mensajes: [{ rol, texto }], contexto: { nombre, perfil, metas, menuDeHoy } }
Authorization: Bearer <ID token de Firebase>
        ->  { respuesta: "..." }
```

- Valida el token (firma, proyecto, caducidad).
- Aplica un tope de 40 consultas por usuario y día, guardado en KV.
- Añade el perfil, el menú del día y el catálogo permitido al prompt.
- Llama al modelo `nvidia/nemotron-3.5-lightning-30b-a3b`.

## Modificar la dieta

El asistente puede cambiar el plan, no solo hablar de él. Se le ofrecen tres
herramientas (`sustituir_alimento`, `ajustar_cantidad`, `regenerar_dia`) y,
cuando el modelo las llama, el Worker **no las ejecuta**: devuelve la intención
al cliente en el campo `acciones`.

Quien las aplica es `src/utils/edicionPlan.js`, y esto es a propósito. Allí
están el catálogo y las reglas de salud, así que allí se puede validar: si el
modelo propone pan a un celíaco o un alimento que no existe, se rechaza con un
mensaje claro. El modelo propone; el código dispone.

El texto que confirma el cambio lo redacta el cliente con lo que ha ocurrido de
verdad —incluidas las calorías recalculadas—, nunca el modelo. Así no puede
decir "ya te lo he cambiado" sobre algo que no ha cambiado.

Detalle del modelo: hay que dejarle margen de tokens (`tokensRespuesta`) porque
al usar herramientas a veces razona antes de llamarlas; con poco margen devolvía
llamadas con los argumentos vacíos.

## Despliegue

Hace falta una cuenta de Cloudflare (el plan gratuito basta y no pide tarjeta).

```bash
cd worker
npm install
npx wrangler login
```

**1. Crear el almacén del contador diario**

```bash
npx wrangler kv namespace create CUOTA
```

Copia el `id` que imprime y pégalo en `wrangler.toml`, sustituyendo
`PENDIENTE_DE_CREAR`.

**2. Guardar la clave de NVIDIA como secreto**

```bash
npx wrangler secret put NVIDIA_API_KEY
```

Pega la clave cuando la pida. Queda cifrada en Cloudflare: no se versiona ni se
puede volver a leer.

**3. Publicar**

```bash
npx wrangler deploy
```

Al terminar imprime la URL del Worker
(`https://nutricion-jr-asistente.<tu-cuenta>.workers.dev`).

**4. Conectar la app**

Añade esa URL al `.env` de la raíz del proyecto y vuelve a desplegar la web:

```
VITE_ASISTENTE_URL=https://nutricion-jr-asistente.<tu-cuenta>.workers.dev
```

```bash
cd ..
npm run build
npx firebase-tools deploy --only hosting
```

## Desarrollo local

```bash
cd worker
echo 'NVIDIA_API_KEY=tu-clave' > .dev.vars   # este fichero no se versiona
npx wrangler dev
```

Con el Worker en local, apunta `VITE_ASISTENTE_URL` a `http://localhost:8787`.
Los orígenes de desarrollo ya están permitidos en el CORS del Worker.

## Cambiar de modelo

La constante `MODELO` está al principio de `src/index.js`. Para ver qué modelos
admite la cuenta:

```bash
curl https://integrate.api.nvidia.com/v1/models -H "Authorization: Bearer $NVIDIA_API_KEY"
```

Ojo con los modelos de razonamiento: si el modelo nuevo no admite
`chat_template_kwargs: { thinking: false }`, escribirá su razonamiento dentro de
la respuesta que ve el usuario.
