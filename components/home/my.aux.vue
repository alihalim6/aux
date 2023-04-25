<template>
  <section class="pt-1 pb-12">
    <div class="content-container mt-4">
      <div class="home-content-title">
        <v-img @click="spotifyLogoPressed()" class="clickable spotify-full" src="/Spotify_Logo_Full.png"></v-img>
        <span>My Vibe</span>
      </div>

      <v-tabs class="tab-container home-content-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
        <v-tab v-for="(tab, index) in getContent()" :key="tab.key" :disabled="getContent()[selectedTab].fetchPending" @change="tabChanged">
          <v-hover v-slot="{hover}">
            <div class="tab-label" :class="{'selected-tab': selectedTab === index, 'hover-tab': hover}">
              <span :id="`myAuxTabLabel${index}`">{{tab.label}}</span>
            </div>
          </v-hover>

          <span v-if="index < (content.length - 1)" class="tab-divider color-black">/</span>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedTab" class="mt-2 home-tabs">
        <v-tab-item v-for="(tab, index) in getContent()" :key="tab.key">
          <div class="home-content-with-shadow" :id="`myAux${index}`" v-if="tab.data.length">
            <div v-if="tab.trackList">
              <v-progress-circular v-if="tab.fetchPending" class="fetch-in-progress" width="2" indeterminate large color="black"></v-progress-circular>
              <PlayAllAndShuffle v-else :tracks="tab.data" :collectionKey="tab.key" :my-aux-liked-tracks="tab.key == 'likedTracks'"/>

              <TrackList :tracks="tab.data" :tracksFromDifferentAlbums="true" :hideAlbums="true" :disable-tracks="tab.fetchPending"/>
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
    </div>
  </section>
</template>

<script>
  import {Component, Vue, Mutation, Action} from 'nuxt-property-decorator';
  import {handleApiError} from '~/api/_utils';
  import myAux from '~/api/myAux';
  import spotify from '~/api/spotify';
  import {setItemMetaData, msToDuration, handleItemCollection, shuffleArray} from '~/utils/helpers';
  import {MY_AUX, LIKED_ITEM_EVENT, REMOVED_LIKED_ITEM_EVENT} from '~/utils/constants';
  import {SPOTIFY, USER} from '~/store/constants';
  import {v4 as uuid} from 'uuid';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class MyAux extends Vue {
    selectedTab = 0;
    preShuffledLikes = [];

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
      },
      //apparently API doesn't return total for this TODO recheck
      {
        data: [],
        key: 'recentlyPlayed',
        label: MY_AUX.RECENTLY_PLAYED,
        trackList: true,
        id: uuid(),
        footnote: '*On Spotify'
      }
    ];

    //TODO: find better place for this?
    @Mutation('setProfile', {namespace: USER})
    setProfile;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

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
      try {
        const data = await myAux();

        if(data.profile.product != 'premium'){
          this.$nuxt.error({customMessage: 'Unfortuantely, AUX can only support Spotify Premium users at this time. Sorry about that!', notPremium: true, actionButtonLabel: 'GO BACK TO SPOTIFY LOGIN'});
        }
        
        this.setProfile(data.profile);
        const topItems = setItemMetaData(data.topItems);

        this.content.forEach(item => {
          let items = data[item.key].items;

          if(item.trackList){
            items = items.filter(item => item.track);
          }

          item.data = this.mapData(items);
          item.total = data[item.key].total;
          //lazy loading/pagination
          item.limit = item.offset = data[item.key].limit;
        });

        await this.fetchRemainingData();

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

        //can't use same logic for up next likes because up next tracks can always change and using a pre-shuffled array would overwrite tracks added/removed etc.;
        this.$nuxt.$on('playPreShuffledLikes', async playbackItem => {
          console.log('playing preshuffled tracks');
          await this.togglePlayback({item: playbackItem, itemSet: this.preShuffledLikes});
          //set a new shuffle for next time
          this.preShuffledLikes = shuffleArray(this.preShuffledLikes);
        });
      }
      catch(error){
        console.error(error);
      }
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

    //confirmed works for albums
    async fetchRemainingData(){
      const contentToFetchFor = this.content[this.selectedTab];

      while(contentToFetchFor.api && contentToFetchFor.offset < contentToFetchFor.total){
        if(!contentToFetchFor.fetchPending){
          contentToFetchFor.fetchPending = true;

          try{
            const data = await spotify({
              url: `/me/${contentToFetchFor.api}?limit=${contentToFetchFor.limit}&offset=${contentToFetchFor.offset}`
            });

            if(contentToFetchFor.trackList){
              data.items = data.items.filter(item => item.track);
            }

            contentToFetchFor.data = [...contentToFetchFor.data, ...this.mapData(data.items)];
            contentToFetchFor.offset += data.items.length;

            //pre-shuffle likes after they're all fetched to try and help with performance when shuffle clicked;
            //this of course blocks the pending overlay to clear until shuffling is done but we're taking our chances that user 
            //won't be waiting for that to clear then immediately click shuffle; instead, more likely is that by the time user gets down to
            //likes, the fetching and pre-shuffling will be done already
            if(contentToFetchFor.trackList && contentToFetchFor.offset == contentToFetchFor.total){
              this.preShuffledLikes = shuffleArray([...contentToFetchFor.data]);
            }

            contentToFetchFor.fetchPending = false;
          }
          catch(error){
            handleApiError('There was an issue loading your all of your Liked Songs lorem ipsum...');
            contentToFetchFor.fetchPending = false;
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

    spotifyLogoPressed(){
      window.open('https://open.spotify.com/collection/tracks', '_blank');
    }

    beforeDestroy(){
      this.$nuxt.$root.$off(REMOVED_LIKED_ITEM_EVENT);
      this.$nuxt.$root.$off(LIKED_ITEM_EVENT);
    }
  }
</script>

<style lang="scss">
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