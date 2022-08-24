<template>
    <section>
      <v-icon 
        class="clickable" 
        :color="itemIsPlaying ? '#1DB954' : ''" 
        :class="[iconClass, conditionalIconClass]" 
        v-show="!item.isArtist && !collectionPlaying()" 
        @click="togglePlay(item)"
        :aria-label="`${item.playbackIcon} item`"
      >
        {{`mdi-${item.playbackIcon}-circle-outline`}}
      </v-icon>

      <v-icon
        class="clickable" 
        color= "#1DB954" 
        :class="[iconClass, conditionalIconClass]" 
        v-show="collectionPlaying()" 
        @click="stopPlayback(true)"
        aria-label="stop playback"
      >
        mdi-stop-circle
      </v-icon>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter, Watch, Mutation} from 'nuxt-property-decorator';
  import {SPOTIFY} from '~/store/constants';

  @Component
  export default class PlaybackIcon extends Vue {
    itemIsPlaying = false;

    @Prop({default: {}, required: true})
    item;

    @Prop({default: () => []})
    itemSet;

    @Prop({default: ''})
    iconClass;

    @Prop({default: () =>{}})
    conditionalIconClass;

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
    playbackChanged(){
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
      //if playing track and then loading its album for e.g., make sure corresponding track has correct icon in resulting view;
      //can't rely on item uri as individual track and its counterpart on album have different uris
      this.itemIsPlaying = (this.item.name == this.currentlyPlayingItem.name) && (this.item.duration == this.currentlyPlayingItem.duration) && (this.item.track_number == this.currentlyPlayingItem.track_number);

      const icon = (this.audioPlaying && this.itemIsPlaying) ? 'pause' : 'play';

      if(icon !== this.item.playbackIcon){
        this.setItemPlaybackIcon({item: this.item, icon});
      }
    }

    collectionPlaying(){
      //TODO: fix play from elsewhee (e.g. artist top tracks) then load album -- item.fromCollection not set so wrong icon on collection
      return (this.item.isCollection && this.currentlyPlayingItem.fromCollection === this.item.uri);
    }
  }
</script>