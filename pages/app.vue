<template>
  <v-app :class="{'item-playing': currentlyPlayingItem.uri}">
    <v-app-bar elevation="2" color="white" class="app-bar" short fixed>
      <div class="logo-container" :class="{'smaller-logo-container': $vuetify.breakpoint.smAndDown}">
        <div class="aux-logo-container">
          <div class="outlined-phrase d-none d-md-inline">PASS THE</div>
          <div class="inline-display main-label">AUX</div>
          <div class="inline-display outlined-phrase d-none d-md-inline">CORD</div>
        </div>

        <v-icon class="by-x">mdi-close</v-icon>

        <v-img class="spotify-icon d-inline d-md-none" :src="require('~/assets/Spotify_Logo_Icon.png')"></v-img>
        <v-img class="spotify-full d-none d-md-inline" :src="require('~/assets/Spotify_Logo_Full.png')"></v-img>
      </div>
    </v-app-bar>

    <div v-show="!isLoading" class="base-app-container">
      <NewAndRecommended/>
      <MyAux/>
      <Playlists/>
      <LazyDetailOverlays/>
      <LazyFeed/>
    </div>

    <!-- needs to be outside of above block so that up next overlay slides all the way to top (relativity issue) -->
    <CurrentlyPlaying v-show="!isLoading"/>

    <LoadingOverlay v-if="isLoading"/>    
    <FeedAlert/>
    <Toast/>
  </v-app>
</template>

<script>
  import {Component, Vue, Getter} from 'nuxt-property-decorator';
  import {UI, SPOTIFY} from '~/store/constants';
  import {initSpotifyPlayer} from '~/utils/helpers';
  import io from '~/utils/io';

  @Component
  export default class App extends Vue {
    //TODO all v-imgs use lazy-src prop to show loader until img shows?
    //TODO adjust vuetify breakpoints so that full spotify logo still shows up until it really can't fit
    
    @Getter('isLoading', {namespace: UI})
    isLoading;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    async beforeMount(){
      io();
      //add SDK to scripts
      const spotifyPlaybackSdk = document.createElement('script');
      spotifyPlaybackSdk.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
      document.head.appendChild(spotifyPlaybackSdk);
    }

    mounted(){
      window.onSpotifyWebPlaybackSDKReady = () => {
        initSpotifyPlayer();
      };
    }
  }
</script>

<style lang="scss">
  .app-bar {
    $phrase-border-size: 1px;
    
    height: $app-header-height !important;
    max-height: $app-header-height;
    margin-bottom: 22px;
    z-index: 30 !important;

    @supports(-webkit-text-stroke: $phrase-border-size $primary-theme-color) {
      .outlined-phrase {
        -webkit-text-stroke: $phrase-border-size $primary-theme-color;
        -webkit-text-fill-color: $secondary-theme-color;
      }
    }

    .logo-container {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      margin: 10px $base-padding 0px;

      .aux-logo-container {
        font-weight: 700;
        font-size: 26px;
        
        .outlined-phrase {
          color: $secondary-theme-color;
        }

        .main-label {
          background-color: $primary-theme-color;
          color: $secondary-theme-color;
          border-radius: 2px;
        }
      }

      .by-x {
        font-size: 32px;
        color: $primary-theme-color;
        padding: 0px 10px;
      }

      .spotify-full {
        width: 8em;
      }

      .spotify-icon {
        width: 2.5em;
      }
    }

    .smaller-logo-container {
      .main-label {
        @extend .outlined-phrase;
        background-color: $secondary-theme-color !important;
      }
    }
  }

  .base-app-container {
    margin-top: calc(#{$app-header-height} + 10px);
  }
</style>