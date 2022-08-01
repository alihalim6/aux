<template>
  <v-snackbar class="app-toast" :value="toast.display" :app="true" top width="100%" max-width="420" transition="fade-transition" color="red">
    <div class="toast-container">
      <span class="toast-text">{{toast.text}}</span>
      <v-icon class="clickable" @click.stop.prevent="closeToast()" id="appToast" aria-label="close toast message">mdi-close</v-icon>
    </div>
  </v-snackbar>
</template>

<script>
  import {Component, Vue, Getter, Mutation, Watch} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class Toast extends Vue {
    @Getter('toast', {namespace: UI})
    toast;

    @Watch('toast', {immediate: true, deep: true})
    toastChanged(newVal){
      this.displayToast = newVal.display;
    }

    @Mutation('setToast', {namespace: UI})
    setToast;

    closeToast(){
      this.setToast({display: false});
    }
  }
</script>

<style lang="scss">
  .app-toast {
    margin-top: 6px;

    .toast-container {
      display: flex;
      justify-content: space-between;
      padding-top: 2px;
      
      .toast-text {
        color: white;
        font-weight: 600;
        padding: 4px;
      }
    }
  }
  </style>