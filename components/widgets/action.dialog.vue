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
        <div class="pwa-title">FYI: iOS unfortunately requires installed web apps (i.e. those added to Home screen) 
          to be displaying (screen unlocked and app in foreground) for audio to play. 
          If you're good with that, here's how to install AUX as an app if you didn't already know:
        </div>

        <div class="my-2">1. Tap the share icon in the Safari browser bar.</div>
        <div>2. Hit "Add to Home screen."</div>
      </div>

      <div v-else-if="actionDialog.isAndroidPwaInstall" class="dialog-text" id="actionDialogText">
        <div class="pwa-title">FYI: Chrome Canary is recommended for Android (audio playback doesn't work on regular Chrome). Now here's how to install AUX as an app if you didn't already know:
        </div>

        <div class="my-2">1. Tap the three-dot icon in the browser bar.</div>
        <div>2. Hit "Add to Home screen."</div>
      </div>

      <span v-else class="dialog-text" id="actionDialogText">{{actionDialog.text}}</span>

      <div class="d-flex align-center mt-4">
        <button 
          class="clickable nav-button cancel" 
          v-if="actionDialog.cancellable" 
          @click.stop="closeDialog()" 
          aria-label="close the dialog"
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
    dialogChanged(dialog){
      this.currentDialog = {...dialog};
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

  .pwa-title {
    font-size: 14px;
    margin-bottom: 18px;
  }
</style>