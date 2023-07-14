<template>
  <v-snackbar 
    class="app-toast" 
    v-model="currentToast"
    :app="true" 
    top 
    width="100%" 
    min-width="fit-content"
    max-width="fit-content"
    transition="slide-y-transition" 
    :color="toast.error ? 'red' : '#191414'"
    :timeout="timeout"
  >
    <div class="snackbar-container fill-available">
      <span class="toast-text pr-3" :class="{'error-text': toast.error}">
        <span>{{toast.username}} </span><span>{{toast.text}}</span>
      </span>

      <v-icon class="clickable" @click.stop="closeToast()" color="white" aria-label="close the toast message">mdi-close</v-icon>
    </div>
  </v-snackbar>
</template>

<script>
  import {Component, Vue, Getter, Watch} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class Toast extends Vue {
    currentToast = null;
    timeout = -1;

    @Getter('toast', {namespace: UI})
    toast;

    @Watch('toast')
    toastChanged(toast){
      this.currentToast = {...toast};
      this.resetTimeout();
    }

    //reset snackbar timer (value needs to change for vuetify to reset it)
    async resetTimeout(){
      this.timeout = 0;
      await this.$nextTick();
      this.timeout = this.toast.error ? 5000 : 2700;
    }

    closeToast(){
      this.currentToast = null;
    }
  }
</script>

<style lang="scss">  
  @import './styles';
  
  .app-toast {
    margin-top: 6px;
    z-index: 9999999 !important;

    .toast-text {
      font-weight: bold;
      padding: 4px 4px 4px 8px;
      color: white;
    }

    .error-text {
      color: white;
    }
  }
  </style>