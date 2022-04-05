<template>
    <v-app>
        <v-app-bar elevation="2" color="white" class="app-bar">
            <div class="logo-container">
                <div class="stripe-one"></div><div class="stripe-two"></div>
               <div class="logo-label">AUX</div>
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

@Component
export default class App extends Vue {
    //TODO all v-imgs use lazy-src prop to show loader until img shows?

    @Mutation('setToast', {namespace: 'ui'})
    setToast;

    @Action('stopPlayback', {namespace: 'spotify'})
    stopPlayback;

    handleApiError(error){
        this.stopPlayback();
        this.setToast({display: true, text: 'Something went wrong lorem ipsum...'});
        console.log(error);
    }

    initApiErrorHandling(){
        httpClient.interceptors.response.use(response => {
            if(response.data.error && response.data.error.message){
                this.handleApiError(response.data.error.message);
            }

            return response;
        }, error => {
            this.handleApiError(error);
        });
    }
    
    async beforeMount(){
        //set up response interceptor for API calls
        this.initApiErrorHandling();
    }
}
</script>

<style lang="scss">
.app-bar {
    height: $app-header-height !important;
    max-height: $app-header-height;
    margin-bottom: 22px;
    z-index: 1000;

    .logo-container {
        margin: 28px auto 0px;
        display: flex;
        align-items: baseline;
        justify-content: center;
        border: 4px solid black;
        border-radius: 8px;
        padding-left: 14px;
        padding-right: 10px;

        .logo-stripe {
            height: 16px;
            width: 9px;
            transform: skewX(-20deg);
            background-color: white;
            border: 2px solid $primary-theme-color;
        }

        .stripe-one {
            @extend .logo-stripe;
            margin-right: 4px;
        }

        .stripe-two {
            @extend .logo-stripe;
            margin-right: 2px;
        }

        .logo-label {
            color: $primary-theme-color;
            font-weight: 600;
            letter-spacing: 2px;
            font-size: 33px;
            margin-left: 4px;
        }
    }
}
</style>