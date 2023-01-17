<template>
    <section>
      <!-- TRACK -->
      <v-icon 
        class="clickable" 
        :color="itemIsPlaying ? '#1DB954' : 'black'" 
        :class="[iconClass]" 
        v-if="!item.isArtist && !collectionPlaying()" 
        @click.stop="togglePlay(item)"
        :aria-label="`${item.playbackIcon} item`"
      >
        {{`mdi-${item.playbackIcon}`}}
      </v-icon>

      <!-- COLLECTION -->
      <v-icon
        class="clickable collection-playback" 
        :class="[iconClass]" 
        v-if="collectionPlaying()" 
        @click.stop="stopPlayback(true)"
        aria-label="stop playback"
      >
        mdi-stop-circle
      </v-icon>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter, Watch, Mutation} from 'nuxt-property-decorator';
  import {SPOTIFY} from '~/store/constants';
  import {isSameTrack, setDuration} from '~/utils/helpers';

  @Component
  export default class PlaybackIcon extends Vue {
    itemIsPlaying = false;

    @Prop({default: {}, required: true})
    item;

    @Prop({default: () => []})
    itemSet;

    @Prop()
    iconClass;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('stopPlayback', {namespace: SPOTIFY})
    stopPlayback;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('currentlyPlayingItemUri', {namespace: SPOTIFY})
    currentlyPlayingItemUri;

    @Getter('audioPlaying', {namespace: SPOTIFY})
    audioPlaying;

    @Mutation('setItemPlaybackIcon', {namespace: SPOTIFY})
    setItemPlaybackIcon;
    
    @Watch('audioPlaying')   
    @Watch('currentlyPlayingItemUri')
    async playbackChanged(){
      await setDuration(this.item);
      this.updateThisItem();

      //keep all playback icons up to date
      this.$forceUpdate();
    }

    beforeMount(){
      this.updateThisItem();
    }
      
    async togglePlay(item){
      await this.togglePlayback({item, itemSet: this.itemSet});
      this.$forceUpdate();
    }

    updateThisItem(){
      //if playing track and then loading its album detail for e.g., make sure corresponding track has correct icon in track list;
      //can't rely on item uri as individual track and its counterpart on album have different uris
      this.itemIsPlaying = isSameTrack(this.item, this.currentlyPlayingItem);

      const icon = (this.audioPlaying && this.itemIsPlaying) ? 'pause' : 'play';

      if(icon !== this.item.playbackIcon){
        this.setItemPlaybackIcon({item: this.item, icon});
      }
    }

    collectionPlaying(){
      //TODO: fix play from elsewhee (e.g. artist top tracks) then load album -- item.fromCollection not set so wrong icon on collection
      //still happens? ^^^

      return (this.item.isCollection && this.currentlyPlayingItem.fromCollection && this.currentlyPlayingItem.fromCollection.includes(this.item.uri));
    }
  }
</script>

<style lang="scss">
  .collection-playback {
    color: #1DB954 !important;
  }
</style>