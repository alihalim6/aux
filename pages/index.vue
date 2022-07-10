<template>
  <v-app>
    <LoadingOverlay v-show="isLoading"/>
  </v-app>
</template>

<script>
  import {Component, Vue, Mutation, Action, Getter} from 'nuxt-property-decorator';
  import {storageGet} from '~/utils/storage';
  import {AUTH, SPLASH, APP} from '~/utils/constants';
  import {initToken, accessTokenExpired, refreshToken} from '~/auth';
  import {UI} from '~/store/constants';
  import {handleAuthError} from '~/utils/auth';

  @Component
  export default class Root extends Vue {
    @Mutation('setToast', {namespace: UI})
    setToast;

    @Getter('isLoading', {namespace: UI})
    isLoading;

    async beforeMount(){
      //query params mean you've been sent here from Spotify via redirect_uri after authenticating 
      if(this.$route.query.code && this.$route.query.state){
        try{
          //get data and load app!
          await initToken();
        }
        catch(error){
          console.error('token init failed...');
          handleAuthError(error);
        }

        //clean up url on return from Spotify
        window.history.replaceState('', '', window.location.toString().split('?')[0].replace('/#/', '/'));

        this.$router.push(APP);
      }
      else if(this.$route.query.error){
        handleAuthError(this.$route.query.error);
      }

      //else if storage has access token, user has been in app, so go check if expired etc and load app
      else if(storageGet(AUTH.ACCESS_TOKEN)){
        if(accessTokenExpired()){
          console.log('token expired, attempting refreshing it');

          try{
            await refreshToken();
            this.$router.push(APP);
          }
          catch(error){
            handleAuthError('token refresh failed...');
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
  }
</script>