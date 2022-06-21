<template>
  <section class="my-aux-container mt-4 pt-1 pb-6">
    <div class="title-container mt-4">
      <div class="section-title color-white">My Vibe</div>
    </div>

    <v-tabs class="tab-container my-aux-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
      <v-tab v-for="(item, index) in content" :key="item.key">
        <div class="filter-label" :class="{'selected-tab': selectedTab === index}">
          <span v-if="!item.fetchPending" :id="`myAuxTabLabel${index}`">{{item.label}}</span>
          <v-progress-circular v-if="item.fetchPending" class="fetch-in-progress" indeterminate color="white"></v-progress-circular>
        </div>
        <span v-if="index < (content.length - 1)" class="filter-divider color-white">/</span>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="selectedTab" class="tab-content-container mt-2">
      <v-tab-item v-for="item in content" :key="item.key">
        <div class="my-aux-list-container my-aux-responsive" v-if="item.data.length" v-scroll.self="contentScrolled">
          <TrackList v-if="!item.carousel" :tracks="item.data" :tracksFromDifferentAlbums="true" :displayArtists="true" :hideAlbums="true" :hideLikeability="item.hideLikeability"/>
          <ContentCarousel v-if="item.carousel" :data="item.data" :vertical="true"/>
        </div>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {httpClient} from '~/utils/api';
  import {setItemMetaData, msToDuration} from '~/utils/helpers';
  import {MyAuxContent, UserItem} from '~/types/user';
  import {MY_AUX} from '~/utils/constants';

  @Component
  export default class MyAux extends Vue {
    selectedTab = 0;

    defaultContent = {
      data: [],
      total: 0,
      offset: 0
    };

    content: MyAuxContent[] = [
      {
        ...this.defaultContent,
        key: 'likedTracks',
        label: MY_AUX.LIKED_ITEMS,
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

    mapData(data: UserItem[]){
      return data.map((item: UserItem) => {
        return {
          ...setItemMetaData([(item.track || item.album)])[0],
          hideAlbum: true,
          duration: item.track ? msToDuration(item.track.duration_ms) : 0
        }
      });
    };

    async beforeMount(){
      const { data } = await httpClient.get('/myAux');

      this.content.forEach((item: MyAuxContent) => {
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
    async contentScrolled(e: any){
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
  }
</script>

<style lang="scss">
  @import '~/styles/variables.scss';

  .my-aux-container {
    background-color: black;

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
        color: white;
      }
    }

    .tab-content-container {
      background-color: transparent !important;
    }

    .my-aux-list-container {
      max-width: $max-inner-width;
      max-height: 500px;
      overflow-y: scroll;
      margin: 0 $base-padding;
      border-radius: 4px;
      padding: 4px;
      background-color: white;
    }

    .my-aux-responsive {
      @media(min-width: $max-inner-width){
        max-width: $max-inner-width - 28px;
        margin: 0 auto;
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
  }

  .color-white {
    color: white !important;
  }
</style>