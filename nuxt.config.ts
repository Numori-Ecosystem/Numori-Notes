// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
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
  nitro: {
    prerender: {
      routes: ['/']
    }
  },
  ssr: false // Pure client-side SPA
})