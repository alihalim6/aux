<template>
  <v-menu bottom left :transition="detailOverlay ? 'slide-x-reverse-transition' : 'slide-x-transition'" z-index="2000" :nudge-left="item.isArtist && detailOverlay ? 100 : 20" :value="!hide">
    <template v-slot:activator="{on, attrs}">
      <v-icon v-bind="attrs" v-on="on" @click.stop="onPress()" class="clickable three-dots" :color="iconColor || 'black'" :class="[iconClass]">mdi-dots-vertical</v-icon>
    </template>

    <v-list>
      <v-list-item v-for="option in options.filter(option => !option.hidden)" 
        :key="option.title" 
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
  import {Component, Vue, Prop, Getter, Mutation, Action} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY, UI, USER} from '~/store/constants';
  import spotify from '~/api/spotify';
  import {REMOVED_FROM_LIKES, ADDED_TO_LIKES, REMOVED_LIKED_ITEM_EVENT, LIKED_ITEM_EVENT, UNFOLLOWED, NOW_FOLLOWING} from '~/utils/constants';

  @Component
  export default class ThreeDotIcon extends Vue {
    //using .type instead of is<Album, etc.> and .uri instead of .uuid because items with this component are not always Aux-ified yet

    hide = true;
    disableQueueOptions = true;
    options = [];

    defaultOptions = [
      {
        title: 'Play Next',
        fn: this.playNextPressed,
        playNext: true,
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

    @Getter('profile', {namespace: USER})
    profile;

    @Mutation('removeFromQueue', {namespace: PLAYBACK_QUEUE})
    removeFromQueue;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Action('addToEndOfQueue', {namespace: PLAYBACK_QUEUE})
    addToEndOfQueue;

    @Action('setTracksToPlayNext', {namespace: PLAYBACK_QUEUE})
    setTracksToPlayNext;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    async beforeMount(){
      this.$nuxt.$root.$on('hideThreeDotMenu', () => {
        if(!this.hide){
          this.hide = true;
        }
      });
    }

    async onPress(){
      this.hide = false;
      
      if(this.item.isArtist){
        this.options = [];
      }
      else{
        this.options = [...this.defaultOptions];
      }

      this.disableQueueOptions = !this.currentlyPlayingItem.uri || this.currentlyPlayingItem.uri === this.item.uri;

      //for items already in queue, remove the option to add to end, and append option to remove from queue
      if(this.itemInQueue){
        const addToEndIndex = this.options.findIndex(option => option.addToEnd);
        
        this.options.splice(addToEndIndex, 1, {
          title: 'Remove from Queue',
          fn: this.removeFromQueue
        });
      }
      else if(this.item.isCollection){
        const playNextIndex = this.options.findIndex(option => option.playNext);

        this.options.splice(playNextIndex, 0, {
          title: 'Shuffle \'n\' Play',
          fn: async () => {
            await this.togglePlayback({item: this.item, shuffle: true});
          }
        });
      }
            
      try {
        let apiParams = {};

        if(this.item.type != 'playlist'){//TOOD api does not seem to honor likes (https://github.com/spotify/web-api/issues/1251), so hide option for playlists
          const apiAndToast = async (text) => {
            await spotify(apiParams);
            this.setToast({text});
          };

          if(this.item.isArtist){
            const data = await spotify({url: `/me/following/contains?ids=${this.item.id}&type=artist`});
            const followingArtist = data[0];
            apiParams = {url: `/me/following?ids=${this.item.id}&type=artist`, method: followingArtist ? 'DELETE' : 'PUT'};

            this.options.push(followingArtist ? {
              title: 'Unfollow Artist',
                fn: async () => {
                  await apiAndToast(`${UNFOLLOWED} ${this.item.name} on Spotify`);
                }
              } :  
              {
                title: 'Follow Artist',
                fn: async () => {
                  await apiAndToast(`${NOW_FOLLOWING} ${this.item.name} on Spotify!`);
                }
              }
            );
          }
          else{    
            const likeType = this.item.type == 'album' ? 'albums' : 'tracks';
            const modifyLikeUrl = `/me/${likeType}?ids=${this.item.id}`;
            const data = await spotify({url: `/me/${likeType}/contains?ids=${this.item.id}`});
            const alreadyLiked = data[0];

            apiParams = {url: modifyLikeUrl, method: alreadyLiked ? 'DELETE' : 'PUT'};

            this.options.push(alreadyLiked ? {
              title: 'Remove from Likes',
                fn: async () => {
                  await apiAndToast(REMOVED_FROM_LIKES);
                  this.$nuxt.$root.$emit(REMOVED_LIKED_ITEM_EVENT, this.item);
                }
              } :  
              {
                title: 'Like',
                fn: async () => {
                  await apiAndToast(ADDED_TO_LIKES);
                  this.$nuxt.$root.$emit(LIKED_ITEM_EVENT, this.item);
                }
              }
            );
          }
        }
      }
      catch(error){
        console.log(error)
        this.setToast({text: 'Sorry that didn\'t quite go thru, please try again lorem ipsum...', error: true});
      }
    }

    getTracksToPlayNext(){
      let tracksToPlayNext = [this.item];

      if(this.item.isCollection){
        tracksToPlayNext = this.item.isPlaylist ? this.item.details.playlistTracks : this.item.details.albumTracks;
      }

      return tracksToPlayNext;
    }

    playNextPressed(){
      const nextTrackUri = this.nextTrack ? this.nextTrack.uri : '';
      let itemSet;
      let nextCollectionTrackUri;

      if(nextTrackUri && this.item.isCollection){
        itemSet = this.item.isPlaylist ? this.item.details.playlistTracks : this.item.details.albumTracks;
        nextCollectionTrackUri = itemSet[0].uri;
      }

      //if already next, ignore
      if(nextTrackUri == this.item.uri || nextTrackUri == nextCollectionTrackUri){
        return;
      }

      //for item already in queue, move it from where it is to next in line
      if(this.itemInQueue){
        this.removeFromQueue(this.item);
      }

      this.setTracksToPlayNext({tracks: this.getTracksToPlayNext()});
    }

    addToEndPressed(){
      this.addToEndOfQueue(this.getTracksToPlayNext());
    }
  }
</script>

<style lang="scss">
  .three-dots {
    font-size: 16px !important;
    padding-top: 4px;
    padding-left: 4px;
  }
</style>