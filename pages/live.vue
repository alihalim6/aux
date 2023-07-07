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
    <CurrentlyPlaying v-show="!isLoading && (!isSafari || playerActivated)"/>

    <LoadingOverlay v-if="isLoading"/>    
    <LazyFeedAlert v-show="!isSafari || playerActivated"/>

    <!-- must be show since we don't want remounts on every three dot opening (new emit listener every time) -->
    <LazyAddToPlaylist v-show="trackToAddToPlaylist" :track="trackToAddToPlaylist"/>
    <LazyBookmarks v-if="showBookmarks"/>
    <LazyToast/>
    
    <v-dialog :value="!isLoading && isSafari && !playerActivated" persistent overlay-color="red" max-width="max-content">
      <div class="activate-player">
        <button v-show="!activatingPlayer" class="clickable nav-button" @click="activatePlayer()">
          <v-img class="spotify-icon" :src="require('~/assets/Spotify_Logo_Icon.png')" alt=""></v-img>
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
    isSafari = false;
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

      this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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