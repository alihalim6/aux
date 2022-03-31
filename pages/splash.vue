<template>
    <v-app>
        <script src="https://platform.linkedin.com/badges/js/profile.js" async defer type="text/javascript"></script>
        
        <div class="splash-container">
          <h1>SPLASH</h1>
          <v-btn class="login-button" @click="loginClicked()">Login with Spotify</v-btn>

          <div class="under-construction">
            <div class="tbd-message">*This application is still in development.  Apps in development that use Spotify's API have to use a beta for anyone who wants to use them.  If you're interested in getting added to the list and seeing the app at its current stage, let's connect! Message me on LinkedIn and I'll get you added right away.  You'll then be able to load the app and see what Aux is all about!</div>
            <div class="badge-base LI-profile-badge" data-locale="en_US" data-size="large" data-theme="light" data-type="HORIZONTAL" data-vanity="alihalim6" data-version="v1"><a class="badge-base__link LI-simple-link" href="https://www.linkedin.com/in/alihalim6?trk=profile-badge">Ali Halim</a></div>
          </div>
        </div>
    </v-app>
</template>

<script lang="ts">
import {Component, Vue} from 'nuxt-property-decorator';
import {authorize} from '~/preAuth';

@Component
export default class Splash extends Vue {
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
    }

    .under-construction {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .tbd-message {
        margin-bottom: 32px;
        font-style: italic;
      }
    }
  }
</style>