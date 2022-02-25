<template>
  
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';
  import {storageGet} from '~/utils/storage';
  import {AUTH} from '~/utils/constants';
  import {initToken, accessTokenExpired, refreshToken} from '~/preAuth.js';

  @Component
  export default class Root extends Vue {
    async beforeMount(){
      (async () => {
        //this would mean you've been sent here via redirect_uri after authenticating 
        //TODO: handle error in url
         if(this.$route.query.code && this.$route.query.state){//TODO: check state
          //get data and load app
          await initToken(this);
          this.$router.push({name: 'home'});
        }
        //else if storage has access token, user has been in app, so go check if expired etc and load app
        else if(storageGet(AUTH.ACCESS_TOKEN)){
          if(accessTokenExpired()){
            await refreshToken(this);
          }
          
          this.$router.push({name: 'home'});
        }
        //else splash page
        else{
          this.$router.push({name: 'splash'});
        }
      })();
    }
  }
</script>
