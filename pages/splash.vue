<template>
    <v-app>
        <h1>SPLASH</h1>
        <v-btn @click="loginClicked()">Login with Spotify</v-btn>
    </v-app>
</template>

<script lang="ts">
import {Component, Vue} from 'nuxt-property-decorator';
import {authorize} from '~/preAuth';

@Component
export default class Splash extends Vue {
  loginClicked(){
    authorize();
  }
}
</script>