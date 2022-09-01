<template>
  <v-snackbar 
    class="app-toast" 
    v-model="currentToast"
    :app="true" 
    top width="100%" 
    max-width="420" 
    transition="fade-transition" 
    :color="toast.color || 'red'"
    :timeout="toast.timeout || 5000"
  >
    <div class="toast-container">
      <span class="toast-text">{{toast.text}}</span>
      <v-icon class="clickable" @click.stop.prevent="closeToast()" id="appToast" aria-label="close toast message">mdi-close</v-icon>
    </div>
  </v-snackbar>
</template>

<script>
  import {Component, Vue, Getter, Watch} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class Toast extends Vue {
    currentToast = null;

    @Getter('toast', {namespace: UI})
    toast;

    @Watch('toast')
    toastChanged(newVal){
      this.currentToast = {...newVal};
    }

    closeToast(){
      this.currentToast = null;
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