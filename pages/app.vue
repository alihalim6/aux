<template>
    <v-app>
        <v-app-bar elevation="2" color="white" class="app-bar"></v-app-bar>
        
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
    max-height: $app-header-height;
    margin-bottom: 22px;
    z-index: 1000;
}
</style>