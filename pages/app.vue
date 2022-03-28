<template>
    <v-app>
        <v-app-bar elevation="2" color="white" class="app-bar"></v-app-bar>
        
        <NewAndRecommended/>
        
        <DetailOverlay/>
        <Toast/>
    </v-app>
</template>

<script>
import {Component, Vue, Mutation} from 'nuxt-property-decorator';
import {httpClient} from '~/utils/api';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';

@Component
export default class App extends Vue {
    //TODO all v-imgs use lazy-src prop to show loader until img shows?

    @Mutation('setToast', {namespace: 'ui'})
    setToast;

    handleApiError(error){
        console.log(error);
        this.setToast({display: true, text: 'Something went wrong lorem ipsum...'});
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