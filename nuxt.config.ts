// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Numori — notes that calculate',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Free, open-source notes app with a built-in natural language calculator. Do math as you write, export to multiple formats, and sync with end-to-end encryption.' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Numori' },
        { name: 'application-name', content: 'Numori' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'og:title', content: 'Numori — notes that calculate' },
        { name: 'og:description', content: 'Free, open-source notes app with a built-in natural language calculator. Do math as you write, export to multiple formats, and sync with end-to-end encryption.' },
        { name: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'Numori — notes that calculate' },
        { name: 'twitter:description', content: 'Free, open-source notes app with a built-in natural language calculator. Do math as you write, export to multiple formats, and sync with end-to-end encryption.' }
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
    'nuxt-codemirror',
    '~/modules/version'
  ],
  icon: {
    clientBundle: {
      // Bundle all used MDI icons into the app JS — no runtime API calls
      scan: true,
      includeCustomCollections: true,
    },
  },
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
  nitro: {
    prerender: {
      routes: ['/']
    },
    routeRules: {
      '/.well-known/apple-app-site-association': {
        headers: { 'Content-Type': 'application/json' }
      }
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
      storeAndroid: process.env.NUXT_PUBLIC_STORE_ANDROID || 'https://play.google.com/store/apps/details?id=app.numori.app',
      storeIos: process.env.NUXT_PUBLIC_STORE_IOS || 'https://apps.apple.com/app/numori/id0000000000'
    }
  },
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
    },
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