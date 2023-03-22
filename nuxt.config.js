export default {  
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'AUX - Enjoy Spotify Together',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }, { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700&display=swap' }
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
    '@nuxtjs/vuetify',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',

    '~/socket',
    '@nuxtjs/style-resources',
  ],

  env: {
    BASE_URL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.auxthepass.com',
    AUX_SECRET: process.env.AUX_SECRET
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
    extend(config){
      config.node = {
          fs: "empty"
      };
    },
    scss: {
      implementation: require('sass'),
    },
  },

  vuetify: {
    customVariables: ['~/styles/variables.scss'],
    treeShake: true
  },

  serverMiddleware: {
    '/feed': '~/serverMiddleware/feed.js',
    '/user': '~/serverMiddleware/user.js'
  },

  styleResources: {
    scss: ['./styles/variables.scss', './styles/main.scss', './styles/simple-styles.scss']
  }
}