<template>
  <v-app :class="{'item-playing': currentlyPlayingItem.uri}">
    <AppHeader/>

    <div v-show="!isLoading" class="base-app-container">
      <NewAndRecommended/>
      <Playlists/>
      <MyAux/>
      <LazyDetailOverlays/>
    </div>

    <LazyFeed/>

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
  .base-app-container {
    margin-top: 24px;
  }
</style>