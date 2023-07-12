<template>
  <v-app :class="{'item-playing': currentlyPlayingItem.uri, 'dark-mode': darkMode}">
    <audio v-if="currentlyPlayingItem.uri" class="hidden" loop autoplay id="silentPlayer">
      <source src="/5-seconds-of-silence.mp3" type="audio/mpeg">
    </audio>

    <AppHeader/>

    <div v-show="!isLoading" class="base-app-container">
      <NewAndRecommended/>
      <Playlists/>
      <MyAux/>
      <LazyDetailOverlay/>
    </div>

    <LazyFeed/>

    <!-- needs to be outside of above block so that up next overlay slides all the way to top (relativity issue) -->
    <CurrentlyPlaying v-show="!isLoading && (!isMobile || playerActivated)"/>

    <LoadingOverlay v-if="isLoading"/>    
    <LazyFeedAlert v-show="!isMobile || playerActivated"/>

    <!-- must be show since we don't want remounts on every three dot opening (new emit listener every time) -->
    <LazyAddToPlaylist v-show="trackToAddToPlaylist" :track="trackToAddToPlaylist"/>
    <LazyBookmarks v-if="showBookmarks"/>
    <LazyToast/>
    
    <v-dialog :value="!isLoading && isMobile && !playerActivated" persistent overlay-color="red" max-width="max-content">
      <div class="activate-player">
        <button v-show="!activatingPlayer" class="clickable nav-button" @click="activatePlayer()">
          <v-img class="spotify-icon" :src="require('~/assets//Spotify_Logo_Icon.png')" alt=""></v-img>
          <span class="nav-button-label">ACTIVATE SPOTIFY PLAYER</span>
        </button>

        <v-progress-circular v-show="activatingPlayer" indeterminate color="#fcfce0"></v-progress-circular>
      </div>
    </v-dialog>
  </v-app>
</template>

<script>
  import {Component, Vue, Getter, Mutation} from 'nuxt-property-decorator';
  import {UI, SPOTIFY} from '~/store/constants';
  import {DEVICE_ID} from '~/utils/constants';
  import initSocketClient from '~/utils/init.socket.client';
  import {storageRemove} from '~/utils/storage';
  import {initSpotifyPlayer} from '~/utils/helpers';

  @Component
  export default class App extends Vue {
    trackToAddToPlaylist = null;
    playerActivated = false;
    activatingPlayer = false;
    hideCurrentlyPlaying = false;
    isMobile = false;
    showBookmarks = false;
    
    @Getter('isLoading', {namespace: UI})
    isLoading;

    @Getter('darkMode', {namespace: UI})
    darkMode;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Mutation('setSdkReady', {namespace: SPOTIFY})
    setSdkReady;

    beforeMount(){
      initSocketClient();
      //add SDK to scripts
      const spotifyPlaybackSdk = document.createElement('script');
      spotifyPlaybackSdk.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
      document.head.appendChild(spotifyPlaybackSdk);

      window.onSpotifyWebPlaybackSDKReady = () => {
        this.setSdkReady();
      };

      storageRemove(DEVICE_ID);

      this.$nuxt.$root.$on('addToPlaylist', trackToAdd => {
        this.$nuxt.$root.$emit('hideUpNext');
        this.trackToAddToPlaylist = trackToAdd;
      });

      this.$nuxt.$root.$on('closeModal', () => {
        this.trackToAddToPlaylist = null;
        this.showBookmarks = false;
      });

      this.$nuxt.$root.$on('showBookmarks', () => {
        this.showBookmarks = true;
      });

      this.isMobile = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /(android)/i.test(navigator.userAgent);;
    }

    async activatePlayer(){
      this.activatingPlayer = true;
      await initSpotifyPlayer(true, true);
      this.activatingPlayer = false;
      this.playerActivated = true;
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('addToPlaylist');
      this.$nuxt.$root.$off('closeModal');
      this.$nuxt.$root.$off('showBookmarks');
    }
  }
</script>

<style lang="scss">
  @import '~/styles/simple-styles';
  @import '~/styles/vue-vuetify';
  @import '~/styles';

  .base-app-container {
    margin-top: 51px;
  }

  .activate-player {
    width: max-content;

    span {
      font-weight: bold;
      margin-left: 12px;
    }
  }
</style>

<style lang="scss">
  @import '~/styles/globals';
  
  $section-title-font-size: 40px;

  .content-container {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    max-width: $max-inner-width;

    .section-title {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
      color: rgba(0, 0, 0, 0.8);
      font-weight: 600;
      line-height: 1.1;
      padding: 8px $base-padding 0px;
    }

    .home-content-title {
      @extend .section-title;
      padding-left: $home-content-padding;
      padding-right: $home-content-padding;

      @media(min-width: $max-inner-width){
        padding-left: 0px;
        padding-right: 0px;
      }
    }

    .tab-container {
      font-weight: normal;
      margin-top: 6px;
    }
  }

  .tab-label {
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0px;
  }

  .selected-tab {
    color: $secondary-theme-color;
    background-color: $spotify-green;
    font-weight: bold;
    padding: 8px;
    border-radius: 4px;
  }

  .selected-tab:focus-visible {
    @extend .focused;
  }

  .tab-divider {
    font-size: $section-title-font-size;
    padding: 0px 10px;
  }

  h1 {
    font-size: $section-title-font-size;
  }

  .scroll-shadow {
    //https://css-tricks.com/scroll-shadows-with-javascript/
    background:
      /* Shadow Cover TOP */
      linear-gradient(
        white 30%,
        rgba(255, 255, 255, 0)
      ) center top,
      
      /* Shadow Cover BOTTOM */
      linear-gradient(
        rgba(255, 255, 255, 0), 
        white 70%
      ) center bottom,
      
      /* Shadow TOP */
      radial-gradient(
        farthest-side at 50% 0,
        rgba(0, 0, 0, 0.2),
        rgba(0, 0, 0, 0)
      ) center top,
      
      /* Shadow BOTTOM */
      radial-gradient(
        farthest-side at 50% 100%,
        rgba(0, 0, 0, 0.2),
        rgba(0, 0, 0, 0)
      ) center bottom;
    
    background-repeat: no-repeat;
    background-size: 100% 40px, 100% 40px, 100% 8px, 100% 8px;
    background-attachment: local, local, scroll, scroll;
  }

  .home-content {
    @extend .home-content-responsive;

    max-height: $max-home-content-height;
    overflow-y: scroll;
    margin: 0 $home-content-padding;
    padding: 4px 4px 4px 0px;

    .track-list-container {
      padding: 0px $base-padding 0px 0px;
    }
  }

  .home-content-with-shadow {
    @extend .home-content;
    @extend .scroll-shadow;
  }

  .home-content-responsive {
    @media(min-width: $max-inner-width){
      max-width: $max-inner-width;
      margin: 0 auto;
    }
  }

  .tab-container {
    padding-left: $home-content-padding;
    max-width: calc(100vw - #{$home-content-padding});

    @media(min-width: $max-inner-width){
      padding: 0px;
    }
  }

  .refresh-data {
    margin-left: 12px;
    font-size: 28px !important;
  }

  .refresh-data:focus-visible {
    @extend .focused;
  }

  .refreshing-data {
    animation: spin 0.5s infinite forwards linear;

    @keyframes spin {
      50% {transform: rotate(180deg);}
      100% {transform: rotate(360deg);}
    }
  }
</style>