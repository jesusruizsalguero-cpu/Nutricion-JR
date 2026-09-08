import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': el service worker nuevo se descarga e instala en segundo
      // plano pero no se activa solo. Hace falta que el usuario lo confirme
      // desde el aviso de src/components/ActualizacionApp.jsx — así nunca se
      // le cambia la app por debajo mientras la está usando.
      registerType: 'prompt',
      // El registro se hace a mano con el hook useRegisterSW (ver
      // ActualizacionApp.jsx); si esto quedara en `true` habría un segundo
      // registro automático por script y se pisarían el uno al otro.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Nutrición JR',
        short_name: 'Nutrición JR',
        description: 'Dietas personalizadas a partir de tu edad, peso, deporte y salud.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#16a34a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell (HTML/JS/CSS/iconos) precacheado para que abra sin red.
        // Firestore y Firebase Auth se dejan fuera a propósito: cachear sus
        // respuestas serviría datos o sesiones obsoletos, que es peor que no
        // tener nada.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/],
        cleanupOutdatedCaches: true,
      },
      // Permite probar el flujo de actualización con `npm run dev`, sin
      // tener que compilar cada vez para comprobar un cambio.
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
