<template>
  <section>
    <div class="title-container">
      <div class="home-content-title">
        New & Recommended
        
        <div class="filter-container" v-if="allItems && allItems.length" >
          <div class="clickable filter-label" @click="displayAll()">
            <span v-if="overlayLoading === NEW_AND_RECOMMENDED">...</span>
            <span v-else>See All</span>
          </div>
          
          <span class="filter-divider">/</span>
          
          <div class="clickable filter-label" @click="displayNewReleases()">
            <span v-if="overlayLoading === NEW_RELEASES">...</span><!-- tried progress circular but it freezes for some reason -->
            <span v-else>New Releases Only</span>
          </div>
        </div>
      </div>
    </div>

    <ContentCarousel :data="previewItems"/>
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

    baseOverlay = {
      simpleOverlay: true,
      imgUrl: {}
    };

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    async beforeMount(){
      const {previewItems, newReleases, allItems} = await newAndRecommended();
      this.previewItems = setItemMetaData(previewItems);
      this.setLoading(false);
      
      this.newReleases = newReleases;
      this.allItems = allItems;

      this.$nuxt.$root.$on('newAndRecoOverlayShown', () => this.overlayLoading = false);
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
      }, 20);
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
  }
</script>