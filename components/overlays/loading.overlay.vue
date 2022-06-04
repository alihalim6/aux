<template>
  <section class="loading-container">
    <v-container class="spinner-container">
      <div class="phrase">AUX</div>

      <ol class="track-list">
        <li v-for="n in 7" :key="n" :class="'animated-line-' + n">——————————</li>
      </ol>

      <div class="center-circle"></div>
    </v-container>
  </section>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';

  @Component
  export default class LoadingOverlay extends Vue {}
</script>

<style lang="scss">
  @import '@/styles/simple-styles.scss';

  $container-size: 250px;
  $center-circle-subtract: 215px;
  $animated-line-delay-multiplier: 0.25s;

  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 75vh;

    .spinner-container {
      max-width: $container-size !important;
      height: $container-size;
      border-radius: 100%;
      color: $primary-theme-color;
      overflow: hidden;
      border: 1px solid $phrase-border-color;
      animation: loading-rotation 2s infinite linear forwards;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      @keyframes loading-rotation {
        from {
          transform: none;
        }

        to {
          transform: rotate(-360deg);
        }
      }

      .phrase {
        @extend .outlined-phrase;
        font-size: 38px;
        padding: 0px 10px 12px;
      }

      .track-list {
        font-size: 12px;
        padding-left: 16px;
        position: relative;
        top: -16px;

        .animated-line {
          animation: show-line 1.5s infinite backwards;
        }

        @for $i from 1 through 7 {
          .animated-line-#{$i} {
            @extend .animated-line;
            animation-delay: calc(#{$i} * #{$animated-line-delay-multiplier});
          }
        }

        @keyframes show-line {
          0% {
            opacity: 0;
            transform: none;
          }

          50% {
            opacity: 1;
            transform: scale(1.1);
          }

          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      }

      .center-circle {
        background-color: white;
        border: 2px solid $phrase-border-color;
        width: ($container-size - $center-circle-subtract);
        height: ($container-size - $center-circle-subtract);
        border-radius: 100%;
        position: absolute;
      }
    }
  }
</style>