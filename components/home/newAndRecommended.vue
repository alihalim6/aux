<template>
  <section>
    <div class="content-container">
      <div class="section-title">
        New & Recommended
        
        <div class="clickable see-all">
          <div class="sub-title-label">See All</div><v-icon class="see-all-icon">mdi-arrow-right</v-icon>
        </div>
      </div>

      <div class="sub-title">Lorem ipsum dolor sit amet, consectetur adipiscing elit, consectetur adipiscing.</div>
      <div class="secondary-title-border"></div>
    </div>

    <ContentItems :data="data"/>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Action} from 'nuxt-property-decorator';
  import {setItemDisplayData} from '~/utils/helpers';
  
  @Component
  export default class NewAndRecommended extends Vue {
      data = [];

      @Action('fetchNewAndRecommendedData')
      fetchNewAndRecommendedData;

      @Getter('data')
      getData;

      @Getter('currentlyPlayingItemUri', {namespace: 'spotify'})
      currentlyPlayingItemUri;

      @Getter('spotifyPlayer', {namespace: 'spotify'})
      spotifyPlayer;
      
      preProcessData(){
        this.data.forEach(setItemDisplayData);
      }

      async beforeMount(){
        await this.fetchNewAndRecommendedData();
        const {previewData} = this.getData('newAndRecommended');
        this.data = previewData;

        if(this.data){
          this.preProcessData();
        }
      }

  }
</script>