<template>
  <v-app>
    <script src="https://platform.linkedin.com/badges/js/profile.js" async defer type="text/javascript"></script>
    
    <div class="splash-container">
      <h1>AUX</h1>
      <v-btn class="login-button" @click="loginClicked()">Login with Spotify</v-btn>

      <div class="under-construction">
        <div class="info-msg">This is a web application using Spotify's API. You can discover and listen to music “live,” meaning other Aux users can see and listen to everything you play, as well as add their own tracks to this “session.”  I love the feeling of discovering great new music and this project was born from the idea of sharing that with others. Aesthetically, the goal of Aux is to celebrate the visual artistic aspect of music, so cover art and artist photos are prominent and enlargeable throughout.</div>
        
        <div class="tbd-message">*This application is still in development.  Apps in development that use Spotify's API have to be in beta.  
          If you're a Spotify user interested in getting added to the list and seeing the app at its current stage, let's connect! Message me on LinkedIn and I'll get you added right away.  
          You'll then be able to successfully load the app and see what Aux is all about!</div>
        
        <div class="badge-base LI-profile-badge" data-locale="en_US" data-size="large" data-theme="light" data-type="HORIZONTAL" data-vanity="alihalim6" data-version="v1"></div>
      </div>
    </div>
  </v-app>
</template>

<script>
  import {Component, Vue, Mutation} from 'nuxt-property-decorator';
  import {authorize} from '~/auth';
  import {UI} from '~/store/constants';

  @Component
  export default class Splash extends Vue {
    @Mutation('setLoading', {namespace: UI})
    setLoading;

    mounted(){
      this.setLoading(false);
    }

    loginClicked(){
      authorize();
    }
  }
</script>

<style lang="scss">
  .splash-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px 16px;

    .login-button {
      width: fit-content;
      margin-bottom: 12px;
      font-size: 16px;

      //ignore !important - temp splash page
      background-color: #1D8954 !important;
      color: white !important;
    }

    .under-construction {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .info-msg {
        margin-top: 16px;
      }

      .tbd-message {
        background-color: black;
        color: white;
        margin-bottom: 32px;
        font-weight: 600;
        margin-top: 8px;
      }
    }
  }
</style>