<template>
  <section class="up-next-list-container" id="upNextListContainer" v-if="nextTrack">
    <div class="clickable up-next-header" @click="$nuxt.$emit('hideUpNext')">
      <v-icon class="align-self-start" x-large color="white">mdi-chevron-down</v-icon>

      <div class="d-inline-flex align-center">
        <span class="min-width-fit">PLAYING: </span>

        <div class="track-sneak-peek">
          <v-img class="track-img" :src="currentlyPlayingItem.imgUrl.small"></v-img>
          <span class="ellipses-text">{{currentlyPlayingItem.primaryLabel}} /<span class="track-artists"> {{currentlyPlayingItem.secondaryLabel}}</span></span>
        </div>
      </div>
    </div>
    
    <div class="d-flex flex-column align-center">
      <span class="up-next-title">UP NEXT</span>

      <div class="up-next-actions">
        <div class="clickable up-next-action" v-if="nextTracks.length > 1"> 
          <span class="underlined" @click.stop="shuffleUpNext()">SHUFFLE</span>
          <v-icon small class="pl-1" color="white">mdi-shuffle</v-icon>
        </div>

         <div class="clickable up-next-action"> 
          <span class="underlined" @click.stop="clearUpNextPressed()">
            <span v-if="nextTracks.length > 1">CLEAR ALL</span>
            <span v-else>REMOVE</span>
          </span>
          
          <v-icon small class="pl-1" color="white">mdi-cancel</v-icon>
         </div>
      </div>
    </div>

    <div class="next-track-container">
      <v-card elevation="6" class="clickable mt-10" @click.stop="nextTrackArtworkPressed()">
        <v-img :src="nextTrack.imgUrl.medium" class="next-track-img"></v-img>
      </v-card>

      <div class="track-info">
        <div class="info-item">
          <div class="info-label">TITLE</div>
          <div class="info-value ellipses-text">{{nextTrack.primaryLabel.toUpperCase()}}</div>
        </div>

        <div class="info-item">
          <div class="info-label">BY</div>
          <div class="info-value ellipses-text">{{nextTrack.secondaryLabel.toUpperCase()}}</div>
        </div>

        <div class="info-item">
          <div class="info-label">RUNTIME</div><div class="info-value">{{nextTrack.duration}}</div>
        </div>

        <div v-if="multiTrackAlbum()" class="d-flex">
          <div class="info-item">
            <div class="info-label">TRACK NO.</div><div class="info-value">{{nextTrack.track_number}}</div>
          </div>
        </div>
        
        <div v-if="multiTrackAlbum()" class="d-flex">
          <div class="info-item">
            <div class="info-label">FROM</div>
            <div class="clickable info-value ellipses-text underlined" @click.stop="fromAlbumPressed(nextTrack.album)">{{nextTrack.album.name.toUpperCase()}}</div>
          </div>
        </div>
        
        <div v-if="multiTrackAlbum() && nextTrack.album.releaseDate" class="d-flex">
          <div class="info-item">
            <div class="info-label">RELEASED</div><div class="info-value">{{nextTrack.album.releaseDate.toUpperCase()}}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="then-container" v-if="thenTracks.length">
      <span class="then-label">THEN</span>

      <div v-for="(track, index) in thenTracks" :key="index + track.uuid" class="clickable then-track-container fill-available" @click.stop="nextTrackPressed(track, thenTracks)">
        <span class="track-title">{{track.primaryLabel}}</span>
        <span class="track-artists">{{track.secondaryLabel}}</span>
        <ThreeDotIcon :item="track" :itemInQueue="true" iconClass="up-next-three-dot" iconColor="white"/>
      </div>
    </div>

    <BackToTop elementId="upNextListContainer" arrowColor="#1DB954"/>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Watch, Action} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
  import {setDuration, setItemMetaData} from '~/utils/helpers';
  import moment from 'moment';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class UpNextTracks extends Vue {
    @Getter('nextTrack', {namespace: PLAYBACK_QUEUE})
    nextTrack;

    @Getter('nextTracks', {namespace: PLAYBACK_QUEUE})
    nextTracks;

    @Getter('thenTracks', {namespace: PLAYBACK_QUEUE})
    thenTracks;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('clearUpNext', {namespace: PLAYBACK_QUEUE})
    clearUpNext;

    @Action('shuffleUpNext', {namespace: PLAYBACK_QUEUE})
    shuffleUpNext;

    @Watch('nextTrack', {immediate: true})
    async nextTrackChanged(nextTrack){
      if(nextTrack){
        await setDuration(this.nextTrack);
        
        if(this.multiTrackAlbum()){
          this.nextTrack.album.releaseDate = moment(this.nextTrack.album.release_date).format('MMMM DD YYYY') || moment(this.nextTrack.album.release_date).format('YYYY') || '';
        }

        this.$forceUpdate();
      }
    }

    multiTrackAlbum(){
      return this.nextTrack.album && this.nextTrack.album.total_tracks > 1;
    }

    async nextTrackPressed(track, itemSet){
      this.$nuxt.$emit('hideUpNext');
      await this.togglePlayback({item: track, itemSet});
    }

    async fromAlbumPressed(album){
      setItemMetaData([album]);
      this.$nuxt.$emit('hideUpNext');
      this.$nuxt.$root.$emit('displayDetailOverlay', album)
    }

    clearUpNextPressed(){
      this.clearUpNext();
      this.$nuxt.$emit('hideUpNext');
    }

    nextTrackArtworkPressed(){
      this.$nuxt.$emit('hideUpNext');
      this.$nuxt.$root.$emit('displayDetailOverlay', setItemMetaData(cloneDeep([this.nextTrack]))[0]);
    }
  }
</script>

<style lang="scss">
  @import '~/styles/simple-styles.scss';
  
  .up-next-list-container {
    width: 100%;
    height: 100%;
    align-items: center;
    display: inline-flex;
    flex-direction: column;
    overflow-y: scroll;

    .up-next-header {
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      margin-bottom: 24px;

      .track-sneak-peek {
        width: 62vw;
      }
    }

    @supports(-webkit-text-stroke: $simple-title-border-size white) {
      .up-next-title {
        @extend .simple-overlay-title;
        -webkit-text-stroke: $simple-title-border-size white;
        -webkit-text-fill-color: black;
      }
    }

    .up-next-actions {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      width: 225px;
      margin-top: 8px;

      .up-next-action {
        display: flex;
        align-items: center;
        font-weight: bold;
      }
    }

    .next-track-container {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .next-track-img {
        $img-size: 250px;
        width: $img-size;
        height: $img-size;
      }

      .track-info {
        font-weight: bold;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 12px;

        .info-item {
          display: flex;
          align-items: flex-end;
          max-width: 90vw;

          .info-label {
            transform: scale(0.75, 1.4);
          }
        }
     
        .info-value {
          transform: scaleY(2);
          padding: 2px 1px;
        }
      }
    }

    .then-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-weight: bold;
      width: 90vw;
      margin-top: 40px;
      padding-bottom: 120px;

      .then-label {
        text-decoration: underline;
        font-size: 18px;
      }

      .then-track-container {
        $item-margin: 8px;
        $track-item-padding: 4px;

        display: flex;
        align-items: flex-start;
        justify-content: space-around;
        margin: 4px 0px;

        .track-item {
          width: 50%;
          padding: $track-item-padding 0px;
        }

        .track-title {
          @extend .track-item;
          text-align: right;
          margin-right: $item-margin;
        }

        .track-artists {
          @extend .track-item;
          text-align: left;
          font-weight: normal;
          margin-left: $item-margin;
        }

        .up-next-three-dot {
          display: flex;
          align-items: center;
          padding: $track-item-padding 0px;
        }
      }
    }
  }
</style>