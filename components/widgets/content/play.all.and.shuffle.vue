<template>
  <section class="play-all-and-shuffle-container fill-available" v-if="playbackItem">
    <PlaybackIcon :item="playbackItem" :itemSet="playbackItem.itemSet" iconClass="playback-icon"/>
    <v-icon @click.stop="shuffleAndPlay()" class="clickable shuffle-icon">mdi-shuffle</v-icon>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Watch} from 'nuxt-property-decorator';
  import {handleItemCollection, shuffleArray} from '~/utils/helpers';
  import {SPOTIFY} from '~/store/constants';

  @Component
  export default class PlayAllAndShuffle extends Vue {
    playbackItem;

    @Prop({required: true})
    tracks;

    @Prop({required: true})
    collectionKey;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Watch('tracks', {immediate: true})
    updateTracks(newVal, oldVal){
      if(newVal && !oldVal){
        this.playbackItem = {
          isCollection: true,
          uri: this.collectionKey,
          //used in playback icon logic
          name: this.collectionKey
        };

        this.setTracksCollection(this.tracks);
        this.playbackItem.itemSet = this.tracks;
        this.$nuxt.$emit('updateTracks', this.tracks);
      }
    }
    
    setTracksCollection(tracks){
      for(const track of tracks){
        handleItemCollection(track, this.collectionKey);
      }
    }

    async shuffleAndPlay(){
      await this.togglePlayback({item: this.playbackItem, itemSet: shuffleArray(this.tracks)});
    }
  }
</script>

<style lang="scss">
  .play-all-and-shuffle-container {
    $icon-padding: 0px 4px;

    display: flex;
    justify-content: space-between;
    margin: 14px auto 10px;
    max-width: 80px;

    .playback-icon {
      color: $primary-theme-color;
      font-size: 32px;
      padding: $icon-padding;
    }

    .shuffle-icon {
      color: $primary-theme-color;
      font-size: 24px;
      padding: $icon-padding;
    }
  }
</style>