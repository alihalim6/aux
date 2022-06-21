module.exports = {
  globalSetup: '<rootDir>/jest.setup.js',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js',
    '^vuetify/lib': 'vuetify/es5/entry-lib',
    '^vuetify/lib/$': 'vuetify/es5/$1',
  },
  moduleFileExtensions: [
    'ts',
    'js',
    'vue',
    'json'
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(vuetify)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}
