<template>
  <section>
    <div class="title-container">
      <div class="home-content-title">
        New & Recommended
        
        <div class="filter-container">
          <div class="clickable filter-label" v-if="allItems.length" @click="displayAll()">See All</div>
          <span class="filter-divider">/</span>
          <div class="clickable filter-label" @click="displayNewReleases()">New Releases Only</div>
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
  import {httpClient} from '~/utils/api';

  @Component
  export default class NewAndRecommended extends Vue {
    previewItems = [];
    newReleases = [];
    allItems = [];

    baseOverlay = {
      simpleOverlay: true,
      imgUrl: {}
    };

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    @Mutation('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    async beforeMount(){
      const { data } = await httpClient.get('/newAndRecommended');
      this.previewItems = setItemMetaData(data.previewItems);
      this.setLoading(false);
      
      this.newReleases = data.newReleases;
      this.allItems = data.allItems;
    }

    displayAll(){
      this.displayDetailOverlays({
        ...this.baseOverlay,
        allNewAndRecommended: true,
        name: 'NEW AND RECOMMENDED',
        data: this.allItems
      });
    }

    displayNewReleases(){
      this.displayDetailOverlays({
        ...this.baseOverlay,
        newReleases: true,
        name: 'NEW RELEASES',
        data: this.newReleases
      });
    }
  }
</script>