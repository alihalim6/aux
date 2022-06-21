<template>
  <section>
    <div class="title-container">
      <div class="section-title">
        New & Recommended
        
        <div class="filter-container">
          <div class="clickable filter-label">See All</div>
          <span class="filter-divider">/</span>
          <div class="clickable filter-label">New Releases Only</div>
        </div>
      </div>

      <div class="title-border"></div>
    </div>

    <ContentCarousel :data="previewItems"/>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Mutation} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';
  import {httpClient} from '~/utils/api';

  @Component
  export default class NewAndRecommended extends Vue {
    allItems = [];
    previewItems = []; //subset of items to preview on homepage 
    newReleasesOnly = [];

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    async beforeMount(){
      const { data } = await httpClient.get('/newAndRecommended');

      this.allItems = data.allItems;
      this.previewItems = setItemMetaData(data.previewItems);
      this.newReleasesOnly = data.newReleasesOnly;

      this.setLoading(false);
    }
  }
</script>