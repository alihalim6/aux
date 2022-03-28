<template>
  <v-app>
      <div>
        Loading animation here...
      </div>
  </v-app>
</template>

<script>
  import {Component, Vue, Mutation, Action} from 'nuxt-property-decorator';
  import {storageGet, clearStorage} from '~/utils/storage';
  import {AUTH} from '~/utils/constants';
  import {initToken, accessTokenExpiring, refreshToken} from '~/preAuth.js';

  @Component
  export default class Root extends Vue {
    @Mutation('setSpotifyDeviceId', {namespace: 'spotify'})
    setSpotifyDeviceId;

    @Mutation('setSpotifyPlayer', {namespace: 'spotify'})
    setSpotifyPlayer;

    @Mutation('setToast', {namespace: 'ui'})
    setToast;

    @Action('closeDetailOverlay', {namespace: 'ui'})
    closeDetailOverlay;

    @Action('stopPlayback', {namespace: 'ui'})
    stopPlayback;


        //this also makes whatever device/browser user is on avaiable as a Spotify Connect device (e.g speaker); 
    //tested and worked to play track from iphone Spotify to browser;
    //TODO: tie this in as a way to be live on aux (from Spotify -- user who prefers their interface)?
    //EDIT: doesn't seem doable as we'd need a hook to know/display something has been played from elsewhere etc. 
      //EDIT: --> maybe sptofiy tracking object has this info
    initSpotifyPlayer(){
      let accessToken = storageGet(AUTH.ACCESS_TOKEN);

      const newPlayer = () => {
        return  new Spotify.Player({
          name: 'Aux',
          getOAuthToken: callback => {callback(accessToken)},
          volume: 1
        });
      };

      const retryPlayerInit = async () => {
        try{
          await refreshToken(this);
          this.initSpotifyPlayer();
        }
        catch(error){
          console.log(`${error}.  Couldn't init play. Sending user to Splash page.`);
          this.$router.push('splash');
          this.setToast({display: true, text: 'Spotify needs you to log in again lorem ipsum...'});
        }
      };

      let player = newPlayer();

      player.addListener('not_ready', ({device_id}) => {console.log(`Spotify player unable to connect with device id ${device_id}`);});
      player.addListener('initialization_error', ({message}) => {console.log(`Spotify player unable to connect: ${message}`);});
      player.addListener('account_error', ({message}) => {console.log(`Spotify player unable to connect: ${message}`);});

      player.addListener('ready', ({device_id}) => {
        console.log(`Spotify player successfully connected with device id ${device_id}`);
        this.setSpotifyDeviceId(device_id);
      });

      player.addListener('authentication_error', async ({message}) => {
          console.log(`Unauthorized to connect with Spotify player: ${message}.  Refreshing token and retrying.`);
          retryPlayerInit();
      });

      player.connect().then(connected => {
        this.setSpotifyPlayer(player);
        console.log(`Connected to Spotify player: ${connected}`);

        if(!connected){
          console.log(`Retrying...`);
          retryPlayerInit();
        }
      });
    }

    handleAuthError(error){
      console.log(`${error}.  Sending back to Splash page.`);
      this.setToast({display: true, text: 'Spotify needs you to log in again lorem ipsum...'});
      this.$router.push('splash');

      this.closeDetailOverlay();
      this.stopPlayback();
      //clear storage too so that if user goes back in browser, still land on splash
      clearStorage();
    }

    async beforeMount(){
      //add SDK to scripts
      const spotifyPlaybackSdk = document.createElement('script');
      spotifyPlaybackSdk.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
      document.head.appendChild(spotifyPlaybackSdk);

      //these mean you've been sent here via redirect_uri after authenticating 
      if(this.$route.query.code && this.$route.query.state){
        try{
          //get data and load app!
          await initToken(this);
        }
        catch(error){
          console.log('token init failed...');
          this.handleAuthError(error);
        }

        //clean up url on return from Spotify
        window.history.replaceState('', '', window.location.toString().split('?')[0].replace('/#/', '/'));

        this.$router.push('app');
      }
      else if(this.$route.query.error){
        this.handleAuthError(this.$route.query.error);
      }

      //else if storage has access token, user has been in app, so go check if expired etc and load app
      else if(storageGet(AUTH.ACCESS_TOKEN)){
        if(accessTokenExpiring()){
          console.log('token expiring, attempting refreshing it');

          try{
            await refreshToken(this);
            this.$router.push('app');
          }
          catch(error){
            console.log('token refresh failed...');
            this.handleAuthError(error);
          }
        }
        else{
          this.$router.push('app');
        }
      }
      //else splash page
      else{
        this.$router.push('splash');
      }
    }

    mounted(){
        window.onSpotifyWebPlaybackSDKReady = () => {
            this.initSpotifyPlayer();
        };
    }
  }
</script>