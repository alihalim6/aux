<template>
  <v-app>
    <div class="error-container">
      <div class="message">{{error.customMessage ||  'Something exploded and here we are. Sorry about that.'}}</div>

      <div class="clickable nav-button error-button" @click="actionButtonPressed()">
        <span class="nav-button-label">{{error.actionButtonLabel || 'RELOAD*'}}</span>
      </div>

      <span v-if="!error.notPremium" class="note">(*at the risk of causing another explosion...and possibly starting a wildfire...{{String.fromCodePoint(0x1F525)}})</span>
      
      <div class="fire-container">
        <v-img :src="require('~/assets/FIRE.PNG')" alt=""></v-img>
      </div>
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
  @import '~/styles/simple-styles';

  .error-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    font-weight: bold;
    padding: 14px 30px;
  }
  
  .message {
    font-size: 38px;
    color: $primary-theme-color;
    margin-top: 48px;
    line-height: 35px;
  }

  .note {
    font-size: 16px;
    margin-left: 6px;
    padding: 0px 10px;
  }

  .error-button {
    background-color: $rose-red;
    align-self: center;
    font-size: 18px;
    margin: 16px 4px;
    padding: 10px;
    border-radius: 24px;

    .nav-button-label {
      color: $cream;
    }

    &:hover {
      transform: scale(1.1);
    }
  }

  .fire-container {
    width: 65vw;
    margin-top: 26px;
    max-width: 600px;
  }
</style>