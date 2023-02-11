<template>
  <section class="pt-1 pb-12">
    <div class="title-container mt-4">
      <div class="home-content-title">My Vibe</div>
    </div>

    <v-tabs class="tab-container home-content-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
      <v-tab v-for="(tab, index) in getContent()" :key="tab.key" :disabled="getContent()[selectedTab].fetchPending" @change="tabChanged">
        <div class="filter-label" :class="{'selected-tab': selectedTab === index}">
          <span :id="`myAuxTabLabel${index}`">{{tab.label}}</span>
        </div>
        <span v-if="index < (content.length - 1)" class="filter-divider color-black">/</span>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="selectedTab" class="mt-2 home-tabs">
      <v-tab-item v-for="(tab, index) in getContent()" :key="tab.key">
        <div class="home-content" :id="`myAux${index}`" v-if="tab.data.length">
          <div v-if="tab.trackList">
            <v-progress-circular v-if="tab.fetchPending" class="fetch-in-progress" width="2" indeterminate large color="black"></v-progress-circular>
            <PlayAllAndShuffle v-else :tracks="tab.data" :collectionKey="tab.key"/>

            <TrackList :tracks="tab.data" :tracksFromDifferentAlbums="true" :hideAlbums="true"/>
            <div class="my-aux-footnote">{{tab.footnote}}</div>
          </div>
          
          <ContentCarousel v-if="tab.likedAlbums" :data="tab.data" :vertical="true"/>

          <div v-if="tab.topItems">
            <PlayAllAndShuffle v-if="!tab.fetchPending" :tracks="tab.topItems.tracks" :collectionKey="tab.key"/>
            <TrackList :tracks="tab.topItems.tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true"/>

            <ContentCarousel :data="tab.topItems.artists" :vertical="true" class="mt-15" :no-secondary-label="true"/>
          </div>
        </div>
        
        <BackToTop :elementId="`myAux${index}`"/>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
  import {Component, Vue, Mutation} from 'nuxt-property-decorator';
  import {handleApiError} from '~/api/_utils';
  import myAux from '~/api/myAux';
  import spotify from '~/api/spotify';
  import {setItemMetaData, msToDuration, handleItemCollection} from '~/utils/helpers';
  import {MY_AUX, LIKED_ITEM_EVENT, REMOVED_LIKED_ITEM_EVENT} from '~/utils/constants';
  import {USER} from '~/store/constants';
  import {v4 as uuid} from 'uuid';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class MyAux extends Vue {
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
        id: uuid(),
        footnote: '*Recently played on Spotify'
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
      const data = await myAux();
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

    handleItemLikeStatus(item, removal){
      const contentWithItemType = this.content.find(content => {
        let contentAndItemTypeIsTrack = false;

        if(content.type == 'track'){
          contentAndItemTypeIsTrack = item.type == 'track' || (item.type == 'album' && item.total_tracks == 1);
        }

        return contentAndItemTypeIsTrack || content.type == item.type;
      });

      if(contentWithItemType && contentWithItemType.data){
        const {data} = contentWithItemType;

        if(removal){
          const itemIndex = data.findIndex(like => like.uuid == item.uuid);
          data.splice(itemIndex, 1);
        }
        else{
          //clone to handle bug where track in queue is liked and then Liked Tracks tab loaded for first time (track watcher ends up modifying item) 
          const newlyLikedItem = cloneDeep(item);
          handleItemCollection(newlyLikedItem, contentWithItemType.key);
          data.unshift(newlyLikedItem); 
        }
      }
    }

    async fetchRemainingData(){
      const contentToFetchFor = this.content[this.selectedTab];

      while(contentToFetchFor.api && contentToFetchFor.offset < contentToFetchFor.total){
        if(!contentToFetchFor.fetchPending){
          contentToFetchFor.fetchPending = true;

          try{
            const data = await spotify({
              url: `/me/${contentToFetchFor.api}?limit=${contentToFetchFor.limit}&offset=${contentToFetchFor.offset}`
            });

            contentToFetchFor.data = [...contentToFetchFor.data, ...this.mapData(data.items)];
            contentToFetchFor.offset += data.items.length;
            contentToFetchFor.fetchPending = false;
          }
          catch(error){
            handleApiError('There was an issue loading your all of your Liked Tracks lorem ipsum...');
            break;
          }
        }
      }
    }

    async tabChanged(){
      await this.$nextTick();
      this.fetchRemainingData();
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

    .selected-tab {
      background-color: $spotify-green;
      color: $secondary-theme-color;
      border: none;
      padding: 10px;
    }
  }

  .fetch-in-progress {
    width: 100% !important;
    margin: 16px auto;
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

  .my-aux-footnote {
    color: #888888;
    font-style: italic;
    font-size: 12px;
    margin-top: 36px;
  }
</style>