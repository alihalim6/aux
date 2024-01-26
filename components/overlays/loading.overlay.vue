<template>
  <section class="loading-container" aria-hidden="true">
    <div class="loading-overlay" >
      <div v-for="(phrase, index) in new Array(20)" :key="index" class="phrase animated">JUST PASS IT.</div>
    </div>

    <div class="phrase filled-phrase">JUST PASS IT.</div>
  </section>
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';

  @Component
  export default class LoadingOverlay extends Vue {}
</script>

<style lang="scss" scoped>
  $loading-phrase-border-size: 4px;

  .loading-container {
    font-size: 38px;
    font-style: italic;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 80%;

    .loading-overlay {
      height: 25vh;
      overflow: hidden;
      border: $loading-phrase-border-size solid $rose-red;
      border-bottom: none;
    }

    .animated {
      animation: scroll-up 0.75s infinite linear;
    }

    @keyframes scroll-up {
      to {transform: translateY(-100%)};
    }

    @supports(-webkit-text-stroke: $loading-phrase-border-size $rose-red) {
      .phrase {
        -webkit-text-stroke: $loading-phrase-border-size $rose-red;
        -webkit-text-fill-color: transparent;
      }

      .filled-phrase {
        -webkit-text-fill-color: $rose-red;
        margin-top: -16px;
        border: $loading-phrase-border-size solid $rose-red;
        border-top: none;
      }
    }
  }
</style>