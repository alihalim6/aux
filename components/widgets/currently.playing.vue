<template>
  <v-footer class="currently-playing-container" :class="{'up-next-displaying': upNextDisplaying, 'up-next-hidden': upNextHidden}">
    <div class="clickable view-queue-container" v-if="!upNextDisplaying && currentlyPlayingItem.uri">
      <v-btn elevation="4" class="view-queue" aria-label="view playback queue" @click="displayAuxSession()">
        <v-icon small color="white">mdi-format-list-text</v-icon>
      </v-btn>

      <div class="d-flex align-center ml-2" :class="{'off-air': !currentlyPlayingItem.uri}"><v-icon x-small color="red">mdi-circle</v-icon><span class="on-air">ON AIR</span></div>
    </div>

    <div class="currently-playing" v-if="!upNextDisplaying">
      <div class="d-flex">
        <v-img @click="displayDetailsOverlay(currentlyPlayingItem)" v-if="currentlyPlayingItem.uri" class="clickable item-img" :src="currentlyPlayingItem.imgUrl"></v-img>

        <div class="playback-container" :class="{'pa-0': !currentlyPlayingItem.uri}">
          <span v-if="currentlyPlayingItem.uri" class="ellipses-text font-weight-bold">{{currentlyPlayingItem.primaryLabel}} /<span class="artists"> {{currentlyPlayingItem.secondaryLabel}}</span></span>

          <div class="d-flex">
            <v-slider 
              color="black" 
              track-color="#ccc" 
              dense 
              hide-details="true" 
              step="0" 
              :disabled="!currentlyPlayingItem.uri"
              v-model="playbackElapsed.ms"
              :max="playbackTotal.ms"
              class="d-flex align-center"
              @change="updateElapsedDisplay"
              @end="seek"
              aria-label="seek track"
            >
              <template v-slot:prepend><span class="playback-time">{{playbackElapsed.display}}</span></template>
              <template v-slot:append><span class="playback-time">{{playbackTotal.display}}</span></template>
            </v-slider>

            <v-icon v-if="currentlyPlayingItem.uri" class="clickable pl-3" color="#1DB954">mdi-heart{{itemLiked ? '' : '-outline'}}</v-icon>
          </div>

          <div class="d-flex justify-center">
            <v-icon 
              class="clickable queue-control" 
              :class="{'no-visibility': !hasPreviousTrack}" 
              @click.stop="playPreviousTrack()"
              aria-label="skip to previous track"
            >
              mdi-skip-previous
            </v-icon>
            
            <v-icon 
              class="clickable control playback-toggle" 
              :class="{'disabled-control': !currentlyPlayingItem.uri}" 
              @click.stop="playbackToggled()"
              :aria-label="`${playbackIcon === 'play' ? 'resume' : 'pause'} track`"
            >
              {{`mdi-${playbackIcon}`}}
            </v-icon>        
            
            <v-icon 
              class="clickable queue-control" 
              :class="{'no-visibility': !hasNextTrack}" 
              @click.stop="playNextTrack()"
              aria-label="skip to next track"
            >
              mdi-skip-next
            </v-icon>
          </div>
        </div>
      </div>

      <div class="d-flex flex-column align-start mt-2"  @click.stop="viewUpNext()" v-if="currentlyPlayingItem.uri">
        <div class="up-next-container">
          <v-icon class="clickable" :class="{'no-next-track': !hasNextTrack}" color="black">mdi-chevron-up</v-icon>

          <div class="d-inline-flex align-center">
            <span class="clickable min-width-fit" :class="{'no-next-track': !hasNextTrack}">UP NEXT: </span>

            <div v-if="hasNextTrack" class="clickable track-sneak-peek">
              <v-img class="track-img" :src="nextTrack.imgUrl"></v-img>
              <span class="ellipses-text">{{nextTrack.primaryLabel}} /<span class="track-artists"> {{nextTrack.secondaryLabel}}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UpNextTracks/>
  </v-footer>
</template>

<script>
  import {Component, Vue, Getter, Watch, Action, Mutation} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY, UI} from '~/store/constants';
  import {msToDuration, getItemDuration} from '~/utils/helpers';
  import {httpClient} from '~/utils/api';

  @Component
  export default class CurrentlyPlaying extends Vue {
    playbackInterval = null;
    playbackIcon = 'play';
    upNextDisplaying = false;
    upNextHidden = true;
    itemLiked = false;

    playbackElapsed = {
      ms: 0,
      display: '0:00'
    };

    playbackTotal = {
      ms: 0,
      display: '0:00'
    };

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('audioPlaying', {namespace: SPOTIFY})
    audioPlaying;

    @Getter('nextTrack', {namespace: PLAYBACK_QUEUE})
    nextTrack;

    @Getter('hasPreviousTrack', {namespace: PLAYBACK_QUEUE})
    hasPreviousTrack;

    @Getter('hasNextTrack', {namespace: PLAYBACK_QUEUE})
    hasNextTrack;

    @Action('stopPlayback', {namespace: SPOTIFY})
    stopPlayback;

    @Action('playPreviousTrack', {namespace: PLAYBACK_QUEUE})
    playPreviousTrack;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('playNextTrack', {namespace: PLAYBACK_QUEUE})
    playNextTrack;

    @Action('seekPlayback', {namespace: SPOTIFY})
    seekPlayback;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    @Mutation('displayAuxSession', {namespace: UI})
    displayAuxSession;

    //TODO: NOT 'OFF AIR' IF NOTHING PLAYING - ONLY WHEN NOTHING HAS BEEN PLAYED

    @Watch('audioPlaying')
    async updatePlaybackIcon(){
      await this.$nextTick();
      this.playbackIcon = this.currentlyPlayingItem.playbackIcon || 'play';
    }
    
    @Watch('currentlyPlayingItem')
    async startPlayback(item){
      if(item && item.id){
        item.duration_ms = await getItemDuration(item);

        if(!item.duration){
          item.duration = msToDuration(item.duration_ms);
        }

        this.initializeTiming(item);

        if(!this.playbackInterval){
          this.startInterval();
        }

        const {data} = await httpClient.post('/passthru', {url: `/me/${item.type == 'album' ? 'albums' : 'tracks'}/contains?ids=${item.id}`});
        this.itemLiked = data[0];
      }
      else{
        this.stopInterval();
        this.initializeTiming();
        this.playbackIcon = 'play';
      }
    }

    beforeMount(){
      this.$nuxt.$on('hideUpNext', () => {
        this.upNextHidden = true;
        this.upNextDisplaying = false;
      });
    }

    initializeTiming(item){
      this.playbackElapsed.ms = 0;
      this.playbackElapsed.display = msToDuration(this.playbackElapsed.ms);
      this.playbackTotal.ms = item ? item.duration_ms : 0;
      this.playbackTotal.display = msToDuration(this.playbackTotal.ms);
    }

    startInterval(){
      this.playbackInterval = setInterval(() => {
        if(this.audioPlaying){
          this.playbackElapsed.ms += 1000;

          if(this.playbackElapsed.ms >= this.playbackTotal.ms){
            this.playbackElapsed.ms = this.playbackTotal.ms;

            if(this.hasNextTrack){
              this.playNextTrack();
            }
            else{
              this.stopPlayback(true);
            }
          }

          this.playbackElapsed.display = msToDuration(this.playbackElapsed.ms);
        }
      }, 1000);
    }

    stopInterval(){
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }

    handleError(){
      this.stopPlayback();
      this.stopInterval();
    }

    async playbackToggled(){
      if(this.currentlyPlayingItem.uri){
        await this.togglePlayback({item: this.currentlyPlayingItem});
      }
    }

    updateElapsedDisplay(){
      this.playbackElapsed.display = msToDuration(this.playbackElapsed.ms);
    }

    async seek(){
      await this.seekPlayback(this.playbackElapsed.ms);
      this.updateElapsedDisplay();
    }

    viewUpNext(){
      if(this.hasNextTrack){
        this.upNextHidden = false;
        this.upNextDisplaying = true;
      }
    }

    unmounted(){
      this.stopInterval();
    }
  }
</script>

<style lang="scss">
  $off-color: #cccccc;

  .currently-playing-container {
    flex-direction: column;
    flex-wrap: nowrap !important;
    width: 100%;
    height: $max-footer-height-not-playing;
    font-size: 14px;
    position: sticky !important;
    bottom: 0px;
    z-index: 1000;
    background-color: $secondary-theme-color !important;
    box-shadow: 0px 4px 0px -2px rgb(0 0 0 / 17%), 0px -11px 7px -8px rgb(0 0 0 / 22%) !important;
    overflow: hidden;
    padding: 6px 4px !important;

    .view-queue-container {
      align-self: flex-end;
      margin-right: 12px;
      display: flex;
      padding-top: 2px;

      .view-queue {
        color: white;
        display: flex;
        font-weight: bold;
        z-index: 30;
        border-radius: 4px;
        background-color: $spotify-green;
        border-radius: 100%;
        padding: 12px;
        height: unset;
        min-width: unset;
      }

      .on-air {
        font-size: 10px;
        color: red;
        padding-left: 4px;
        font-weight: bold;
      }
    }

    .view-queue-container:hover {
      padding: 1px;
    }

    .off-air {
      color: $off-color !important;
    }

    .currently-playing {
      $item-img-size: 120px;

      display: flex;
      flex-direction: column;

      .item-img {
        max-width: $item-img-size;
        max-height: $item-img-size;
      }
      
      .playback-container {
        $playback-container-size: 60vw;

        display: flex;
        flex-direction: column;
        min-width: $playback-container-size;
        max-width: $playback-container-size;
        padding: $base-padding 0px $base-padding $base-padding;
      
        .artists {
          font-size: 12px;
          font-weight: normal;
        }
        
        .control {
          color: $primary-theme-color;
        }

        .queue-control {
          @extend .control;
          padding: 0px 16px;
          margin: 0px 20px;
        }

        .playback-toggle {
          border-radius: 100%;
          padding: 8px;
          color: $secondary-theme-color;
          background-color: $primary-theme-color;
          font-size: 16px;
        }

        .playback-toggle:hover {
          padding: 10px;
        }

        .disabled-control {
          color: $off-color;
        }

        .playback-toggle.disabled-control {
          border: 1px solid rgba(0, 0, 0, 0.2);
          background-color: $secondary-theme-color;
        }

        .playback-time {
          color: #888888;
          font-size: 12px;
        }

        .view-history {
          align-self: flex-start;
          margin-left: -6px;
        }
      }
    }

    .up-next-container {
      padding: 10px 0px;
      font-weight: bold;
      color: $primary-theme-color;
      display: flex;
      max-width: 50vw;

      .no-next-track {
        cursor: unset;
        color: $off-color !important;
      }
    }
  }

  .up-next-displaying {
    background-color: black !important;
    color: white !important;
    animation: slide-up $up-next-slide-animation;

    @keyframes slide-up {
      from {
        height: $max-footer-height-not-playing;
      }

      to {
        height: 100vh;
      }
    }
  }

  .up-next-hidden {
    background-color: white !important;
    color: black !important;
  }
</style>