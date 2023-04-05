<template>
  <section>
    <div class="content-container">
      <div class="home-content-title">
        <div class="d-flex align-center">
          <span>New & Recommended</span>

          <v-hover v-slot="{hover}">
            <v-icon @click="refreshData()" class="clickable refresh-data" :class="{'hover-scale': hover, 'refreshing-data': refreshingData}" color="#1DB954">mdi-refresh</v-icon>
          </v-hover>
        </div>
        
        <div class="filter-container" v-if="allItems.length" >
          <div class="clickable filter-label" @click="displayAll()">
            <span v-if="overlayLoading === NEW_AND_RECOMMENDED">...</span><!-- tried progress circular but it freezes for some reason -->
            <span v-else>See All</span>
          </div>
          
          <span class="filter-divider">/</span>
          
          <div class="clickable filter-label" @click="displayNewReleases()">
            <span v-if="overlayLoading === NEW_RELEASES">...</span>
            <span v-else>New Releases Only</span>
          </div>
        </div>
      </div>
    </div>

    <ContentCarousel :data="previewItems" :new-and-recommended="true"/>
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
    newReleases = [];
    allItems = [];
    NEW_AND_RECOMMENDED = 'NEW AND RECOMMENDED';
    NEW_RELEASES = 'NEW RELEASES';
    overlayLoading = false;
    refreshingData = false;

    baseOverlay = {
      simpleOverlay: true,
      imgUrl: {}
    };

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    async beforeMount(){
      await this.getData();
      this.setLoading(false);

      this.$nuxt.$root.$on('newAndRecoOverlayShown', () => this.overlayLoading = false);
    }

    async getData(){
      try {
        const {previewItems, newReleases, allItems} = await newAndRecommended();
        this.previewItems = setItemMetaData(previewItems);
        this.newReleases = newReleases;
        this.allItems = allItems;
      }
      catch(error){
        //console.error(error);
      }
    }

    displayOverlay({allNewAndRecommended, newReleases, name, data}){
      this.overlayLoading = name;

      setTimeout(() => {
        this.$nuxt.$root.$emit('displayDetailOverlay', {
          ...this.baseOverlay,
          allNewAndRecommended,
          newReleases,
          name,
          data
        });
      }, 10);
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
        name: this.NEW_RELEASES,
        data: this.newReleases
      });
    }

    async refreshData(){
      this.refreshingData = true;
      await this.getData();
      this.refreshingData = false;
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('newAndRecoOverlayShown');
    }
  }
</script>