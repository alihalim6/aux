<template>
    <section>
        <h1>SPLASH</h1>
        <b-button @click="loginClicked()">Login with Spotify</b-button>
    </section>
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