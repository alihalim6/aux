<template>
  <v-app>
    <LoadingOverlay v-show="isLoading"/>
  </v-app>
</template>

<script>
  import {Component, Vue, Mutation, Action, Getter} from 'nuxt-property-decorator';
  import {storageGet, clearStorage} from '~/utils/storage';
  import {AUTH, SPLASH, APP} from '~/utils/constants';
  import {initToken, accessTokenExpiring, refreshToken} from '~/preAuth';
  import {SPOTIFY, UI} from '~/store/constants';

  @Component
  export default class Root extends Vue {
    @Mutation('setSpotifyDeviceId', {namespace: SPOTIFY})
    setSpotifyDeviceId;

    @Mutation('setSpotifyPlayer', {namespace: SPOTIFY})
    setSpotifyPlayer;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Action('closeDetailsOverlay', {namespace: UI})
    closeDetailsOverlay;

    @Action('stopPlayback', {namespace: UI})
    stopPlayback;

    @Getter('isLoading', {namespace: UI})
    isLoading;

    async beforeMount(){
      //add SDK to scripts
      const spotifyPlaybackSdk = document.createElement('script');
      spotifyPlaybackSdk.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
      document.head.appendChild(spotifyPlaybackSdk);

      //query params mean you've been sent here from Spotify via redirect_uri after authenticating 
      if(this.$route.query.code && this.$route.query.state){
        try{
          //get data and load app!
          await initToken();
        }
        catch(error){
          console.error('token init failed...');
          this.handleAuthError(error);
        }

        //clean up url on return from Spotify
        window.history.replaceState('', '', window.location.toString().split('?')[0].replace('/#/', '/'));

        this.$router.push(APP);
      }
      else if(this.$route.query.error){
        this.handleAuthError(this.$route.query.error);
      }

      //else if storage has access token, user has been in app, so go check if expired etc and load app
      else if(storageGet(AUTH.ACCESS_TOKEN)){
        if(accessTokenExpiring()){
          console.log('token expiring, attempting refreshing it');

          try{
            await refreshToken();
            this.$router.push(APP);
          }
          catch(error){
            this.handleAuthError('token refresh failed...');
          }
        }
        else{
          this.$router.push(APP);
        }
      }
      //else splash page
      else{
        this.$router.push(SPLASH);
      }
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

      player.addListener('ready', ({device_id}) => {
        console.log(`Spotify player successfully connected with device id ${device_id}`);
        this.setSpotifyDeviceId(device_id);
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
        this.handleAuthError('Couldn\'t init player.');
      }
    };

    handleAuthError(error){
      console.error(`${error}. Sending back to Splash page.`);
      this.setToast({display: true, text: 'Spotify needs you to log in again lorem ipsum...'});
      this.$router.push(SPLASH);

      this.closeDetailsOverlay();
      this.stopPlayback();

      //clear auth from storage too so that if user goes back in browser, still land on splash
      clearStorage();
    }
  }
</script>