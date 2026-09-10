# App Android (Capacitor)

El proyecto de `android/` no tiene código propio: envuelve en un WebView el
mismo `dist/` que sirve la web. Todo cambio funcional se hace en `src/`.

## Ciclo de trabajo

```bash
npm run android:sync   # compila la web y la copia a android/
```

No hace falta repetir `npx cap add android`; la carpeta ya está versionada.

## Firma

El APK se firma con `android/keystore/nutricionjr.keystore`, generado con
RSA 4096 y validez de 10.000 días. Ni el keystore ni `keystore.properties`
entran en git.

Huella del certificado, necesaria para registrar la app en Firebase y que
funcione el login con Google en Android:

```
SHA1: FB:01:08:09:DE:9F:0C:4C:06:F0:AC:2E:AF:64:75:5B:AC:53:50:B0
```

**El keystore es irreemplazable.** Android identifica una app por la
combinación de `appId` + firma. Si se pierde la clave, la única salida es
publicar una app nueva con otro `appId`, y quien tuviera instalada la
anterior no recibe la actualización: tiene que desinstalar e instalar de
cero, perdiendo los datos locales.

## Compilación

En la máquina de desarrollo no hay Android SDK, así que el APK se construye
en GitHub Actions (`.github/workflows/android-apk.yml`), a mano desde la
pestaña Actions o publicando un tag `v*`.

El workflow espera cuatro secretos en el repositorio:

| Secreto | Contenido |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | el keystore en base64 (`android/keystore/keystore.base64.txt`) |
| `ANDROID_KEYSTORE_PASSWORD` | contraseña del almacén |
| `ANDROID_KEY_ALIAS` | `nutricionjr` |
| `ANDROID_KEY_PASSWORD` | contraseña de la clave (igual que la del almacén) |

## Login con Google

`src/services/autenticacion.js` elige el camino según la plataforma: en web
sigue usando `signInWithPopup`, y en la app empaquetada usa el selector de
cuentas nativo de Android a través de `@capacitor-firebase/authentication`.
La credencial que devuelve el plugin se le pasa después al SDK web con
`signInWithCredential`, porque Firestore y el listener de sesión miran ese
SDK y no se enteran del login nativo por su cuenta.

Queda por hacer en la consola de Firebase, y sin esto el login nativo falla:

1. Añadir una app Android al proyecto con el paquete `com.nutricionjr.app`.
2. Registrar la huella SHA-1 de arriba en esa app.
3. Descargar el `google-services.json` que genera y guardarlo como secreto
   `GOOGLE_SERVICES_JSON` del repositorio. En local va en
   `android/app/google-services.json`, que está fuera de git.

El plugin de Gradle solo se aplica si ese archivo existe: sin él la app
compila igual pero el login revienta en tiempo de ejecución, así que el
workflow corta la compilación si falta el secreto.
