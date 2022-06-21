<template>
  <v-app>
    <v-app-bar elevation="2" color="white" class="app-bar" short>
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
    
    <div v-show="!isLoading">
      <NewAndRecommended/>
      <MyAux/>
    </div>

    <LoadingOverlay v-show="isLoading"/>
      
    <DetailsOverlay/>
    <Toast/>
  </v-app>
</template>

<script>
  import {Component, Vue, Getter, Mutation} from 'nuxt-property-decorator';
  import {UI, SPOTIFY} from '~/store/constants';
  import {storageGet} from '~/utils/storage';
  import {AUTH} from '~/utils/constants';
  import {refreshToken} from '~/preAuth';
  import {handleAuthError} from '~/utils/auth';
  import {httpClient} from '~/utils/api';

  @Component
  export default class App extends Vue {
    //TODO all v-imgs use lazy-src prop to show loader until img shows?
    //TODO adjust vuetify breakpoints so that full spotify logo still shows up until it really can't fit
    
    @Getter('isLoading', {namespace: UI})
    isLoading;

    @Mutation('setSpotifyDeviceId', {namespace: SPOTIFY})
    setSpotifyDeviceId;

    @Mutation('setSpotifyPlayer', {namespace: SPOTIFY})
    setSpotifyPlayer;


    async beforeMount(){
      //add SDK to scripts
      const spotifyPlaybackSdk = document.createElement('script');
      spotifyPlaybackSdk.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
      document.head.appendChild(spotifyPlaybackSdk);
    }

    mounted(){
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.initSpotifyPlayer();
      };
    }

    //this also makes whatever device/browser that user is on avaiable as a Spotify Connect device (e.g speaker); 
    //tested and worked to play track from iphone Spotify to browser;
    //TODO: tie this in as a way to be live on aux (from Spotify -- user who prefers their interface)?
    //EDIT: doesn't seem doable as we'd need a hook to know/display something has been played from elsewhere etc. 
    //EDIT: --> maybe sptofiy tracking object has this info
    initSpotifyPlayer(){
      let accessToken = storageGet(AUTH.ACCESS_TOKEN);

      const newPlayer = () => {
        return new Spotify.Player({
          name: 'Aux',
          getOAuthToken: callback => {callback(accessToken)},
          volume: 1
        });
      };

      const player = newPlayer();

      player.addListener('ready', async ({device_id}) => {
        console.log(`Spotify player ready with device id ${device_id}`);
        this.setSpotifyDeviceId(device_id);

        //transfer playback to this device
        await httpClient.post('/passthru', {
          url: '/me/player',
          method: 'PUT',
          data: {device_ids: [device_id]}
        });
      });

      player.addListener('authentication_error', async ({message}) => {
          console.error(`Unauthorized to connect with Spotify player: ${message}. Refreshing token and retrying.`);
          this.retryPlayerInit();
      });

      player.connect().then(connected => {
        this.setSpotifyPlayer(player);
        console.log(`Connected to Spotify player: ${connected}`);

        if(!connected){
          console.log(`Retrying...`);
          this.retryPlayerInit();
        }
      });
    }

    async retryPlayerInit(){
      try{
        await refreshToken();
        this.initSpotifyPlayer();
      }
      catch(error){
        handleAuthError('Couldn\'t init player.');
      }
    };
  }
</script>

<style lang="scss">
  .app-bar {
    $phrase-border-size: 1px;
    
    height: $app-header-height !important;
    max-height: $app-header-height;
    margin-bottom: 22px;
    z-index: 20;

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
</style>