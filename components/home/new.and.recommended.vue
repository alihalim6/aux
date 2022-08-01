<template>
  <section>
    <div class="title-container">
      <div class="home-content-title">
        New & Recommended
        
        <div class="filter-container">
          <div class="clickable filter-label" @click="displayAll()">See All</div>
          <span class="filter-divider">/</span>
          <div class="clickable filter-label" @click="displayNewReleases()">New Releases Only</div>
        </div>
      </div>

      <div class="title-border"></div>
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
    allItems = [];
    overlayBackgroundImgUrl = 'https://dummyimage.com/768/000000/000000';

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    @Mutation('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    async beforeMount(){
      const { data } = await httpClient.get('/newAndRecommended');
      this.previewItems = setItemMetaData(data.previewItems);
      this.setLoading(false);
      
      this.allItems = data.allItems;
    }

    displayAll(){
      this.displayDetailsOverlay({
        allNewAndRecommended: true,
        simpleOverlay: true,
        imgUrl: this.overlayBackgroundImgUrl,
        name: 'NEW AND RECOMMENDED',
        data: this.allItems
      });
    }

    displayNewReleases(){
      this.displayDetailsOverlay({
        newReleases: true,
        simpleOverlay: true,
        imgUrl: this.overlayBackgroundImgUrl,
        name: 'NEW RELEASES'
      });
    }
  }
</script>