<template>
  <v-app class="justify-space-between">
    <ActionDialog/>

    <div class="splash-content">
      <div class="splash-header blurred" :class="{'hide-for-feed': feed.display}">
        <div class="login-container">
          <button class="clickable nav-button login" @click="loginClicked()">
            <v-img class="spotify-icon" src="/Spotify_Logo_Icon.png"></v-img>
            <span class="nav-button-label">LOG {{ $route.params.loggedIn ? 'BACK' : ''}} IN</span>
          </button>

          <p class="disclaimer text-right">
            By logging in, you agree to 
            <a class="clickable text-decoration-underline primary-color" tabindex="0" @click="showTerms()" @keyup.enter="showTerms()">these terms</a> and 
            <a class="clickable text-decoration-underline primary-color" @click="showPrivacyPolicy()" tabindex="0" @keyup.enter="showPrivacyPolicy()">this privacy notice</a>.
          </p>
        </div>
      </div>

      <div class="big-p" tabindex="0" aria-label="introducing the web app: PASS THE AUX">P</div>
      <!-- <div class="width-100 d-flex flex-wrap container">
          <v-img src="/rose.png" class="roses" v-for="(n, index) of new Array(100)" :key="index"></v-img>
      </div> -->

      <div class="info-container">
        <div class="bullet-point">
          <span class="slash" aria-hidden="true">/</span> 
          <span tabindex="0">Enjoy your Spotify library + new releases, featured playlists, and recommendations.</span>
        </div>

        <div class="bullet-point">
          <span class="slash" aria-hidden="true">/</span> 
          <span tabindex="0">See and play what others are listening to.</span>
        </div>

        <div class="bullet-point">
          <span class="slash" aria-hidden="true">/</span> 
          <span tabindex="0"><span class="font-italic">AUX Mode</span> automatically adds tracks played by others to your queue (this can be toggled off).</span>
        </div>

        <span class="bullet-point align-self-center mt-6" tabindex="0">All with a shared <span class="on-air bullet-point-on-air">FEED</span>.</span>

        <div class="made-info" tabindex="0">
          <span>Created by</span>
          <a class="made-by-link" href="https://linktr.ee/alihalim" target="_blank">Ali Halim</a>
          <span>using</span>
          <a class="made-by-link" href="https://developer.spotify.com" target="_blank">Spotify's API</a>
        </div>

        <span class="premium-only" tabindex="0">Works for Spotify Premium users only</span>
      </div>

      <v-img class="splash-animation" src="/pass_the_aux_green.png" aria-hidden="true"></v-img>
    </div>

    <div class="bottom-content">
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
          text: 'You\'ve been teleported back to the splash page (Spotify needs you to login again).',
          confirmLabel: 'OK'
        });
      }
    }

    loginClicked(){
      authorize();
    }

    showTerms(){
      this.setActionDialog({
        text: `AUX does not make any warranties or representations on behalf of Spotify. All warranties with respect to the 
          Spotify Platform, Spotify Service and Spotify Content, including the implied warranties of merchantability, fitness for a particular purpose and non-infringement are disclaimed.
          Modifying or creating derivative works based on the Spotify Platform, Spotify Service or Spotify Content is prohibited.
          Decompiling, reverse-engineering, disassembling, and otherwise reducing the Spotify Platform, Spotify Service, and Spotify Content to source code or other human-perceivable form, 
          to the full extent allowed by law is prohibited. AUX is responsible for itself and any liability on the part of third parties (e.g., Spotify) is disclaimed. 
          Spotify is a third party beneficiary of this agreement and privacy notice and is entitled to directly enforce this agreement.`,
        confirmLabel: 'OK'
      });
    }

     showPrivacyPolicy(){
      this.setActionDialog({
        text: `AUX uses and stores your profile photo url, Spotify ID and username in order to associate you with the tracks that you play as well as 
          the comments and reactions you make on other users' tracks. The same info is used to indicate to other AUX users that you're "live" on AUX
          whenever you're on. This data can always be removed via the AUX profile menu. AUX uses no cookies.`,
        confirmLabel: 'OK'
      });
    }
  }
</script>

<style lang="scss">
  $header-margin: 5%;
  $splash-device-size-threshold: 430px;

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
      @extend .fade-in;
      -webkit-text-stroke: $phrase-border-size $spotify-green;
      -webkit-background-clip: text;
      background-clip: text;
      background-image: url('/roses.png');
      font-size: 375px;
      color: transparent;
      font-family: 'Arvo', serif;
      background-position-x: -13px;
      background-position-y: -7px;
      background-repeat: repeat;
      margin-top: 42px;
      background-size: 188%;
      margin-top: 42px;
    }
  }

  .info-container {
    @extend .fade-in;
    opacity: 0;
    padding: 24px 28px 0px;
    display: flex;
    flex-direction: column;
    animation-delay: 830ms;
    margin-top: -134px;
    width: -webkit-fill-available;

    @media(min-width: 700px){
      max-width: 58%;
    }
  }

  $bullet-point-font-size: 16px;

  .bullet-point {
    display: flex;
    align-items: center;
    font-size: $bullet-point-font-size;
    align-self: flex-start;
    margin-top: 4px;
  }

  .slash {
    font-size: 45px;
    margin-right: 8px;
    transform: scaleX(1.4);
    color: $spotify-green;
  }

  .bullet-point-on-air {
    font-size: $bullet-point-font-size;
  }

  .bottom-content {
    position: sticky;
    bottom: 0px;
  }

  .made-info {
    font-size: 14px;
    margin-top: 200px;
    align-self: center;
    color: #888888;
    white-space: nowrap;
    padding: 0px $base-padding;
  }

  .made-by-link {
    color: $primary-theme-color !important;
  }

  .premium-only {
    @extend .made-info;
    margin-top: 6px;
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
  }
  
  .login {
    margin-right: $header-margin;

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

  .first-slash {
    color: #f20d18;
  }

  .second-slash {
    color: $spotify-green;
  }

  .splash-animation {
    bottom: calc(#{$max-footer-height-not-playing} + 66px);
    width: 75%;
    position: relative;
    margin: 0 auto;
    max-width: 515px;
    animation: blink 1s infinite linear;
  }

  @keyframes blink {
    0% {opacity: 1;}
    12% {opacity: 0;}
    33% {opacity: 1;}
  }

  .disclaimer {
    padding: $base-padding;
    font-size: 12px;
    max-width: 250px;
  }

  .login-container {
    display: flex;
    flex-direction: column;
  }

  .container {
    background-color: #fcfce1;
  }

  .roses {
    margin: 18px;
    $size: 46px;
    height: $size;
    width: $size;
  }
</style>