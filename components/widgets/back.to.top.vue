<template>
  <div class="clickable back-to-top-container" :class="{'bottom-reached': bottomReached}" v-if="scrolledDown" @click.stop="backToTop()">
    <div class="back-to-top blurred" :class="{'black-background': arrowColor == 'white'}">
      <v-icon :color="arrowColor" aria-label="scroll to top of content">mdi-arrow-up</v-icon>
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

    @Prop({default: 'black'})
    arrowColor;

    mounted(){
      this.element = document.getElementById(this.elementId);

      if(this.element){
        this.element.addEventListener('scroll', this.handleScroll);
      }
    }

    handleScroll(e){
      this.scrolledDown = e.target.scrollTop > 150;
      this.bottomReached = (e.target.scrollHeight - e.target.scrollTop) < (e.target.clientHeight + 50);
      
      this.$nuxt.$root.$emit('hideThreeDotMenu');

      if(this.elementId.indexOf('overlayContent') > -1){
        this.$nuxt.$root.$emit('scrolledDown', this.scrolledDown);
      }
    }

    async backToTop(){
      await this.$nextTick();
      this.element.scrollTop = 0;
    }

    beforeDestroy(){
      this.element.removeEventListener('scroll', this.handleScroll);
    }
  }
</script>

<style lang="scss">
  .back-to-top-container {
    position: sticky;
    margin: 0 auto;
    width: fit-content;
    bottom: calc(env(safe-area-inset-bottom) + 8%);
    z-index: 20;

    .back-to-top {
      padding: 4px 5px;
      border-radius: 100%;
      box-shadow: 0px 3px 10px -1px rgb(0 0 0 / 80%);
    }

    .back-to-top:hover {
      padding: 6px 7px;
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