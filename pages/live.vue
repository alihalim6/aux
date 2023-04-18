<template>
  <v-app :class="{'item-playing': currentlyPlayingItem.uri}">
    <AppHeader/>

    <div v-show="!isLoading" class="base-app-container">
      <NewAndRecommended/>
      <Playlists/>
      <MyAux/>
      <LazyDetailOverlay/>
    </div>

    <LazyFeed/>

    <!-- needs to be outside of above block so that up next overlay slides all the way to top (relativity issue) -->
    <CurrentlyPlaying v-show="!isLoading"/>

    <LoadingOverlay v-if="isLoading"/>    
    <LazyFeedAlert/>

    <!-- must be show since we don't want remounts on every three dot opening (new emit listener every time) -->
    <LazyAddToPlaylist v-show="trackToAddToPlaylist" :track="trackToAddToPlaylist"/>
    <LazyToast/>
  </v-app>
</template>

<script>
  import {Component, Vue, Getter, Mutation} from 'nuxt-property-decorator';
  import {UI, SPOTIFY} from '~/store/constants';
  import initSocketClient from '~/utils/init.socket.client';

  @Component
  export default class App extends Vue {
    //TODO all v-imgs use lazy-src prop to show loader until img shows?
    //TODO adjust vuetify breakpoints so that full spotify logo still shows up until it really can't fit

    trackToAddToPlaylist = null;
    
    @Getter('isLoading', {namespace: UI})
    isLoading;

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

      window.onSpotifyWebPlaybackSDKReady = async () => {
        this.setSdkReady();
      };

      this.$nuxt.$root.$on('addToPlaylist', trackToAdd => {
        this.$nuxt.$root.$emit('hideUpNext');
        this.trackToAddToPlaylist = trackToAdd;
      });

      this.$nuxt.$root.$on('closeAddToPlaylistModal', () => this.trackToAddToPlaylist = null);
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('addToPlaylist');
      this.$nuxt.$root.$off('closeAddToPlaylistModal');
    }
  }
</script>

<style lang="scss">
  .base-app-container {
    margin-top: 51px;
  }
</style>