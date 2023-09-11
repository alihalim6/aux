<template>
  <section class="pt-1 pb-12 my-aux">
    <div class="content-container mt-10">
      <div class="home-content-title">
        <h1 
          v-if="profile" 
          aria-label="your liked tracks and albums, recently played tracks and your top Spotify tracks and artists" 
          role="heading"
          class="logo-style width-fit my-aux-header py-1"
        >
          {{profile.name}}
        </h1>
      </div>

      <v-tabs class="tab-container home-content-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
        <v-tab v-for="(tab, index) in getContent()" :key="tab.key" @change="tabChanged">
          <v-hover v-slot="{hover}">
            <div class="tab-label" :class="{'selected-tab': selectedTab === index, 'hover-tab': hover}">
              <span :id="`myAuxTabLabel${index}`">{{tab.label}}</span>
            </div>
          </v-hover>

          <v-icon v-if="index < (content.length - 1)" class="tab-divider color-dark-blue">mdi-circle</v-icon>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedTab" class="mt-2 home-tabs">
        <v-tab-item v-for="(tab, index) in getContent()" :key="tab.key">
          <div class="home-content-with-shadow" :id="`myAux${index}`" v-if="tab.data.length">
            <div v-if="tab.trackList">
              <PlayAllAndShuffle 
                :tracks="tab.data" 
                :collectionKey="tab.key" 
                :my-aux-liked-tracks="tab.key == 'likedTracks'" 
                :disable-shuffle="tab.key == 'likedTracks' && !likesPreShuffleReady"
              />
              <TrackList :tracks="tab.data" :tracksFromDifferentAlbums="true" :hideAlbums="true" :my-aux="true"/>
            </div>
            
            <ContentCarousel v-if="tab.likedAlbums" :data="tab.data" :vertical="true"/>

            <div v-if="tab.topItems">
              <PlayAllAndShuffle :tracks="tab.topItems.tracks" :collectionKey="tab.key"/>
              <TrackList :tracks="tab.topItems.tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true" :my-aux="true"/>

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
  import {Component, Vue, Mutation, Action, Getter, Watch} from 'nuxt-property-decorator';
  import {handleApiError} from '~/api/_utils';
  import myAux from '~/api/myAux';
  import spotify from '~/api/spotify';
  import {setItemMetaData, msToDuration, handleItemCollection, shuffleArray, getMoreTracksForQueue} from '~/utils/helpers';
  import {MY_AUX, LIKED_ITEM_EVENT, REMOVED_LIKED_ITEM_EVENT} from '~/utils/constants';
  import {SPOTIFY, USER, PLAYBACK_QUEUE} from '~/store/constants';
  import {v4 as uuid} from 'uuid';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class MyAux extends Vue {
    selectedTab = 0;
    preShuffledLikes = [];
    addTracksToEndOfQueue = false
    likesPreShuffleReady = false;

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
        likedTracks: true,
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
      {
        data: [],
        key: 'recentlyPlayed',
        label: MY_AUX.RECENTLY_PLAYED,
        trackList: true,
        id: uuid()
      }
    ];

    @Mutation('setProfile', {namespace: USER})
    setProfile;

    @Mutation('addToRestOfQueue', {namespace: PLAYBACK_QUEUE})
    addToRestOfQueue;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('currentlyPlayingCollection', {namespace: SPOTIFY})
    currentlyPlayingCollection;

    @Getter('isShuffled', {namespace: SPOTIFY})
    isShuffled;

    @Getter('queue', {namespace: PLAYBACK_QUEUE})
    queue;

    @Getter('restOfQueueLength', {namespace: PLAYBACK_QUEUE})
    restOfQueueLength;

    @Watch('currentlyPlayingCollection')
    handleRestOfQueueFlag(newVal){
      this.addTracksToEndOfQueue = newVal == 'likedTracks' && !this.isShuffled;
    }

    mapData(data, fromCollection){
      return data.map(item => {
        const mappedItem = {
          ...setItemMetaData([item.track || item.album])[0],
          hideAlbum: true,
          duration: item.track ? msToDuration(item.track.duration_ms) : 0
        };

        handleItemCollection(mappedItem, fromCollection);
        return mappedItem;
      });
    };

    async beforeMount(){
      try {
        //can't use same logic for up next likes because up next tracks can always change and using a pre-shuffled array would overwrite tracks added/removed etc.;
        this.$nuxt.$on('playPreShuffledLikes', async function(playbackItem){
          await this.togglePlayback({item: playbackItem, itemSet: this.preShuffledLikes, shuffle: true});
        
          //set a new shuffle for next time
          
          //console.log('playing preshuffled tracks and shuffling some for next time...');
          const likedTracks = this.content.find(item => item.likedTracks);

          if(likedTracks.offset < likedTracks.total){
            //console.log('likes not done loading...setting more random tracks');
            this.preShuffledLikes = [];
            this.getRandomLikes(likedTracks);
          }
          else{
            //console.log('likes done loading...shuffling existing tracks');
            shuffleArray(this.preShuffledLikes);
          }
        }.bind(this));

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

          item.data = this.mapData(items, item.key);
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

        await this.fetchRemainingData();

        this.$nuxt.$root.$on(REMOVED_LIKED_ITEM_EVENT, item => this.handleItemLikeStatus(item, true));
        this.$nuxt.$root.$on(LIKED_ITEM_EVENT, this.handleItemLikeStatus);
      }
      catch(error){
        //console.error(error);
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
          const itemIndex = data.findIndex(like => like.uri == item.uri);
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
      const moreDataToFetch = () => contentToFetchFor.api && contentToFetchFor.offset < contentToFetchFor.total;

      if(moreDataToFetch()){
        this.getRandomLikes(contentToFetchFor);
      }

      while(moreDataToFetch()){
        try{
          const response = await spotify({
            url: `/me/${contentToFetchFor.api}?limit=${contentToFetchFor.limit}&offset=${contentToFetchFor.offset}`
          });
          
          let items = response.items;

          if(contentToFetchFor.trackList){
            items = items.filter(item => item.track && item.track.id);
          }

          contentToFetchFor.data.push.apply(contentToFetchFor.data, this.mapData(items, contentToFetchFor.key));
          contentToFetchFor.offset += contentToFetchFor.limit;

          if(contentToFetchFor.offset >= contentToFetchFor.total && contentToFetchFor.trackList){
            if(this.addTracksToEndOfQueue){
              this.addToRestOfQueue(contentToFetchFor.data.slice(this.queue.length + this.restOfQueueLength));
            }

            this.preShuffledLikes = shuffleArray([...contentToFetchFor.data]);

            //send some data for new and reco refresh seeding
            this.$nuxt.$root.$emit('likedTracksAndAlbums', {
              tracks: contentToFetchFor.data.map(item => ({track: item})), 
              albums: this.content.find(item => item.likedAlbums).data.map(item => ({album: {tracks: item.tracks}}))
            });
          }
        }
        catch(error){
          handleApiError('Sorry, there was an issue loading your Likes.');
          break;
        }
      }
      
      this.likesPreShuffleReady = true;
    }

    async tabChanged(){
      await this.$nextTick();
      this.fetchRemainingData();
    }

    getContent(){
      return this.content.filter(content => content.data.length);
    }

    getRandomLikes(contentToFetchFor){
      getMoreTracksForQueue({totalTracks: contentToFetchFor.total, url: '/me', itemOffset: contentToFetchFor.offset}).then(({tracks}) => {
        if(!this.preShuffledLikes.length){
          this.preShuffledLikes = tracks;
          this.likesPreShuffleReady = true;
        }
      });
    }

    beforeDestroy(){
      this.$nuxt.$root.$off(REMOVED_LIKED_ITEM_EVENT);
      this.$nuxt.$root.$off(LIKED_ITEM_EVENT);
    }
  }
</script>

<style lang="scss">
  .v-tab {
    padding: 0px !important;
  }

  .v-slide-group__prev {
    display: none !important;
  }

  .v-tab--active::before {
    opacity: 0 !important;
  }
  
  .color-dark-blue {
    color: $dark-blue !important;
  }

  .my-aux-header {
    background-color: $rose-red;
    font-size: 32px;
    margin-bottom: 0;
    margin-top: 16px;
  }
</style>