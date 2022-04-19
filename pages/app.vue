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
        
        <NewAndRecommended/>

        
        <DetailOverlay/>
        <Toast/>
    </v-app>
</template>

<script>
import {Component, Vue, Mutation, Action} from 'nuxt-property-decorator';
import {httpClient} from '~/utils/api';
import {refreshToken, accessTokenExpiring} from '~/preAuth';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';

@Component
export default class App extends Vue {
    //TODO all v-imgs use lazy-src prop to show loader until img shows?
    //TODO adjust vuetify breakpoints so that full spotify logo still shows up until it really can't fit

    @Mutation('setToast', {namespace: 'ui'})
    setToast;

    @Action('stopPlayback', {namespace: 'spotify'})
    stopPlayback;

    handleApiError(error){
        this.stopPlayback();
        this.setToast({display: true, text: 'Something went wrong lorem ipsum...'});
        console.log(error);
    }

    async attemptTokenRefresh(){
        try{
            await refreshToken(this);
        }
        catch(error){
            console.log(`unable to refresh token after API 401; sending user back to splash: ${error}`);
            this.$router.push('splash');
        }
    }

    initHttpInterceptors(){
        httpClient.interceptors.request.use(async config => {
            if(accessTokenExpiring()){
                this.attemptTokenRefresh(); 
            }
            
            return {
                ...config,
                headers: {'access-token': storageGet(AUTH.ACCESS_TOKEN)}
            };
        });

        httpClient.interceptors.response.use(async response => {
            const errorMessage = response.data.error ? response.data.error.message : '';

            if(response.data.error && errorMessage){
                if(errorMessage.indexOf('401') > 1){
                    this.attemptTokenRefresh();
                }
                else{
                    this.handleApiError(errorMessage);
                }
            }

            return response;
        }, error => {
            this.handleApiError(error);
        });
    }
    
    async beforeMount(){
        this.initHttpInterceptors();
    }
}
</script>

<style lang="scss">
.app-bar {
    $phrase-border-size: 1px;
    
    height: $app-header-height !important;
    max-height: $app-header-height;
    margin-bottom: 22px;
    z-index: 1000;

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
            width: 125px;
        }

        .spotify-icon {
            width: 40px;
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