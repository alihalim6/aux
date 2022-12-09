<template>
  <section class="pt-1 pb-6">
    <div class="title-container mt-4">
      <div class="home-content-title">My Vibe</div>
    </div>

    <v-tabs class="tab-container home-content-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
      <v-tab v-for="(item, index) in getContent()" :key="item.key" @change="tabChanged">
        <div class="filter-label" :class="{'selected-tab': selectedTab === index}">
          <span v-if="!item.fetchPending" :id="`myAuxTabLabel${index}`">{{item.label}}</span>
          <v-progress-circular v-if="item.fetchPending" class="fetch-in-progress" indeterminate color="white"></v-progress-circular>
        </div>
        <span v-if="index < (content.length - 1)" class="filter-divider color-black">/</span>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="selectedTab" class="mt-2 home-tabs">
      <v-tab-item v-for="(item, index) in getContent()" :key="item.key">
        <div class="home-content" :id="`myAux${index}`" v-if="item.data.length">
          <div v-if="item.trackList">
            <PlayAllAndShuffle v-if="!item.fetchPending" :tracks="item.data" :collectionKey="item.key"/>
            <TrackList :tracks="item.data" :tracksFromDifferentAlbums="true" :hideAlbums="true"/>
          </div>
          
          <ContentCarousel v-if="item.likedAlbums" :data="item.data" :vertical="true"/>

          <div v-if="item.topItems">
            <PlayAllAndShuffle v-if="!item.fetchPending" :tracks="item.topItems.tracks" :collectionKey="item.key"/>
            <TrackList :tracks="item.topItems.tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true"/>

            <ContentCarousel :data="item.topItems.artists" :vertical="true" class="mt-15"/>
          </div>
        </div>
        
        <BackToTop :elementId="`myAux${index}`"/>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
  import {Component, Vue, Mutation} from 'nuxt-property-decorator';
  import {httpClient, handleApiError} from '~/utils/api';
  import {setItemMetaData, msToDuration} from '~/utils/helpers';
  import {MY_AUX, LIKED_ITEM_EVENT, REMOVED_LIKED_ITEM_EVENT} from '~/utils/constants';
  import {USER} from '~/store/constants';
  import {v4 as uuid} from 'uuid';

  @Component
  export default class MyAux extends Vue {
    dataFetch;
    selectedTab = 0;

    defaultContent = {
      data: [],
      total: 0,
      offset: 0
    };

    content = [
      //apparently API doesn't return total for this
      {
        data: [],
        key: 'recentlyPlayed',
        label: MY_AUX.RECENTLY_PLAYED,
        trackList: true,
        id: uuid()
      },
      {
        ...this.defaultContent,
        key: 'likedTracks',
        label: MY_AUX.LIKED_TRACKS,
        trackList: true,
        api: 'tracks',
        type: 'track',
        id: uuid()
      },
      {
        ...this.defaultContent,
        key: 'likedAlbums',
        label: MY_AUX.LIKED_ALBUMS,
        likedAlbums: true,
        api: 'albums',
        type: 'album',
        id: uuid()
      }
    ];

    //TODO: find better place for this?
    @Mutation('setProfile', {namespace: USER})
    setProfile;

    mapData(data){
      return data.map(item => {
        return {
          ...setItemMetaData([item.track || item.album])[0],
          hideAlbum: true,
          duration: item.track ? msToDuration(item.track.duration_ms) : 0
        }
      });
    };

    async beforeMount(){
      this.dataFetch = httpClient.get('/myAux');
      const { data } = await this.dataFetch;
      this.setProfile(data.profile);
      const topItems = setItemMetaData(data.topItems);

      this.content.forEach(item => {
        item.data = this.mapData(data[item.key].items);
        item.total = data[item.key].total;
        //lazy loading/pagination
        item.limit = item.offset = data[item.key].limit;
      });

      //data structure for top items response is different than the others, so no mapping needed
      this.content = [...this.content, {
        key: 'topItems',
        label: MY_AUX.TOP_ITEMS,
        data: topItems,
        id: uuid(),
        topItems: {
          tracks: topItems.filter(item => item.isTrack || item.singleTrack),
          artists: topItems.filter(item => item.isArtist)
        }
      }];

      this.$nuxt.$root.$on(REMOVED_LIKED_ITEM_EVENT, item => this.handleItemLikeStatus(item, true));
      this.$nuxt.$root.$on(LIKED_ITEM_EVENT, this.handleItemLikeStatus);
    }

    //proactive fetch of liked tracks in the background
    async mounted(){
      await this.dataFetch;
      await this.fetchRemainingData(this.content[0].key);

      this.$forceUpdate();
    }

    handleItemLikeStatus(item, removal){
      const contentWithItemType = this.content.find(content => {
        let contentAndItemTypeIsTrack = false;

        if(content.type == 'track'){
          contentAndItemTypeIsTrack = item.type == 'track' || (item.type == 'album' && item.total_tracks == 1);
        }

        return contentAndItemTypeIsTrack || content.type == item.type;
      });

      if(contentWithItemType && contentWithItemType.data){
        const { data } = contentWithItemType;

        if(removal){
          const itemIndex = data.findIndex(like => like.uuid == item.uuid);
          data.splice(itemIndex, 1);
        }
        else{
          data.unshift(item);
        }
      }
    }

    async fetchRemainingData(key){
      const contentToFetchFor = key ? this.content.find(content => content.key = key) : this.content[this.selectedTab];

      while(contentToFetchFor.api && contentToFetchFor.offset < contentToFetchFor.total){
        if(!contentToFetchFor.fetchPending){
          contentToFetchFor.fetchPending = true;

          try{
            const { data } = await httpClient.post('/passthru', {
              url: `/me/${contentToFetchFor.api}?limit=${contentToFetchFor.limit}&offset=${contentToFetchFor.offset}`
            });

            contentToFetchFor.data = [...contentToFetchFor.data, ...this.mapData(data.items)];
            contentToFetchFor.offset += data.items.length;
            contentToFetchFor.fetchPending = false;
          }
          catch(error){
            handleApiError(error);
            break;
          }
        }
      }
    }

    async tabChanged(){
      await this.$nextTick();
      await this.fetchRemainingData();
    }

    getContent(){
      return this.content.filter(content => content.data.length);
    }
  }
</script>

<style lang="scss">
  @import '~/styles/variables.scss';

  .tab-container {
    padding-left: $home-content-padding;
    max-width: calc(100vw - #{$home-content-padding});

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