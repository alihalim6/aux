export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'aux',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ['@/styles/main.scss'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: {
    dirs: [
      '~/components',
      '~/components/home',
      '~/components/overlays',
      '~/components/widgets'
    ]
  },

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',

    '@nuxtjs/vuetify',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',

    '~/io'
  ],

  env: {
    WS_URL: process.env.WS_URL || 'http://localhost:3000'
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en'
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build`
  build: {
  },

/*   serverMiddleware: process.env.NODE_ENV === 'production' ? [] : [
    {path: '/discover', handler: '~/api/discover.js'},
    {path: '/detail', handler: '~/api/detail.js'},
    {path: '/playback', handler: '~/api/playback.js'},
    {path: '/myAux', handler: '~/api/myAux.js'},
    {path: '/artist', handler: '~/api/artist.js'}
  ], */

  serverMiddleware: process.env.NODE_ENV === 'production' ? [] : ['~/api/v1'],

  vuetify: {
    customVariables: ['~/styles/variables.scss'],
    treeShake: true
  },
}
