<template>
  <section class="up-next-list-container" id="upNextListContainer" v-if="nextTrack && !pendingFirstPlay" :class="{'sm-browser-up-next-container': $vuetify.breakpoint.xs && !runningInPwa}">
    <div class="sticky-header">
      <button 
        class="clickable up-next-header" 
        @click="$nuxt.$root.$emit('hideUpNext')" 
        aria-label="hide next tracks in queue"
      >
        <v-icon class="align-self-start" large color="white">mdi-chevron-down</v-icon>

        <div class="d-inline-flex align-center">
          <span class="min-width-fit">PLAYING: </span>

          <div class="track-sneak-peek">
            <v-img class="track-img" v-if="currentlyPlayingItem.imgUrl" :src="currentlyPlayingItem.imgUrl.small" alt=""></v-img>
            <span class="ellipses-text">{{currentlyPlayingItem.primaryLabel}} /<span class="track-artists"> {{currentlyPlayingItem.secondaryLabel}}</span></span>
          </div>
        </div>
      </button>

      <div class="current-track-control" :class="{'has-previous': togglePreviousTrack}" @click.stop>
        <v-icon 
          v-if="togglePreviousTrack"
          class="clickable" 
          @click.stop="togglePreviousTrack()"
          aria-label="go to previous track"
        >
          mdi-skip-previous
        </v-icon>

        <v-progress-circular 
          :size="36" 
          :width="4" 
          :rotate="-90" 
          :value="currentElapsed" 
          color="#1DB954" 
          class="clickable mx-2" 
          :aria-label="`${playbackIcon === 'play' ? 'resume' : 'pause'} track`"
        >
          <v-icon @click.stop="toggleCurrentPlayback()">
            {{`mdi-${playbackIcon}`}}
          </v-icon>   
        </v-progress-circular>

        <v-icon 
          class="clickable" 
          @click.stop="toggleNextTrack()"
          aria-label="skip to next track"
        >
          mdi-skip-next
        </v-icon>

        <v-icon 
          v-if="currentlyPlayingItem.uri" 
          class="clickable pl-5 like-toggle" 
          @click.stop="toggleTrackLike()" 
          :aria-label="`${itemLiked ? 'remove track from' : 'add track to'} liked songs`"
        >
          mdi-heart{{itemLiked ? '' : '-outline'}}
        </v-icon>
      </div>
    </div>

    <div class="up-next-title-container">
      <div class="up-next-title">
        <span class="up">UP</span><span>NEXT</span>
      </div>

      <div class="up-next-actions">
        <div class="clickable up-next-action" v-if="nextTracks.length > 1"> 
          <button 
            @click.stop="shuffleUpNext()" 
            aria-label="shuffle next tracks in queue"
          >
            SHUFFLE
          </button>
          
          <v-icon small class="pl-1" color="white">mdi-shuffle</v-icon>
        </div>

         <div class="clickable up-next-action"> 
          <button 
            @click.stop="clearUpNextPressed()"
            aria-label="remove next tracks in queue"
          >
            <span v-if="nextTracks.length > 1">REMOVE ALL</span>
            <span v-else>REMOVE</span>
          </button>
          
          <v-icon small class="pl-1" color="white">mdi-cancel</v-icon>
         </div>
      </div>
    </div>

    <div class="next-track-container">
      <div class="position-relative">
        <v-card elevation="6" class="clickable mt-10 next-track">
          <v-img 
            :src="$vuetify.breakpoint.smAndUp ? (nextTrack.imgUrl.large || nextTrack.imgUrl.medium) : nextTrack.imgUrl.medium" 
            class="next-track-img" 
            @click.stop="nextTrackArtworkPressed()" 
            aria-hidden="true"
          >
          </v-img>
        </v-card>

        <ThreeDotMenu :item="nextTrack" :item-in-queue="true" iconClass="up-next-three-dot next-track-three-dot mt-10" icon-color="white"/>
      </div>

      <div class="track-info">
        <div class="info-item more-margin">
          <div class="info-label">TITLE</div>
          <div class="info-value ellipses-text title-value">{{nextTrack.primaryLabel.toUpperCase()}}</div>
        </div>

        <div class="info-item">
          <div class="info-label">BY</div>
          <div class="info-value ellipses-text">{{nextTrack.secondaryLabel.toUpperCase()}}</div>
        </div>

        <div class="info-item">
          <div class="info-label">RUNTIME</div><div class="info-value">{{nextTrack.duration}}</div>
        </div>

        <div v-if="multiTrackAlbum()" class="d-flex">
          <div class="info-item more-margin">
            <div class="info-label">TRACK NO.</div><div class="info-value">{{nextTrack.track_number}}</div>
          </div>
        </div>
        
        <div v-if="multiTrackAlbum()" class="d-flex">
          <div class="info-item">
            <div class="info-label">FROM</div>

            <button 
              class="clickable info-value ellipses-text underlined" 
              @click.stop="fromAlbumPressed(nextTrack.album)"
              :aria-label="`open modal with details about ${nextTrack.album.name}`"
            >
              {{nextTrack.album.name.toUpperCase()}}
            </button>
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

      <div 
        v-for="track in thenTracks" 
        :key="track.queueId" 
        class="then-track-container fill-available" 
      >
        <button @click.stop="nextTrackPressed(track, thenTracks)" :aria-label="`play ${track.primaryLabel} by ${track.secondaryLabel}`" class="track-title">{{track.primaryLabel}}</button>
        <span class="track-artists">{{track.secondaryLabel}}</span>
        <ThreeDotMenu :item="track" :item-in-queue="true" icon-class="up-next-three-dot" icon-color="white"/>
      </div>

      <span v-show="restOfQueueLength" class="plus-more">AND MORE... </span>
    </div>

    <BackToTop elementId="upNextListContainer" arrowColor="#1DB954"/>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Watch, Action, Prop} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
  import {setDuration, setItemMetaData} from '~/utils/helpers';
  import moment from 'moment';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class UpNextTracks extends Vue {
    runningInPwa = false;

    @Prop()
    currentElapsed;

    @Prop()
    playbackIcon;

    @Prop()
    toggleCurrentPlayback;

    @Prop()
    togglePreviousTrack;

    @Prop()
    toggleNextTrack;

    @Prop()
    toggleTrackLike;

    @Prop()
    itemLiked;

    @Getter('nextTrack', {namespace: PLAYBACK_QUEUE})
    nextTrack;

    @Getter('nextTracks', {namespace: PLAYBACK_QUEUE})
    nextTracks;

    @Getter('thenTracks', {namespace: PLAYBACK_QUEUE})
    thenTracks;

    @Getter('restOfQueueLength', {namespace: PLAYBACK_QUEUE})
    restOfQueueLength;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('pendingFirstPlay', {namespace: SPOTIFY})
    pendingFirstPlay;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('clearUpNext', {namespace: PLAYBACK_QUEUE})
    clearUpNext;

    @Action('shuffleUpNext', {namespace: PLAYBACK_QUEUE})
    shuffleUpNext;

    @Watch('nextTrack', {immediate: true})
    async nextTrackChanged(){
      if(this.playingSomethingWithNextTrack()){//check for current item for the case of playing track now when there was nothing playing
        await setDuration(this.nextTrack);
        
        if(this.multiTrackAlbum()){
          this.nextTrack.album.releaseDate = moment(this.nextTrack.album.release_date).format('MMMM DD YYYY') || moment(this.nextTrack.album.release_date).format('YYYY') || '';
        }

        this.$forceUpdate();
      }
      else {
        this.$nuxt.$root.$emit('hideUpNext');
      }
    }

    beforeMount(){
      this.runningInPwa = window.matchMedia('(display-mode: standalone)').matches || document.referrer.startsWith('android-app://') || navigator.standalone;
    }

    playingSomethingWithNextTrack(){
      return this.currentlyPlayingItem && this.nextTrack;
    }

    multiTrackAlbum(){
      return this.playingSomethingWithNextTrack() && this.nextTrack.album && this.nextTrack.album.total_tracks > 1;
    }

    async nextTrackPressed(track, itemSet){
      this.$nuxt.$root.$emit('hideUpNext');
      await this.togglePlayback({item: track, itemSet, playingTrackWithinExistingQueue: true});
    }

    async fromAlbumPressed(album){
      this.$nuxt.$root.$emit('hideUpNext');
      this.$nuxt.$root.$emit('displayDetailOverlay', setItemMetaData([cloneDeep(album)])[0])
    }

    clearUpNextPressed(){
      this.clearUpNext();
      this.$nuxt.$root.$emit('hideUpNext');
    }

    nextTrackArtworkPressed(){
      this.$nuxt.$root.$emit('hideUpNext');
      this.$nuxt.$root.$emit('displayDetailOverlay', setItemMetaData(cloneDeep([this.nextTrack]))[0]);
    }
  }
</script>

<style lang="scss">  
  @import '~/components/styles';

  $img-size: 250px;
  $large-img-size: 500px;

  .up-next-list-container {
    width: 100%;
    height: 100%;
    align-items: center;
    display: inline-flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-top: calc(env(safe-area-inset-top) + 12px);
    padding-bottom: 200px;

    @media(max-width: $device-size-threshold){
      padding-top: 16px;
    }

    .up-next-header {
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      margin-bottom: 10px;

      .track-sneak-peek {
        width: 62vw;
      }
    }

    $up-next-title-border-size: 5px;

    @supports(-webkit-text-stroke: $up-next-title-border-size $rose-red) {
      .up-next-title {
        @extend .simple-overlay-title;
        display: flex;
        align-items: center;
        font-size: 62px !important;
        -webkit-text-stroke: $up-next-title-border-size white;
        -webkit-text-fill-color: white;
        padding: 8px;
        margin-right: 10px;
      }
    }

    .up-next-actions {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      width: 275px;
      margin-top: 8px;

      .up-next-action {
        display: flex;
        align-items: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
        padding: 6px 10px;
        border-radius: 20px;
        background-color: $spotify-green;

        &:hover {
          transform: scale(1.03);
        }
      }
    }

    .next-track-container {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .next-track-img {
        width: $img-size;
        height: $img-size;

        @media(min-width: $max-inner-width){
          width: $large-img-size;
          height: $large-img-size;
        }
      }

      .track-info {
        font-weight: bold;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 12px;
        max-width: 600px;
        font-size: 16px;

        .info-item {
          display: flex;
          align-items: flex-end;
          max-width: 90vw;
          font-weight: 900;

          .info-label {
            transform: scaleX(0.75);
          }
        }
     
        .info-value {
          transform: scaleY(1.19);
          padding: 1px 1px;
        }
      }
    }

    .then-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-weight: bold;
      width: 70vw;
      margin-top: 58px;
      padding-bottom: 120px;

      @media(max-width: $max-inner-width){ 
        width: 90vw;
      }

      .then-label {
        font-size: 22px;
        color: $cream;
        font-weight: 800;
      }

      .then-track-container {
        $item-margin: 8px;
        $track-item-padding: 4px;

        display: flex;
        align-items: center;
        justify-content: space-around;
        margin: 6px 0px;

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
          font-style: italic;
        }

        .up-next-three-dot {
          display: flex;
          align-items: center;
          padding: $track-item-padding 0px;
        }

        &:hover {
          background-color: rgb(252, 252, 224, 0.2);
        }
      }
    }

    .back-to-top-container {
      bottom: calc(env(safe-area-inset-bottom) + -20%);
    }
  }

  .sm-browser-up-next-container {
    padding-top: calc(env(safe-area-inset-top) + 12px);
  }

  .plus-more {
    font-size: 20px;
    font-style: italic;
    font-weight: bold;
    margin-top: 16px;
  }

  .next-track-three-dot {
    position: absolute !important;
    top: calc(#{$img-size} / 2);
    right: -40px;

    @media(min-width: $max-inner-width){
      top: calc(#{$large-img-size} / 2);
    }
  }

  .title-value {
    color: $cream;
    font-weight: 900;
  }

  .more-margin {
    margin-right: 6px;
  }

  .up {
    margin-top: 3px;
    transform: rotate(-90deg);
    font-size: 40px;
    margin-right: -5px;
  }

  .current-track-control {
    margin-left: 30px;
    white-space: nowrap;
    align-self: flex-start;
    margin-bottom: 14px;

    button {
      color: $cream !important;
      font-size: 24px !important;

      &:hover {
        transform: scale(1.1);
      }
    }

    &.has-previous {
      margin-left: 34px;
    }
  }

  .sticky-header {
    position: fixed;
    top: 0;
    width: -webkit-fill-available;
    background-color: black;
    z-index: 1;
    padding: 4px;
  }

  .up-next-title-container {
    margin-top: 104px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>