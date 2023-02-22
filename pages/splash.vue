<template>
  <v-app class="justify-space-between">
    <div class="splash-content">
      <div class="splash-header blurred" :class="{'hide-for-feed': feed.display}">
        <div class="clickable login" @click="loginClicked()">
          <v-img class="spotify-icon" :src="require('~/assets/Spotify_Logo_Icon.png')"></v-img>
          <span class="login-label">LOG {{ $route.params.loggedIn ? 'BACK' : ''}} IN</span>
        </div>
      </div>

      <div class="lines" :class="{'hide-for-feed': feed.display}">
        <v-divider v-for="(line, index) in Array(3)" :key="index" color="#1DB954" :length="200" class="mt-4"></v-divider>
      </div>

      <div class="big-p">P</div>
      <div class="pass-the-aux">PASS THE AUX</div>

      <div class="info-container">
        <div v-for="(point, index) in bulletPoints" :key="index" class="bullet-point">
          <span class="slash">/</span> 
          <span>{{point}}</span>
        </div>

        <span class="bullet-point align-self-center mt-4">All with a shared <span class="on-air bullet-point-on-air">FEED</span>.</span>

        <div class="made-info">
          <span>Made in </span>
          <v-img :src="require('~/assets/the_a.png')" class="the-a"></v-img>
          <span>tlanta with</span>
          <a class="clickable api-link" href="https://developer.spotify.com" target="_blank">Spotify's official API</a>
        </div>
      </div>
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
    bulletPoints = ['Enjoy your Spotify library + new releases and recommendations.', 'See and play what others are listening to.', 'Comment and react.'];

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

  .splash-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: bold;
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
    padding: 24px $base-padding;
    display: flex;
    flex-direction: column;
    animation-delay: 830ms;
  }

  .pass-the-aux {
    @extend .fade-in;
    color: $secondary-theme-color;
    background-color: $spotify-green;
    font-size: 32px;
    margin-top: -120px;
    border-radius: 4px;
    letter-spacing: 4px;
    padding-left: 10px;
    padding-right: 4px;
    box-shadow: 0px 3px 10px -1px rgb(0 0 0 / 80%);
  }

  .tagline {
    font-size: 22px;
    padding: 12px;
  }

  $bullet-point-font-size: 18px;

  .bullet-point {
    display: flex;
    align-items: center;
    font-size: $bullet-point-font-size;
    align-self: flex-start;
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
    margin-top: 112px;
    align-self: center;
    color: #888888;
    display: flex;
    align-items: flex-end;
  }

  .the-a {
    $a-size: 18px;
    width: $a-size;
    height: $a-size;
    margin-left: 4px;
  }

  .api-link {
    color: black !important;
    margin-left: 4px;
  }

  .splash-header {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding: 16px 0px;
    position: fixed;
    z-index: 2;
  }

  .login {
    display: flex;
    align-items: center;
    background-color: $primary-theme-color;
    font-size: 16px;
    border-radius: 22px;
    align-self: flex-end;
    margin-right: 10%;
    padding: 8px 14px;
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

  .lines {
    width: 600px;
    position: absolute;
    z-index: 3;
    left: -287px;
    transform: rotate(-45deg);
    background-color: #f6f3d2;
  }
</style>