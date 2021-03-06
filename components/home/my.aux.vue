<template>
  <section class="pt-1 pb-6">
    <div class="title-container mt-4">
      <div class="section-title">My Vibe</div>
    </div>

    <v-tabs class="tab-container home-content-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
      <v-tab v-for="(item, index) in content" :key="item.key">
        <div class="filter-label" :class="{'selected-tab': selectedTab === index}">
          <span v-if="!item.fetchPending" :id="`myAuxTabLabel${index}`">{{item.label}}</span>
          <v-progress-circular v-if="item.fetchPending" class="fetch-in-progress" indeterminate color="white"></v-progress-circular>
        </div>
        <span v-if="index < (content.length - 1)" class="filter-divider color-black">/</span>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="selectedTab" class="mt-2 home-tabs">
      <v-tab-item v-for="(item, index) in getContent()" :key="item.key">
        <div class="home-content" :id="`myAux${index}`">
          <TrackList v-if="!item.carousel" :tracks="item.data" :tracksFromDifferentAlbums="true" :displayArtists="true" :hideAlbums="true" :hideLikeability="item.hideLikeability"/>
          <ContentCarousel v-if="item.carousel" :data="item.data" :vertical="true"/>
        </div>
        
        <BackToTop :elementId="`myAux${index}`"/>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
  import {Component, Vue} from 'vue-property-decorator';
  import {httpClient} from '~/utils/api';
  import {setItemMetaData, msToDuration} from '~/utils/helpers';
  import {MY_AUX} from '~/utils/constants';

  @Component
  export default class MyAux extends Vue {
    selectedTab = 0;

    defaultContent = {
      data: [],
      total: 0,
      offset: 0
    };

    content = [
      {
        ...this.defaultContent,
        key: 'likedTracks',
        label: MY_AUX.LIKED_TRACKS,
        hideLikeability: true,
        api: 'tracks'
      },
      {
        ...this.defaultContent,
        key: 'likedAlbums',
        label: MY_AUX.LIKED_ALBUMS,
        carousel: true,
        api: 'albums'
      },
      //apparently API doesn't return total for this
      {
        data: [],
        key: 'recentlyPlayed',
        label: MY_AUX.RECENTLY_PLAYED
      }
    ];

    mapData(data){
      return data.map(item => {
        return {
          ...setItemMetaData([(item.track || item.album)])[0],
          hideAlbum: true,
          duration: item.track ? msToDuration(item.track.duration_ms) : 0
        }
      });
    };

    async beforeMount(){
      const { data } = await httpClient.get('/myAux');

      this.content.forEach(item => {
        item.data = this.mapData(data[item.key].items);
        item.total = data[item.key].total;
        //lazy loading/pagination
        item.limit = item.offset = data[item.key].limit;
      });

      //data structure for top items is different than the others, so no mapping needed
      this.content = [...this.content, {
        key: 'topItems',
        label: MY_AUX.TOP_ITEMS,
        data: setItemMetaData(data.topItems),
        carousel: true
      }];
    }

    //fetch more data for current tab when certain scroll length reached
    async contentScrolled(e){
      const currentContent = this.content[this.selectedTab];
      const scrollThreshold = 1000;
      const fetchMoreData = (e.target.scrollHeight - e.target.scrollTop <= scrollThreshold);

      if(currentContent.offset && currentContent.total){
        const moreDataToFetch = currentContent.offset < currentContent.total;

        if(moreDataToFetch && fetchMoreData && !currentContent.fetchPending){
          currentContent.fetchPending = true;

          const { data } = await httpClient.post('/passthru', {
            url: `/me/${currentContent.api}?limit=${currentContent.limit}&offset=${currentContent.offset}`,
            method: 'GET'
          });

          currentContent.data = [...currentContent.data, ...this.mapData(data.items)];
          currentContent.offset += data.items.length;
          currentContent.fetchPending = false;
        }
      }
    }

    getContent(){
      return this.content.filter(content => content.data.length);
    }
  }
</script>

<style lang="scss">
  @import '~/styles/variables.scss';

  .tab-container {
    padding-left: $base-padding;
    max-width: calc(100vw - #{$base-padding});

    @media(min-width: $max-inner-width){
      padding: 0px;
    }

    .fetch-in-progress {
      $icon-size: 16px !important;
      width: $icon-size;
      height: $icon-size;
    }

    .selected-tab {
      background-color: $spotify-green;
      color: $secondary-theme-color;
      border: none;
      padding: 10px;
    }
  }

  .v-tab {
    padding: 0px !important;
  }

  .v-slide-group__prev {
    display: none !important;
  }

  .v-tab--active::before {
    opacity: 0 !important;
  }
  
  .color-black {
    color: black !important;
  }
</style>