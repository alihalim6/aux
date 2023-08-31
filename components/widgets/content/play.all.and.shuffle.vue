<template>
  <section class="play-all-and-shuffle-container fill-available" v-if="playbackItem">
    <PlaybackIcon :item="playbackItem" :itemSet="playbackItem.itemSet" iconClass="playback-icon"/>
    
    <button v-show="!disableShuffle" class="clickable small-circle shuffle" @click="shuffleAndPlay()">
      <span class="small-circle-top-letters">SHU</span>
      <span class="small-circle-bottom-letters">FFLE</span>
    </button>
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

    @Prop()
    myAuxLikedTracks;

    @Prop()
    disableShuffle;

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
      }
    }
    
    setTracksCollection(tracks){
      for(const track of tracks){
        if(!track.fromCollection || (track.fromCollection && !track.fromCollection.includes(this.collectionKey))){
          handleItemCollection(track, this.collectionKey);
        }
      }
    }

    async shuffleAndPlay(){
      if(this.myAuxLikedTracks){
        this.$nuxt.$emit('playPreShuffledLikes', this.playbackItem);
      }
      else{
        await this.togglePlayback({item: this.playbackItem, itemSet: shuffleArray([...this.tracks])});
      }
    }
  }
</script>

<style lang="scss">
  .play-all-and-shuffle-container {
    $icon-padding: 0px 16px;

    display: flex;
    justify-content: center;
    align-items: center;
    margin: 14px auto 10px;

    .playback-icon {
      color: $primary-theme-color;
      font-size: 40px !important;
      padding: $icon-padding;
    }
  }

  .shuffle {    
    background-color: $primary-theme-color;
    color: $secondary-theme-color;
  }

  .playback-icon:hover, .shuffle:hover {
    transform: scale(1.1);
  }
</style>