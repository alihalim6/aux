<template>
  <v-menu 
    left 
    :transition="'slide-x-reverse-transition'" 
    z-index="2000" 
    :offset-x="true"
    :offset-overflow="true"
    :nudge-left="threeDotItem.isArtist ? 80 : (currentlyPlayingItem.uri ? 0 : 20)"
    :nudge-bottom="bookmark ? -140 : 0"
    :value="!hide"
  >
    <template v-slot:activator="{on, attrs}">
      <v-icon v-bind="attrs" v-on="on" @click.stop="onPress()" class="clickable three-dots" :color="iconColor || 'black'" :class="[iconClass]" tabindex="0" :aria-label="`three-dot menu for ${threeDotItem.primaryLabel}`">mdi-dots-vertical</v-icon>
    </template>

    <v-list>
      <v-list-item v-for="(option, index) in options.filter(option => !option.hidden && !(option.forQueue && disableQueueOptions))" 
        :key="index" 
        class="clickable menu-option-container" 
        :class="{'aux-mode-added-by': option.addedBy}"
        @click="option.fn(item)" 
      >
        <div v-if="option.addedBy" class="d-flex flex-column py-2">
          <div class="aux-mode">AUX MODE</div>

          <div class="d-flex align-center">
            <v-img v-if="item.addedBy.img" :src="item.addedBy.img" class="round-img-icon" alt=""></v-img>            
            <span class="font-weight-regular mx-1">Added by </span><span>{{item.addedBy.name}}</span>
          </div>
        </div>
        
        <span v-else class="option-title">{{option.title}}</span>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
  import {Component, Vue, Prop, Getter, Mutation, Action, Watch} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY, UI, USER} from '~/store/constants';
  import spotify from '~/api/spotify';
  import {
    REMOVED_FROM_LIKES, 
    ADDED_TO_LIKES, 
    REMOVED_LIKED_ITEM_EVENT, 
    LIKED_ITEM_EVENT, 
    UNFOLLOWED, 
    NOW_FOLLOWING,
    AUTH
  } from '~/utils/constants';
  import details from '~/api/details';
  import {processAlbum, auxApiClient, isSameTrack} from '~/utils/helpers';
  import cloneDeep from 'lodash.clonedeep';
  import {storageGet} from '~/utils/storage';

  @Component
  export default class ThreeDotIcon extends Vue {
    //using .type instead of is<Album, etc.> and .uri instead of .uuid because items with this component are not always Aux-ified yet

    hide = true;
    disableQueueOptions = true;
    options = [];
    threeDotItem;

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

    @Prop()
    bookmark;

    @Getter('nextTrack', {namespace: PLAYBACK_QUEUE})
    nextTrack;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('profile', {namespace: USER})
    profile;

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
      if(this.threeDotItem.isArtist){
        this.options = [];
      }
      else{
        this.options = [
          {
            title: 'Play Now',
            fn: this.playTrackNow,
            playNow: true
          },
          {
            title: 'Play Next',
            fn: this.playNextPressed,
            forQueue: true,
            playNext: true
          },
          {
            title: 'Add to End of Queue',
            fn: this.addToEndPressed,
            addToEnd: true,
            forQueue: true
          }
        ];
        
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
            if(this.nextTrack && isSameTrack(this.nextTrack, this.threeDotItem)){
              const playNextIndex = this.options.findIndex(option => option.playNext);
              this.options.splice(playNextIndex, 1);
            }

            const likeType = this.threeDotItem.type == 'album' ? 'albums' : 'tracks';
            const modifyLikeUrl = `/me/${likeType}?ids=${this.threeDotItem.id}`;
            const data = await spotify({url: `/me/${likeType}/contains?ids=${this.threeDotItem.id}`});
            const alreadyLiked = data[0];

            apiParams = {url: modifyLikeUrl, method: alreadyLiked ? 'DELETE' : 'PUT'};

            this.options.push(alreadyLiked ? {
              title: 'Remove from Likes',
                fn: async () => {
                  await apiAndToast(`${this.threeDotItem.name} ${REMOVED_FROM_LIKES}`);
                  this.$nuxt.$root.$emit(REMOVED_LIKED_ITEM_EVENT, this.threeDotItem);
                }
              } :  
              {
                title: 'Like',
                fn: async () => {
                  await apiAndToast(`${this.threeDotItem.name} ${ADDED_TO_LIKES}`);
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

            this.options.push(this.bookmark ? {
              title: 'Remove from Bookmarks',
              fn: async () => {
                await auxApiClient.post('/user/removeBookmark', {userId: this.profile.id, bookmarkId: this.threeDotItem.id},
                {
                  headers: {
                    Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
                  }
                });

                this.$nuxt.$root.$emit('bookmarkRemoved', this.threeDotItem.uuid);
              }
            }
            : {
              title: 'Add to Bookmarks',
              fn: async () => {
                const bookmark = {id: this.threeDotItem.id, type: this.threeDotItem.type, userId: this.profile.id};

                await auxApiClient.post('/user/addBookmark', {bookmark},
                {
                  headers: {
                    Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
                  }
                });

                this.setToast({text: `${this.threeDotItem.name} was added to Bookmarks`});
                this.$nuxt.$root.$emit('bookmarkAdded', this.threeDotItem);
              }
            });
          }
        }
                
        this.options.push({
          title: `${this.threeDotItem.type == 'artist' ? 'Open' : 'Listen on'} Spotify`,
          fn: () => this.openItemInSpotify(this.threeDotItem)
        });

        if(this.itemInQueue && this.threeDotItem.addedBy){
          this.options.unshift({addedBy: true});
        }

        this.hide = false;
      }
      catch(error){
        console.log(error)
        this.setToast({text: 'Something went wrong!', error: true});//could happen on load of three dot options not necessarily an action so keep generic
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
  @import '~/components/styles';
  @import '~/styles/globals';

  .three-dots {
    font-size: 19px !important;
    padding-top: 4px;
    padding-left: 4px;
  }

  .three-dots:focus-visible {
    @extend .focused;
  }

  .aux-mode-added-by {
    background-color: $cream;
    font-weight: bold;
    font-size: 12px;
    pointer-events: none;
    cursor: auto;
  }

  .aux-mode {
    background-color: $spotify-green;
    color: white;
    padding: 2px 6px;
    margin: 4px 0px;
    font-size: 8px;
    width: max-content;
  }
</style>