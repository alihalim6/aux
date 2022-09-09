<template>
  <v-menu bottom left transition="slide-x-transition" z-index="2000" :value="!hide">
    <template v-slot:activator="{on, attrs}">
      <v-icon v-bind="attrs" v-on="on" @click.stop="onPress()" class="clickable three-dots" v-if="!item.isArtist" :class="[iconClass]">mdi-dots-vertical</v-icon>
    </template>

    <v-list>
      <v-list-item v-for="option in options.filter(option => !option.hidden)" 
        :key="option.title" 
        class="clickable option-container" 
        @click="option.fn(item)" 
        :disabled="option.forQueue && disableQueueOptions"
      >
        <v-icon :disabled="option.forQueue && disableQueueOptions" :color="option.color || 'black'">mdi-{{option.icon}}</v-icon>
        <span class="option-title">{{option.title}}</span>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
  import {Component, Vue, Prop, Getter, Mutation, Action} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY, UI, USER} from '~/store/constants';
  import {httpClient} from '~/utils/api';

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
        icon: 'skip-next-outline',
        forQueue: true
      },
      {
        title: 'Add to End of Queue',
        fn: this.addToEndPressed,
        icon: 'playlist-plus',
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

    async beforeMount(){
      this.$nuxt.$root.$on('hideThreeDotMenu', () => this.hide = true);
    }

    async onPress(){
      this.hide = false;
      this.options = [...this.defaultOptions];
      this.disableQueueOptions = !this.currentlyPlayingItem.uri || this.currentlyPlayingItem.uri === this.item.uri;

      //for items already in queue, remove the option to add to end, and append option to remove from queue
      if(this.itemInQueue){
        const addToEndIndex = this.options.findIndex(option => option.addToEnd);
        
        this.options.splice(addToEndIndex, 1, {
          title: 'Remove from Queue',
          fn: this.removeFromQueue,
          icon: 'playlist-remove'
        });
      }
      
      const likeType = this.item.type == 'album' ? 'albums' : 'tracks';
      const {data} = await httpClient.post('/passthru', {url: `/me/${likeType}/contains?ids=${this.item.id}`});
      const liked = data[0];
      const modifyLikeUrl = `/me/${likeType}?ids=${this.item.id}`;

      if(this.item.type != 'playlist'){//api does not seem to honor likes (https://github.com/spotify/web-api/issues/1251), so remove entire option for playlists
        this.options.push(liked ? {
          title: 'Remove from Likes',
            fn: async () => {
              await httpClient.post('/passthru', {url: modifyLikeUrl, method: 'DELETE'});
              this.$nuxt.$root.$emit('removedLikedItem', this.item);
              this.setToast({text: 'Removed from Likes', color: '#1DB954'});
            },
            icon: 'heart-remove-outline',
            color: 'red'
          } :  
          {
            title: 'Like',
            fn: async () => {
              await httpClient.post('/passthru', {url: modifyLikeUrl, method: 'PUT', data: {public: this.item.public || true}});//public param for playlists (api defaults to true)
              this.$nuxt.$root.$emit('likedItem', this.item);
              this.setToast({text: 'Added to Likes', color: '#1DB954'});
            },
            icon: 'heart',
            color: '#1DB954'
          }
        );
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
      //if already next, ignore
      if(this.nextTrack && this.nextTrack.uri == this.item.uri){
        return;
      }

      //for item already in queue, move it from where it is to next in line
      if(this.itemInQueue){
        this.removeFromQueue(this.item);
      }

      this.setTracksToPlayNext(this.getTracksToPlayNext());
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

  .option-container {
    display: flex;
    padding: 0px 12px !important;
    min-width: max-content;

    .option-title {
      font-size: 13px;
      font-weight: bold;
      padding: 8px;
    }
  }

  .option-container:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
</style>