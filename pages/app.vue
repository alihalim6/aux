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

      <div class="user-container">
        <div class="clickable on-air-container">
          <div class="users-on-air">{{users.length}}</div>
          <span class="live-now"> other user<span>{{users.length == 1 ? '' : 's'}}</span> on now</span>
          <v-icon small class="live-info-icon" color="#888">mdi-help-circle-outline</v-icon>
        </div>

        <div class="clickable profile-container" v-if="profile">
          <v-img v-if="profile.img" :src="profile.img" class="round-img-icon"></v-img>
          <div v-else class="round-profile-letter">{{`${profile.name.substring(0, 1).toUpperCase()}`}}</div>
        </div>
      </div>
    </v-app-bar>

    <div v-show="!isLoading" class="base-app-container">
      <NewAndRecommended/>
      <MyAux/>
      <Playlists/>
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
  import {UI, SPOTIFY, FEED, USER} from '~/store/constants';
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

    @Getter('users', {namespace: FEED})
    users;

    @Getter('profile', {namespace: USER})
    profile;

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
      margin: 0px $base-padding 0px 0px;

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

    .user-container {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .on-air-container {
        $on-air-margin: 4px;

        display: flex;
        align-items: center;
        position: relative;

        .users-on-air {
          background-color: $primary-theme-color;
          color: $secondary-theme-color;
          font-size: 38px;
          font-weight: 600;
          line-height: 0.9;
          padding: 1px;
          margin-right: $on-air-margin;
          border-radius: 2px;
        }

        .live-now {
          color: #666666;
          font-size: 14px;
          font-weight: bold;
          margin-right: $on-air-margin;

          @media(max-width: $max-inner-width){
            display: none;
          }
        }

        .live-info-icon {
          top: 1px;
        }

        &::after {
          content: '';
          position: absolute;
          height: 4px;
          width: 10px;
          bottom: -8px;
          left: 0px;
          background-color: $spotify-green;
          animation: oscillate;
          animation-duration: 4s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-fill-mode: forwards;

          @keyframes oscillate {
            0% {transform: scaleX(1) translateX(0);}
            10% {transform: scaleX(1.2) translateX(115%);} 
            20% {transform: scaleX(1) translateX(0%);}
            100% {transform: scaleX(1) translateX(0);} 
          }
        }
      }

      .profile-container {
        $profile-icon-size: 36px;

        margin-left: 18px;

        .round-img-icon {
          max-width: $profile-icon-size;
          height: $profile-icon-size;
          border: 1px solid $spotify-green;
        }

        .round-profile-letter {
          border: 2px solid $spotify-green;
          font-weight: bold;
          padding: 16px;
          color: $primary-theme-color;
        }
      }
    }
  }

  .base-app-container {
    margin-top: calc(#{$app-header-height} + 10px);
  }
</style>