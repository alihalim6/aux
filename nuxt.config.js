export default {  
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'AUX - Spotify Together',
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

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~/plugins/vue-timeago.js',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

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

    '~/io',
  ],

  env: {
    BASE_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.liveonaux.com',
    PORT: 3000
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en',
      name: 'AUX',
      short_name: 'AUX',
      description: 'Spotify Together'
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build`
  build: {
    extend(config, ctx){
      config.node = {
          fs: "empty"
      };
    }
  },

  serverMiddleware: process.env.NODE_ENV === 'production' ? [] : ['~/api/v1'],

  vuetify: {
    customVariables: ['~/styles/variables.scss'],
    treeShake: true
  },
}
