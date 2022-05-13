<template>
  <section>
    <div class="title-container">
      <div class="section-title">
        New & Recommended
        
        <div class="action-container">
          <div class="clickable action-label">New Releases Only</div>
          <span class="action-divider">/</span>
          <div class="clickable action-label">See All</div>
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
  import {SPOTIFY, UI} from '~/store/constants';
  import {httpClient} from '~/utils/api';

  @Component
  export default class NewAndRecommended extends Vue {
    allItems = [];
    previewItems = []; //subset of items to preview on homepage 
    newReleasesOnly = [];

    @Getter('currentlyPlayingItemUri', {namespace: SPOTIFY})
    currentlyPlayingItemUri;

    @Getter('spotifyPlayer', {namespace: SPOTIFY})
    spotifyPlayer;

    @Mutation('setLoading', {namespace: UI})
    setLoading;

    async beforeMount(){
      const { data } = await httpClient.get('/newAndRecommended');

      this.allItems = data.allItems;
      this.previewItems = setItemMetaData(data.previewItems);
      this.newReleases = data.newReleasesOnly;

      this.setLoading(false);
    }
  }
</script>