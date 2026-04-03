// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Calc Notes',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'A smart notepad that instantly solves math as you type — powered by natural language.' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Calc Notes' },
        { name: 'application-name', content: 'Calc Notes' },
        { name: 'theme-color', content: '#ffffff' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },
  modules: [
    '@vueuse/nuxt',
    '@nuxt/icon',
    '@nuxt/fonts',
    'nuxt-i18n-micro',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'nuxt-codemirror'
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light'
  },
  i18n: {
    translationDir: 'locales',
    defaultLocale: 'en-GB',
    meta: true,
    strategy: 'no_prefix',
    autoDetectLanguage: true,
    redirects: false,
    locales: [
      {
        code: 'en-GB',
        iso: 'en-GB',
        name: 'English (UK)',
        dir: 'ltr'
      },
      {
        code: 'es-ES',
        iso: 'es-ES',
        name: 'Español',
        dir: 'ltr'
      },
    ]
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    databaseUrl: process.env.DATABASE_URL || '',
  },
  nitro: {
    prerender: {
      routes: ['/']
    }
  },
  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress the module-preload-polyfill sourcemap warning
          if (warning.plugin === 'nuxt:module-preload-polyfill') return
          warn(warning)
        },
        output: {
          manualChunks(id) {
            // Split CodeMirror + Lezer into their own chunk (~377 kB)
            if (id.includes('@codemirror') || id.includes('@lezer')) {
              return 'codemirror'
            }
            // Split Capacitor plugins into their own chunk
            if (id.includes('@capacitor')) {
              return 'capacitor'
            }
          }
        }
      }
    }
  },
  ssr: false // Pure client-side SPA
})