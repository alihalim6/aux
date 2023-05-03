<template>
  <v-snackbar 
    class="action-dialog" 
    v-model="currentDialog"
    :app="true" 
    top 
    width="100%" 
    min-width="fit-content"
    :max-width="600"
    transition="slide-y-transition" 
    color="#191414"
    :timeout="-1"
    role="dialog"
    aria-describedby="actionDialogText"
  >
    <div class="d-flex flex-column align-end fill-available">
      <v-icon 
        class="clickable" 
        @click.stop="closeDialog()" 
        color="white" 
        aria-label="close the dialog" 
        tabindex="0" 
        id="closeActionDialog"
      >
        mdi-close
      </v-icon>

      <div v-if="actionDialog.isIosPwaInstall" class="dialog-text" id="actionDialogText">
        <span class="ios-warning">FYI: for installed web apps (i.e. those added to home screen), 
          iOS unfortuantely requires apps to be open in the foreground in order to play audio. 
          If you're good with that, here's how to install AUX as an app (makes for a way better experience), if you didn't already know:
        </span>

        <div class="my-2">1. Tap the share icon in the browser bar.</div>
        <div>2. Hit "Add to Home screen".</div>
      </div>

      <span v-else class="dialog-text" id="actionDialogText">{{actionDialog.text}}</span>

      <div class="d-flex align-center mt-4">
        <button 
          class="clickable nav-button cancel" 
          v-if="actionDialog.cancellable" 
          @click.stop="closeDialog()" 
          tabindex="0" 
          aria-label="close the dialog"
          @keydown.esc="closeDialog()" 
        >
          <span class="nav-button-label">CANCEL</span>
        </button>    

        <button 
          class="clickable nav-button confirm" 
          @click.stop="confirmFn()" 
          @keydown.enter="confirmFn()" 
          tabindex="0" 
          aria-label="confirm and close the dialog"
          @keydown.esc="closeDialog()" 
        >
          <span class="nav-button-label">{{ actionDialog.confirmLabel }}</span>
        </button>
      </div>
    </div>
  </v-snackbar>
</template>

<script>
  import {Component, Vue, Getter, Watch} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class ActionDialog extends Vue {
    currentDialog = null;

    @Getter('actionDialog', {namespace: UI})
    actionDialog;

    @Watch('actionDialog')
    async dialogChanged(dialog){
      this.currentDialog = {...dialog};
      await this.$nextTick();
      const element = document.getElementById('closeActionDialog');
      element.focus();
    }

    closeDialog(){
      this.currentDialog = null;
    }

    confirmFn(){
      return this.actionDialog.confirmFn ? actionDialog.confirmFn() : this.closeDialog();
    }
  }
</script>

<style lang="scss" scoped>  
  .action-dialog {
    z-index: 9999999 !important;
    max-width: 600px;
    margin: 0 auto;
  }

  .dialog-text {
    align-self: flex-start;
    font-weight: bold;
    font-size: 16px;
    padding: $base-padding;
    background-color: $primary-theme-color;
    color: $secondary-theme-color;
  }

  .nav-button {
    margin-left: 6px;
    font-weight: bold;
  }

  .cancel {
    .nav-button-label {
      color: $secondary-theme-color !important;
    }
  }

  .cancel:hover {
    background-color: $primary-theme-color;
    border: 2px solid $secondary-theme-color;
  }

  .confirm {
    background-color: $secondary-theme-color;
    
    .nav-button-label {
      color: $primary-theme-color !important;
    }
  }

  .confirm:hover {
    padding: $nav-button-padding;
    border: none;
    background-color: $primary-theme-color;

    .nav-button-label {
      color: $secondary-theme-color !important;
    }
  }

  .ios-warning {
    font-size: 12px;
  }
</style>