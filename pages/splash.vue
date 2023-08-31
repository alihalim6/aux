<template>
  <v-app class="justify-space-between">
    <ActionDialog/>

    <div class="splash-content">
      <div class="splash-header blurred" :class="{'hide-for-feed': feed.display}">
        <div class="login-container">
          <button class="clickable nav-button login" @click="loginClicked()">
            <v-img class="spotify-icon" :src="require('~/assets/Spotify_Logo_Icon.png')" alt=""></v-img>
            <span class="nav-button-label">LOG {{ $route.params.loggedIn ? 'BACK' : ''}} IN</span>
          </button>          
        </div>
      </div>

      <div class="big-p" aria-hidden="true">
        <div class="d-flex align-end">
          <span>P</span>

          <v-icon 
            class="clickable whats-p-icon" 
            @click.stop="() => showTooltip = !showTooltip" 
            tabindex="0" 
            aria-label="tooltip with info about what AUX is"
          >
            mdi-help-circle-outline
          </v-icon>
        </div>

        <div class="aux-title">PASS THE AUX</div>
      </div>

      <v-snackbar :value="showTooltip" timeout="-1" absolute color="#fcfce0" role="tooltip" centered>
        <div class="d-flex align-start">
          <div class="p-tooltip">
            <div class="bullet-point">Listen to your Spotify library, new releases, featured playlists, and recommendations / </div>
            <div class="bullet-point">See and play what others are listening to (other users can be ignored if desired) / </div>
            
            <div class="bullet-point">
              <span>Turn <span class="font-italic">AUX Mode</span> on to automatically add tracks played by others to your queue / </span>
            </div>

            <div class="bullet-point boldest mt-8">Hop on with a friend to discover and enjoy music together!</div>
          </div>

          <v-icon class="clickable aux-tooltip ml-3" color="white" @click="() => showTooltip = false" aria-label="close AUX info tooltip">mdi-close</v-icon>
        </div>
      </v-snackbar>

      <div class="bottom-container">
        <div class="made-info">
          <span>Created by</span>
          <a class="made-by-link" href="https://linktr.ee/alihalim" target="_blank" tabindex="0">Ali Halim</a>
          <span>with</span>
          <a class="made-by-link" href="https://developer.spotify.com" target="_blank" tabindex="0">Spotify's official API</a>
        </div>

        <span class="made-info mt-1">Works for Spotify Premium users only</span>
      </div>
    </div>

    <div class="footer-content">
      <LazyFeed/>
      <CurrentlyPlaying />
    </div>

    <Toast/>
  </v-app>
</template>

<script>
  import {Component, Vue, Mutation, Getter} from 'nuxt-property-decorator';
  import {authorize} from '~/auth';
  import {UI} from '~/store/constants';

  @Component
  export default class Splash extends Vue {
    showTooltip = false;

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    @Mutation('setActionDialog', {namespace: UI})
    setActionDialog;

    @Getter('feed', {namespace: UI})
    feed;

    mounted(){
      this.setLoading(false);

      if(this.$route.params.failedRefreshRetry){
        this.setActionDialog({
          text: 'You\'ve been teleported back to the splash page (Spotify needs you to log in again).',
          confirmLabel: 'OK'
        });
      }
    }

    loginClicked(){
      authorize();
    }
  }
</script>

<style lang="scss">
  @import '~/styles';
  @import '~/styles/globals';
  @import '~/styles/simple-styles';
  @import '~/styles/vue-vuetify';

  $header-margin: 5%;
  $splash-device-size-threshold: 430px;
  $info-container-threshold: 700px;

  .splash-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: bold;
    color: $primary-theme-color;
    position: relative;
  }

  $phrase-border-size: 8px;

  .fade-in {
    @extend .fade-in-animation;
    opacity: 0;
  }

  @supports(-webkit-text-stroke: $phrase-border-size $spotify-green) {
    .big-p {
      $p-margin: 170px;

      span {
        line-height: calc(#{$p-margin} + 110px);
      }

      &:hover {
        filter: blur(4px);
      }

      @extend .fade-in;
      -webkit-text-stroke: $phrase-border-size $spotify-green;
      -webkit-background-clip: text;
      background-clip: text;
      background-image: url('/roses.png');
      font-size: 375px;
      color: transparent;
      font-family: 'Arvo', serif;
      background-position-x: 4px;
      background-position-y: -56px;
      background-repeat: repeat;
      background-size: 487px;
      margin-top: $p-margin;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }

  .footer-content {
    position: sticky;
    bottom: 0px;
  }

  .made-info {
    font-size: 14px;
    color: #888888;
    white-space: nowrap;
  }

  .made-by-link {
    color: $primary-theme-color !important;
  }

  .splash-header {
    width: 100%;
    padding: 16px 0px;
    position: fixed;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 24px;
    background-color: #fcfce269 !important;
  }
  
  .login {
    margin-right: $header-margin;
    white-space: nowrap;
    
    @media(min-width: $splash-device-size-threshold){
      font-size: 16px;
    }
  }

  .spotify-icon {
    $img-size: 18px;
    width: $img-size;
    height: $img-size;
    margin-right: 8px;
  }

  .hide-for-feed {
    @media(max-width: $device-size-threshold){
      display: none;
    }
  }

  .pass-p {
    font-size: 28px;

    @media(min-width: $splash-device-size-threshold){
      font-size: 34px;
    }
  }

  .login-container {
    display: flex;
    flex-direction: column;
  }

 /*  .container {
    background-color: #fcfce1;
  } */

  .roses {
    margin: 18px;
    $size: 46px;
    height: $size;
    width: $size;
  }

  .bottom-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 16px;
    margin-top: 100px;
  }

  .whats-p-icon, .p-tooltip, .aux-tooltip {
    -webkit-text-stroke: transparent;
    color: $primary-theme-color !important;
  }

  .p-tooltip {
    font-weight: bold;
  }

  .bullet-point {
    margin-bottom: 8px;
  }

  $stroke-size: 1px;

  @supports(-webkit-text-stroke: $stroke-size $spotify-green) {
    .aux-title {
      font-size: 38px;
      font-style: italic;
      -webkit-text-stroke: $stroke-size $spotify-green;
      -webkit-text-fill-color: $spotify-green;
      font-family: 'Archivo Black', sans-serif;
      margin-top: 16px;
    }
  }

  .boldest {
    font-weight: 900;
  }
</style>