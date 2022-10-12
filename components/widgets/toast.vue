<template>
  <v-snackbar 
    class="app-toast" 

    v-model="currentToast"
    :app="true" 
    top 
    width="100%" 
    max-width="420" 
    transition="slide-y-transition" 
    :color="toast.backgroundColor || 'red'"
    :timeout="toast.timeout || 5000"
  >
    <div class="snackbar-container fill-available">
      <div class="d-flex align-center pr-3">
        <v-img v-if="toast.img" :src="toast.img" class="snackbar-img"></v-img>
        
        <span class="toast-text">
          <span>{{toast.username}} </span><span>{{toast.text}}</span>
        </span>
      </div>

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

    .toast-text {
      font-weight: bold;
      padding: 4px;
      color: white;
    }
  }
  </style>