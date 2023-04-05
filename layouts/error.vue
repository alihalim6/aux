<template>
  <v-app>
    <div class="container">
      <div class="message">{{error.customMessage ||  'Something exploded and here we are. Sorry about that.'}}</div>

      <div class="clickable nav-button error-button" @click="actionButtonPressed()">
        <span class="nav-button-label">{{error.actionButtonLabel || 'RELOAD'}}</span>
      </div>

      <span v-if="!error.notPremium" class="note">(at the risk of causing another explosion...and possibly starting a fire...{{String.fromCodePoint(0x1F525)}})</span>
    </div>
  </v-app>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {storageGet} from '~/utils/storage';
  import {AUTH} from '~/utils/constants';
  import {authorize} from '~/auth';

  @Component
  export default class Error extends Vue {
    @Prop({default: {}})
    error;

    middleware({redirect}){
      if(!storageGet(AUTH.ACCESS_TOKEN)){
        return redirect('/');
      }
    }

    actionButtonPressed(){
      if(this.error.notPremium){
        authorize();
      }
      else{
        this.$router.go('/');
      }
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    font-family: 'Public Sans', sans-serif;
    font-weight: bold;
  }
  
  .message {
    width: 100%;
    font-size: 38px;
    color: $cream;
    background-color: $rose-red;
    padding: 14px 10px;
    margin-top: 48px;
  }

  .note {
    font-size: 16px;
    margin-left: 6px;
    padding: 0px 10px;
  }

  .error-button {
    background-color: $rose-red;
    align-self: center;
    margin: 24px 0;
    font-size: 18px;
    margin-bottom: 4px;

    .nav-button-label {
      color: $cream;
    }
  }
</style>