<template>
  <v-menu left :transition="detailOverlay || threeDotItem.isArtist ? 'slide-x-reverse-transition' : 'slide-x-transition'" z-index="2000" :nudge-left="threeDotItem.isArtist ? 100 : 20" :value="!hide">
    <template v-slot:activator="{on, attrs}">
      <v-icon v-bind="attrs" v-on="on" @click.stop="onPress()" class="clickable three-dots" :color="iconColor || 'black'" :class="[iconClass]" tabindex="0" :aria-label="`three-dot menu for ${threeDotItem.primaryLabel}`">mdi-dots-vertical</v-icon>
    </template>

    <v-list>
      <v-list-item v-for="(option, index) in options.filter(option => !option.hidden)" 
        :key="index" 
        class="clickable menu-option-container" 
        @click="option.fn(item)" 
        :disabled="option.forQueue && disableQueueOptions"
      >
        <span class="option-title">{{option.title}}</span>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
  import {Component, Vue, Prop, Getter, Mutation, Action, Watch} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY, UI} from '~/store/constants';
  import spotify from '~/api/spotify';
  import {REMOVED_FROM_LIKES, ADDED_TO_LIKES, REMOVED_LIKED_ITEM_EVENT, LIKED_ITEM_EVENT, UNFOLLOWED, NOW_FOLLOWING} from '~/utils/constants';
  import details from '~/api/details';
  import {processAlbum} from '~/utils/helpers';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class ThreeDotIcon extends Vue {
    //using .type instead of is<Album, etc.> and .uri instead of .uuid because items with this component are not always Aux-ified yet

    hide = true;
    disableQueueOptions = true;
    options = [];
    threeDotItem;

    defaultOptions = [
      {
        title: 'Play Now',
        fn: this.playTrackNow,
        playNow: true
      },
      {
        title: 'Play Next',
        fn: this.playNextPressed,
        forQueue: true
      },
      {
        title: 'Add to End of Queue',
        fn: this.addToEndPressed,
        addToEnd: true,
        forQueue: true
      }
    ];

    @Prop({default: {}, required: true})
    item;

    @Prop()
    iconClass;

    @Prop()
    itemInQueue;

    @Prop()
    detailOverlay;

    @Prop()
    iconColor;

    @Getter('nextTrack', {namespace: PLAYBACK_QUEUE})
    nextTrack;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Action('addToEndOfQueue', {namespace: PLAYBACK_QUEUE})
    addToEndOfQueue;

    @Action('setTracksToPlayNext', {namespace: PLAYBACK_QUEUE})
    setTracksToPlayNext;

    @Action('removeFromQueue', {namespace: PLAYBACK_QUEUE})
    removeFromQueue;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('openItemInSpotify', {namespace: SPOTIFY})
    openItemInSpotify;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;

    @Watch('item')
    itemChanged(newVal, oldVal){
      if(newVal.uuid != oldVal.uuid){
        this.threeDotItem = newVal;
      }
    }

    async beforeMount(){
      this.threeDotItem = this.item;

      this.$nuxt.$root.$on('hideThreeDotMenu', () => {
        if(!this.hide){
          this.hide = true;
        }
      });
    }

    async onPress(){
      this.hide = false;
      
      if(this.threeDotItem.isArtist){
        this.options = [];
      }
      else{
        this.options = [...this.defaultOptions];
        
        if(this.threeDotItem.isMultitrackAlbum){
          this.threeDotItem = await this.processAlbumDetails(this.threeDotItem);
        }
      }

      this.disableQueueOptions = !this.currentlyPlayingItem.uri || this.currentlyPlayingItem.uri === this.threeDotItem.uri;

      //for items already in queue, remove the option to add to end, and append option to remove from queue
      if(this.itemInQueue){
        const addToEndIndex = this.options.findIndex(option => option.addToEnd);
        
        this.options.splice(addToEndIndex, 1, {
          title: 'Remove from Queue',
          fn: this.removeFromQueue
        });
      }
      else if(this.threeDotItem.isCollection){
        const playNowIndex = this.options.findIndex(option => option.playNow);

        this.options.splice(playNowIndex, 1, {
          title: 'Shuffle \'n\' Play',
          fn: async () => {
            await this.togglePlayback({item: this.threeDotItem, shuffle: true});
          }
        });
      }
            
      try {
        let apiParams = {};

        if(this.threeDotItem.type != 'playlist'){//TOOD api does not seem to honor likes (https://github.com/spotify/web-api/issues/1251), so hide option for playlists
          const apiAndToast = async (text) => {
            await spotify(apiParams);
            this.setToast({text});
          };

          if(this.threeDotItem.isArtist){
            const data = await spotify({url: `/me/following/contains?ids=${this.threeDotItem.id}&type=artist`});
            const followingArtist = data[0];
            apiParams = {url: `/me/following?ids=${this.threeDotItem.id}&type=artist`, method: followingArtist ? 'DELETE' : 'PUT'};

            this.options.push(followingArtist ? {
              title: 'Unfollow Artist',
                fn: async () => {
                  await apiAndToast(`${UNFOLLOWED} ${this.threeDotItem.name} on Spotify`);
                }
              } :  
              {
                title: 'Follow Artist',
                fn: async () => {
                  await apiAndToast(`${NOW_FOLLOWING} ${this.threeDotItem.name} on Spotify!`);
                }
              }
            );
          }
          else{ 
            const likeType = this.threeDotItem.type == 'album' ? 'albums' : 'tracks';
            const modifyLikeUrl = `/me/${likeType}?ids=${this.threeDotItem.id}`;
            const data = await spotify({url: `/me/${likeType}/contains?ids=${this.threeDotItem.id}`});
            const alreadyLiked = data[0];

            apiParams = {url: modifyLikeUrl, method: alreadyLiked ? 'DELETE' : 'PUT'};

            this.options.push(alreadyLiked ? {
              title: 'Remove from Likes',
                fn: async () => {
                  await apiAndToast(REMOVED_FROM_LIKES);
                  this.$nuxt.$root.$emit(REMOVED_LIKED_ITEM_EVENT, this.threeDotItem);
                }
              } :  
              {
                title: 'Like',
                fn: async () => {
                  await apiAndToast(ADDED_TO_LIKES);
                  this.$nuxt.$root.$emit(LIKED_ITEM_EVENT, this.threeDotItem);
                }
              }
            );

            if(!this.detailOverlay && this.threeDotItem.isMultitrackAlbum){
              this.options.unshift({
                title: 'Play',
                fn: () => {
                  this.togglePlayback({item: this.threeDotItem});
                }
              });
            }

            if(this.threeDotItem.type == 'track') {
              this.options.push({
                title: 'Add to Playlist...',
                fn: () => {
                  this.closeFeed();
                  this.$nuxt.$root.$emit('addToPlaylist', this.threeDotItem);
                }
              });

              if(this.threeDotItem.playlistId){
                this.options.push({
                  title: 'Remove from Playlist',
                  fn: () => {
                    this.$nuxt.$root.$emit('trackRemovedFromPlaylist', {track: this.threeDotItem, playlistId: this.threeDotItem.playlistId});
                  }
                });
              }
            }
          }
        }

        this.options.push({
          title: `${this.threeDotItem.type == 'artist' ? 'Open' : 'Listen on'} Spotify`,
          fn: () => this.openItemInSpotify(this.threeDotItem)
        });
      }
      catch(error){
        console.log(error)
        this.setToast({text: 'Something went wrong lorem ipsum...', error: true});//could happen on load of three dot options not necessarily an action so keep generic
      }
    }

    async processAlbumDetails(album){
      const processedAlbum = cloneDeep(album);
      processedAlbum.details = await details(processedAlbum, processedAlbum.id);
      await processAlbum(processedAlbum);

      return processedAlbum;
    }

    getTracksToPlayNext(){
      let tracksToPlayNext = [this.threeDotItem];

      if(this.threeDotItem.isCollection){
        tracksToPlayNext = this.threeDotItem.isPlaylist ? this.threeDotItem.details.playlistTracks : this.threeDotItem.details.albumTracks;
      }

      return tracksToPlayNext;
    }

    playNextPressed(){
      const nextTrackUri = this.nextTrack ? this.nextTrack.uri : '';
      let itemSet;
      let nextCollectionTrackUri;

      if(nextTrackUri && this.threeDotItem.isCollection){
        itemSet = this.threeDotItem.isPlaylist ? this.threeDotItem.details.playlistTracks : this.threeDotItem.details.albumTracks;
        nextCollectionTrackUri = itemSet[0].uri;
      }

      //if already next, ignore
      if(nextTrackUri == this.threeDotItem.uri || nextTrackUri == nextCollectionTrackUri){
        return;
      }

      //for item already in queue, move it from where it is to next in line
      if(this.itemInQueue){
        this.removeFromQueue(this.threeDotItem);
      }

      this.setTracksToPlayNext({tracks: this.getTracksToPlayNext()});
    }

    addToEndPressed(){
      this.addToEndOfQueue(this.getTracksToPlayNext());
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('hideThreeDotMenu');
    }
  }
</script>

<style lang="scss">
  .three-dots {
    font-size: 19px !important;
    padding-top: 4px;
    padding-left: 4px;
  }

  .three-dots:focus-visible {
    @extend .focused;
  }
</style>