<template>
    <v-icon class="clickable" :class="[iconClass, conditionalIconClass]" v-show="!item.isArtist" @click="togglePlay(item)">
      {{`mdi-${item.playbackIcon}-circle-outline`}}
  </v-icon>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter, Watch} from 'nuxt-property-decorator';
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

    @Getter('currentlyPlayingItemUri', {namespace: SPOTIFY})
    currentlyPlayingItemUri;

    @Getter('audioPlaying', {namespace: SPOTIFY})
    audioPlaying;

    @Watch('audioPlaying', {immediate: true})   
    @Watch('currentlyPlayingItemUri', {immediate: true})
    playbackChanged(){
      //keep all playback icons up to date
      this.$forceUpdate();
    }
      
    togglePlay(item){
      this.togglePlayback(item);
      this.$forceUpdate();
    }
  }
</script>