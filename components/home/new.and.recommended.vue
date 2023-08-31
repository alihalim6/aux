<template>
  <section>
    <div class="content-container">
      <div class="home-content-title">
        <div class="d-flex align-center">
          <h1 aria-label="new releases and recommended Spotify tracks, albums and artists">New & Recommended</h1>

          <v-hover v-slot="{hover}">
            <v-icon 
              @click="refreshData()" 
              @keydown.enter="refreshData()"
              class="clickable refresh-data" 
              :class="{'hover-scale': hover, 'refreshing-data': refreshingData}" 
              color="#1DB954"
              aria-label="refresh new and recommended Spotify tracks, albums and artists"
              tabindex="0"
            >
              mdi-refresh
            </v-icon>
          </v-hover>
        </div>
        
        <div class="tab-container d-flex align-center pl-0 mt-1" v-if="allItems.length">
          <v-hover v-slot="{hover}">
            <div class="clickable tab-label" :class="{'hover-scale': hover && !$vuetify.breakpoint.xs}" @click="displayAll()">
              <span v-if="overlayLoading === NEW_AND_RECOMMENDED">...</span><!-- tried progress circular but it freezes for some reason -->
              <button v-else class="new-and-reco-tab" aria-label="open modal with all new and recommended tracks, albums and artists">SEE ALL</button>
            </div>
          </v-hover>
          
          <span class="tab-divider" aria-hidden="true">/</span>
          
          <v-hover v-slot="{hover}">
            <div class="clickable tab-label" :class="{'hover-scale': hover && !$vuetify.breakpoint.xs}" @click="displayNewReleases()">
              <span v-if="overlayLoading === NEW_RELEASES">...</span>
              <button v-else class="new-and-reco-tab" aria-label="open modal with new releases only">NEW RELEASES ONLY</button>
            </div>
          </v-hover>
        </div>
      </div>
    </div>

    <ContentCarousel :data="previewItems" :new-and-recommended="true" :handle-scroll="() => $nuxt.$emit('activatePlayer')"/>
  </section>
</template>

<script>
  import {Component, Vue, Mutation} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';
  import newAndRecommended from '~/api/newAndRecommended';

  @Component
  export default class NewAndRecommended extends Vue {
    previewItems = [];
    allItems = [];
    NEW_AND_RECOMMENDED = 'NEW AND RECOMMENDED';
    NEW_RELEASES = 'NEW RELEASES';
    overlayLoading = false;
    refreshingData = false;
    likedTracksAndAlbums = null;

    baseOverlay = {
      simpleOverlay: true,
      imgUrl: {}
    };

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    async beforeMount(){
      await this.getData();
      this.$nuxt.$root.$on('newAndRecoOverlayShown', () => this.overlayLoading = false);
      this.$nuxt.$on('showAllNewAndReco', this.displayAll);

      this.$nuxt.$root.$on('likedTracksAndAlbums', likes => {
        this.likedTracksAndAlbums = likes;
      });
    }

    async getData(){
      let response;
      try {
       response = await newAndRecommended(this.likedTracksAndAlbums);
      }catch(e){
        //console.log(e);
      }
      this.previewItems = setItemMetaData(response.previewItems);
      this.setLoading(false);
      this.allItems = response.allItems;
    }

    displayOverlay({name, ...rest}){
      this.overlayLoading = name;

      this.$nuxt.$root.$emit('displayDetailOverlay', {
        ...this.baseOverlay,
        name,
        ...rest
      });
    }

    displayAll(){
      this.displayOverlay({
        allNewAndRecommended: true,
        name: this.NEW_AND_RECOMMENDED,
        data: this.allItems
      });
    }

    displayNewReleases(){
      this.displayOverlay({
        newReleases: true,
        name: this.NEW_RELEASES
      });
    }

    async refreshData(){
      if(!this.refreshingData){
        this.refreshingData = true;
        await this.getData();
        this.refreshingData = false;
      }
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('newAndRecoOverlayShown');
      this.$nuxt.$off('showAllNewAndReco');
      this.$nuxt.$root.$off('likedTracksAndAlbums');
    }
  }
</script>

<style lang="scss">
  @import '~/components/styles';
  
  .new-and-reco-tab {
    border: 2px solid $primary-theme-color;
    border-radius: 16px;
    padding: 6px 10px;
  }

   .tab-label {
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
    font-weight: bold;
    letter-spacing: normal;
  }
</style>