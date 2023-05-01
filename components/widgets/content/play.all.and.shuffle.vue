<template>
  <section class="play-all-and-shuffle-container fill-available" v-if="playbackItem">
    <PlaybackIcon :item="playbackItem" :itemSet="playbackItem.itemSet" iconClass="playback-icon"/>
    
    <div class="clickable small-circle shuffle" @click="shuffleAndPlay()" @keyup.enter="shuffleAndPlay()" tabindex="0" >
      <span class="small-circle-top-letters">SHU</span>
      <span class="small-circle-bottom-letters">FFLE</span>
    </div>
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

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Watch('tracks', {immediate: true})
    updateTracks(newVal, oldVal){
      //doesn't work to check length (https://v2.vuejs.org/v2/api/#vm-watch) so this just runs on first load (undefined to defined)
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
        handleItemCollection(track, this.collectionKey);
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
    $icon-padding: 0px 4px;

    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 14px auto 10px;
    max-width: 91px;

    .playback-icon {
      color: $primary-theme-color;
      font-size: 40px;
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