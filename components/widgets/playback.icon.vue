<template>
    <v-icon class="clickable" :class="[iconClass, conditionalIconClass]" v-show="!item.isArtist" @click="togglePlay(item)">
      {{`mdi-${item.playbackIcon}-circle-outline`}}
  </v-icon>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter, Watch, Mutation} from 'nuxt-property-decorator';
  import {SPOTIFY} from '~/store/constants';

  @Component
  export default class PlaybackIcon extends Vue {
    @Prop({default: {}, required: true})
    item;

    @Prop({default: ''})
    iconClass;

    @Prop({default: () =>{}})
    conditionalIconClass;

    @Prop({default: ''})
    iconSize;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('currentlyPlayingItemUri', {namespace: SPOTIFY})
    currentlyPlayingItemUri;

    @Getter('audioPlaying', {namespace: SPOTIFY})
    audioPlaying;

    @Mutation('setItemPlaybackIcon', {namespace: SPOTIFY})
    setItemPlaybackIcon;

    @Watch('audioPlaying', {immediate: true})   
    @Watch('currentlyPlayingItemUri', {immediate: true})
    playbackChanged(){
      this.updateThisItem();

      //keep all playback icons up to date
      this.$forceUpdate();
    }
      
    togglePlay(item){
      this.togglePlayback(item);
      this.$forceUpdate();
    }

    updateThisItem(){
      const sameTrack = (this.item.name == this.currentlyPlayingItem.name) && (this.item.duration == this.currentlyPlayingItem.duration) && (this.item.track_number == this.currentlyPlayingItem.track_number);
      const icon = (this.audioPlaying && sameTrack) ? 'pause' : 'play';

      if(icon !== this.item.playbackIcon){
        this.setItemPlaybackIcon({item: this.item, icon});
      }
    }
    
    beforeMount(){
      //if playing track then loading its album for e.g., make sure corresponding track has correct icon
      //can't rely on item uri as individual track and its counterpart on album have different uris
      this.updateThisItem();
    }
  }
</script>