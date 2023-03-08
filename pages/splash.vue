<template>
  <v-app class="justify-space-between">
    <div class="splash-content">
      <div class="splash-header blurred" :class="{'hide-for-feed': feed.display}">
        <div class="clickable login" @click="loginClicked()">
          <v-img class="spotify-icon" :src="require('~/assets/Spotify_Logo_Icon.png')"></v-img>
          <span class="login-label">LOG {{ $route.params.loggedIn ? 'BACK' : ''}} IN</span>
        </div>
      </div>

      <div class="big-p">P</div>

      <div class="info-container">
        <div class="bullet-point">
          <span class="slash">/</span> 
          <span>Your Spotify library + new releases, featured playlists, and recommendations.</span>
        </div>

        <div class="bullet-point">
          <span class="slash">/</span> 
          <span>See and play what others are listening to.</span>
        </div>

        <div class="bullet-point">
          <span class="slash">/</span> 
          <span><span class="font-italic">AUX Mode</span> automatically adds tracks played by others to your queue (this can be toggled off).</span>
        </div>

        <span class="bullet-point align-self-center mt-6">All with a shared <span class="on-air bullet-point-on-air">FEED</span>!</span>

        <div class="made-info">
          <span>Created by Ali Halim using</span>
          <a class="made-by-link" href="https://developer.spotify.com" target="_blank">Spotify's official API.</a>
        </div>

        <span class="premium-only">Works for Spotify Premium users only.</span>
      </div>

      <v-img class="animated-phrase splash-animation" :src="require('~/assets/pass_the_aux_green.png')"></v-img>
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

    @Getter('feed', {namespace: UI})
    feed;

    mounted(){
      this.setLoading(false);
    }

    loginClicked(){
      authorize();
    }
  }
</script>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Arvo:wght@700&family=Public+Sans:wght@400;700&display=swap');
  @import '~/styles/main.scss';

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
      background-image: url('~/assets/roses.png');
      font-size: 375px;
      color: transparent;
      font-family: 'Arvo', serif;
      background-position-x: -13px;
      background-position-y: 13px;
      background-repeat: repeat;
    }
  }

  .info-container {
    @extend .fade-in;
    opacity: 0;
    padding: 24px 28px;
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
  }

  .login {
    display: flex;
    align-items: center;
    background-color: $primary-theme-color;
    font-size: 12px;
    border-radius: 22px;
    align-self: flex-end;
    margin-left: auto;
    margin-right: $header-margin;
    padding: 8px 14px;

    @media(min-width: $splash-device-size-threshold){
      font-size: 16px;
    }
  }

  .login:hover {
    background-color: $secondary-theme-color;
    border: 2px solid $primary-theme-color;
    padding: 6px 12px;

    .login-label {
      color: $primary-theme-color;
    }
  }

  .login-label {
    color: $secondary-theme-color;
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
    bottom: calc(#{$max-footer-height-not-playing} + 100px);
    width: 75%;
    position: relative;
    margin: 0 auto;
    max-width: 515px;
    animation: blink 0.75s infinite linear;
  }

  @keyframes blink {
    0% {opacity: 1;}
    12% {opacity: 0;}
    33% {opacity: 1;}
  }
</style>