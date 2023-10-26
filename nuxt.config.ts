// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    password: 'hi mom',
    openaiApiKey: '',
    public: {
      tinymceApiKey: ''
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@bg-dev/nuxt-naiveui'
  ],
  build: {
    transpile: [
      'trpc-nuxt'
    ]
  },
  typescript: {
    shim: false
  }
})
