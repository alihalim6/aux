<template>
  <div class="clickable back-to-top-container" :class="{'bottom-reached': bottomReached}" v-if="scrolledDown">
    <div class="back-to-top">
      <v-icon large color="black" @click.stop="backToTop()">mdi-arrow-up</v-icon>
    </div>
  </div>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';

  @Component
  export default class BackToTop extends Vue {
    element;
    scrolledDown = false;
    bottomReached = false;

    @Prop({required: true})
    elementId;

    mounted(){
      this.element = document.getElementById(this.elementId);

      this.element.addEventListener('scroll', (e) => {
        this.scrolledDown = e.target.scrollTop > 150;
        this.bottomReached = (e.target.scrollHeight - e.target.scrollTop) < (e.target.clientHeight + 50);
      });
    }

    backToTop(){
      this.element.scrollTop = 0;
    }
  }
</script>

<style lang="scss">
  .back-to-top-container {
    position: sticky;
    margin: 0 auto;
    width: fit-content;
    display: flex;
    justify-content: center;
    bottom: 8%;
    z-index: 20;

    .back-to-top {
      background-color: white;
      padding: 12px;
      border-radius: 100%;
      box-shadow: 0px 3px 10px -1px rgb(0 0 0 / 80%);
    }

    .back-to-top:hover {
      padding: 16px;
    }
  }

  .bottom-reached {
    animation: fade-up-back-to-top 200ms forwards 1 ease-in-out;
  }

  @keyframes fade-up-back-to-top {
    to {
      opacity: 0;
      bottom: 16%;
    }
  }
</style>