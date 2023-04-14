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
    color="white"
    :timeout="-1"
  >
    <div class="d-flex flex-column align-end fill-available">
      <v-icon class="clickable" @click.stop="closeDialog()" color="#191414" aria-label="close the dialog">mdi-close</v-icon>

      <div v-if="actionDialog.isIosPwaInstall" class="dialog-text">
        <span class="ios-warning">WARNING: for installed web apps (those added to home screen), 
          iOS unfortuantely does not allow background audio (app needs to be open in foreground, otherwise music pauses). 
          If you're good with that, here's how to install AUX as an app:
        </span>

        <div class="my-2">1. Tap the share icon in the browser bar.</div>
        <div>2. Hit "Add to Home screen".</div>
      </div>

      <span v-else class="dialog-text">{{actionDialog.text}}</span>

      <div class="d-flex align-center mt-4">
        <div class="clickable nav-button cancel" v-if="actionDialog.cancellable">
          <span class="nav-button-label" @click="closeDialog()">CANCEL</span>
        </div>

        <div class="clickable nav-button confirm">
          <span class="nav-button-label" @click="actionDialog.confirmFn ? actionDialog.confirmFn() : closeDialog()">{{ actionDialog.confirmLabel }}</span>
        </div>
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
    color: $primary-theme-color;
  }

  .nav-button {
    margin-left: 6px;
    font-weight: bold;
  }

  .cancel {
    background-color: $secondary-theme-color;

    .nav-button-label {
      color: $primary-theme-color !important;
    }
  }

  .ios-warning {
    font-size: 12px;
  }
</style>