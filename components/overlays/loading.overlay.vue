<template>
  <section class="loading-container">
    <div class="no-prompt-graphic loading" aria-hidden="true">
      <v-img :src="require('~/assets/world.gif')"></v-img>
      <v-img class="animated-phrase" :src="require('~/assets/pass_the_aux_green.png')"></v-img>
    </div>
  </section>
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';

  @Component
  export default class LoadingOverlay extends Vue {}
</script>

<style lang="scss">
  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 90%;

    .loading {
      height: 33vh;
      overflow: visible;
    }
  }
</style>