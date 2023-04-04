<template>
  <v-footer class="currently-playing-container" id="footer" :class="{'up-next-displaying': upNextDisplaying, 'up-next-hidden': upNextHidden}">
    <div class="clickable view-feed-container" v-if="!upNextDisplaying" @click="feedIconPressed()">
      <div class="d-flex align-center ml-2">
        <v-icon x-small color="red">mdi-circle</v-icon>
        <div class="on-air">FEED</div>
        <v-icon large class="clickable on-air-chevron" color="black">mdi-chevron-up</v-icon>
        <v-icon v-show="showUnseenDot" large class="unseen-activity-dot" color="#36a8ff">mdi-circle-small</v-icon>
      </div>
    </div>

    <div class="currently-playing" v-if="!upNextDisplaying">
      <div class="d-flex">
        <v-img @click="displayItemDetails()" v-if="currentlyPlayingItem.uri" class="clickable item-img" :src="currentlyPlayingItem.imgUrl.medium || currentlyPlayingItem.imgUrl.large"></v-img>

        <div class="playback-container" :class="{'pa-0': !currentlyPlayingItem.uri}">
          <span v-if="currentlyPlayingItem.uri" class="ellipses-text font-weight-bold">{{currentlyPlayingItem.primaryLabel}} /<span class="artists"> {{currentlyPlayingItem.secondaryLabel}}</span></span>

          <div class="d-flex align-center mb-1">
            <v-slider 
              color="black" 
              track-color="#ccc" 
              dense 
              hide-details="true" 
              step="0" 
              :disabled="!currentlyPlayingItem.uri"
              v-model="playbackElapsed.ms"
              :max="playbackTotal.ms"
              class="clickable d-flex align-center"
              :class="{'disabled-control': !currentlyPlayingItem.uri}"
              @change="updateElapsedDisplay"
              @end="seek"
              aria-label="seek track"
            >
              <template v-slot:prepend><span class="playback-time">{{playbackElapsed.display}}</span></template>
              <template v-slot:append><span class="playback-time">{{playbackTotal.display}}</span></template>
            </v-slider>

            <div class="position-relative">
              <v-icon v-if="currentlyPlayingItem.uri" class="clickable pl-3" @click.stop="trackLikeToggled()" color="#1DB954">mdi-heart{{itemLiked ? '' : '-outline'}}</v-icon>

              <div v-show="trackReady" class="clickable small-circle repeat" :class="{'repeat-set': setToRepeatTrack}" @click.stop="toggleTrackRepeat()">
                <span class="small-circle-top-letters">RE</span>
                <span class="small-circle-bottom-letters">PEAT</span>
              </div>
            </div>
          </div>

          <div class="d-flex justify-center">
            <v-icon 
              class="clickable queue-control" 
              :class="{'no-visibility': !hasPreviousTrack, 'disable-playback-control': !trackReady}" 
              @click.stop="previousTrackPressed()"
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
              :class="{'no-visibility': !hasNextTrack, 'disable-playback-control': !trackReady}" 
              @click.stop="nextTrackPressed()"
              aria-label="skip to next track"
            >
              mdi-skip-next
            </v-icon>
          </div>
        </div>
      </div>

      <div class="d-flex flex-column align-start" id="upNextToggle">
        <div class="up-next-container" @click.stop="viewUpNext()">
          <v-icon class="clickable" :class="{'no-next-track': !hasNextTrack}" color="black">mdi-chevron-up</v-icon>

          <div class="d-inline-flex align-center">
            <span class="clickable min-width-fit" :class="{'no-next-track': !hasNextTrack}">UP NEXT: </span>

            <div v-if="hasNextTrack" class="clickable track-sneak-peek">
              <v-img class="track-img" :src="nextTrack.imgUrl.medium || currentlyPlayingItem.imgUrl.large"></v-img>
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
  import {msToDuration, setDuration, isSameTrack, setItemMetaData} from '~/utils/helpers';
  import {handleApiError} from '~/api/_utils';
  import spotify from '~/api/spotify';
  import {REMOVED_FROM_LIKES, ADDED_TO_LIKES, REMOVED_LIKED_ITEM_EVENT, LIKED_ITEM_EVENT} from '~/utils/constants';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class CurrentlyPlaying extends Vue {
    playbackInterval = null;
    playbackIcon = 'play';
    upNextDisplaying = false;
    upNextHidden = true;
    itemLiked = false;
    showUnseenDot = null;
    trackReady = false;

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

    @Getter('newPlayback', {namespace: SPOTIFY})
    newPlayback;

    @Getter('player', {namespace: SPOTIFY})
    player;

    @Getter('setToRepeatTrack', {namespace: SPOTIFY})
    setToRepeatTrack;

    @Getter('nextTrack', {namespace: PLAYBACK_QUEUE})
    nextTrack;

    @Getter('hasPreviousTrack', {namespace: PLAYBACK_QUEUE})
    hasPreviousTrack;

    @Getter('hasNextTrack', {namespace: PLAYBACK_QUEUE})
    hasNextTrack;

    @Getter('feed', {namespace: UI})
    feed;

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

    @Action('toggleTrackRepeat', {namespace: SPOTIFY})
    toggleTrackRepeat;

    @Mutation('displayFeed', {namespace: UI})
    displayFeed;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Watch('audioPlaying')
    async updatePlaybackIcon(playing){
      this.playbackIcon = playing ? 'pause' : 'play';
      this.$forceUpdate();
    }

    @Watch('currentlyPlayingItem')
    async itemPlayingChanged(item){
      this.setPlayerVolume(0);
      this.stopInterval();

      if(item.feedId){
        await setDuration(item);
        this.initializeTiming(item);
      }
      //nothing playing
      else{
        this.initializeTiming();
        this.playbackIcon = 'play';
      }
    }
    
    @Watch('newPlayback')
    async startPlayback(){
      const item = this.currentlyPlayingItem;

      if(item && item.feedId){
        this.setPlayerVolume(1);

        if(!this.playbackInterval){
          this.startInterval();
        }

        const data = await spotify({url: `/me/${item.type == 'album' ? 'albums' : 'tracks'}/contains?ids=${item.id}`});
        this.itemLiked = data[0];
        this.trackReady = true;
      }
    }

    @Watch('feed', {deep: true})
    feedChanged(newVal){
      this.showUnseenDot = newVal.unseenActivity;
    }

    beforeMount(){
      this.$nuxt.$root.$on('hideUpNext', () => {
        this.upNextHidden = true;
        this.upNextDisplaying = false;
      });

      this.$nuxt.$root.$on(REMOVED_LIKED_ITEM_EVENT, this.handleItemLikeStatus);
      this.$nuxt.$root.$on(LIKED_ITEM_EVENT, item => this.handleItemLikeStatus(item, true));
    }

    initializeTiming(item){
      this.playbackElapsed.ms = 0;
      this.playbackElapsed.display = msToDuration(0);
      this.playbackTotal.ms = item ? item.duration_ms : 0;
      this.playbackTotal.display = msToDuration(this.playbackTotal.ms);
    }

    startInterval(){
      this.playbackInterval = setInterval(() => {
        if(this.audioPlaying){
          this.playbackElapsed.ms += 1000;

          if(this.playbackElapsed.ms > this.playbackTotal.ms){
            this.playbackElapsed.ms = this.playbackTotal.ms;

            if(this.hasNextTrack && !this.setToRepeatTrack){
              this.playNextTrack({});
            }
            else if(this.setToRepeatTrack){
              this.repeatCurrentTrack();
              return;
            }
            else{
              this.stopPlayback(true);
            }

            this.stopInterval();
          }
          else{
            this.playbackElapsed.display = msToDuration(this.playbackElapsed.ms);
            this.syncElapsedWithPlayer();
          }
        }
      }, 1000);
    }

    async syncElapsedWithPlayer(){
      const currentState = await this.player.getCurrentState();

      if(currentState && !currentState.paused){
        this.playbackElapsed.display = msToDuration(currentState.position);
      }
    }

    async repeatCurrentTrack(){
      await this.itemPlayingChanged(this.currentlyPlayingItem);
      await this.startPlayback();
    }

    stopInterval(){
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
      this.trackReady = false;
    }

    handleError(){
      this.stopPlayback();
      this.stopInterval();
    }

    playbackToggled(){
      if(this.currentlyPlayingItem.uri){
        this.togglePlayback({item: this.currentlyPlayingItem});
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

    feedIconPressed(){
      if(this.feed.display){
        this.closeFeed();
      }
      else{
        this.displayFeed();
      }
    }

    async trackLikeToggled(){
      const modifyLikeUrl = `/me/tracks?ids=${this.currentlyPlayingItem.id}`;
      this.itemLiked = !this.itemLiked;

      if(!this.itemLiked){
        try {
          await spotify({url: modifyLikeUrl, method: 'DELETE'});
          this.$nuxt.$root.$emit(REMOVED_LIKED_ITEM_EVENT, this.currentlyPlayingItem);
          this.setToast({text: REMOVED_FROM_LIKES});
        }
        catch(error){
          handleApiError('Oops! That like didn\'t go thru lorem ipsum...');
          this.itemLiked = true;
        }
      }
      else{
        try {
          await spotify({url: modifyLikeUrl, method: 'PUT'});
          this.$nuxt.$root.$emit(LIKED_ITEM_EVENT, this.currentlyPlayingItem);
          this.setToast({text: ADDED_TO_LIKES});
        }
        catch(error){
          handleApiError('Oops! That un-like didn\'t go thru lorem ipsum...');
          this.itemLiked = false;
        }
      }
    }

    handleItemLikeStatus(item, liked){
      if(isSameTrack(this.currentlyPlayingItem, item)){
        this.itemLiked = liked;
      }
    }

    displayItemDetails(){
      this.$nuxt.$root.$emit('displayDetailOverlay', setItemMetaData(cloneDeep([this.currentlyPlayingItem]))[0]);
    }

    //try to avoid rogue plays from Spotify side from being heard if we stop playback but they continue and override our player pause
    setPlayerVolume(volume){
      if(this.player){
        this.player.setVolume(volume);
      }
    }

    previousTrackPressed(){
      this.stopInterval();
      this.playPreviousTrack();
    }

    nextTrackPressed(){
      this.stopInterval();
      this.playNextTrack({nextTrackButtonPressed: true});
    }

    beforeDestroy(){
      this.stopInterval();
      this.$nuxt.$root.$off('hideUpNext');
      this.$nuxt.$root.$off(REMOVED_LIKED_ITEM_EVENT);
      this.$nuxt.$root.$off(LIKED_ITEM_EVENT);
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
    padding: 0px 4px !important;

    .view-feed-container {
      align-self: flex-end;
      margin-right: 12px;
      display: flex;
      padding-top: 2px;
      position: relative;

      &:hover {
        .on-air-chevron {
          transition: translate 0.5s ease-out;
          transform: translateY(-3px);
        }
      }
    }

    .currently-playing {
      $item-img-size: 100px;

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
        padding: 0px 0px $base-padding $base-padding;
      
        .artists {
          font-size: 12px;
          font-weight: normal;
        }
        
        .control {
          color: $primary-theme-color;
        }

        .queue-control {
          @extend .control;
          margin: 0px 20px;
        }

        .playback-toggle {
          border-radius: 100%;
          padding: 4px;
          color: $secondary-theme-color;
          background-color: $primary-theme-color;
          font-size: 16px;
        }

        .disabled-control {
          color: $off-color;
          cursor: auto;
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
      padding: 6px 0px;
      font-weight: bold;
      color: $primary-theme-color;
      display: flex;
      max-width: 50vw;
      left: -5px;
      position: relative;

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

  .currently-playing-container {
    .v-tooltip__content {
      top: auto !important;
      bottom: calc(env(safe-area-inset-bottom) + 30px);
    }
  }

  #upNextToggle {
    margin-bottom: env(safe-area-inset-bottom);
  }

  .unseen-activity-dot {
    position: absolute !important;
    top: -4px;
    right: -9px;
  }

  .repeat {
    $color: #aaaaaa;

    color: $color;
    border: 2px solid $color;
    position: absolute;
    right: -5px;
    top: 32px;
    transform: scale(0.73);
    padding: 6px 5px !important;
  }

  .repeat-set {
    border: none;
    color: white;
    border: 2px solid $spotify-green;
    background-color: $spotify-green;
  }

  .disable-playback-control {
    color: #eeeeee !important;
    pointer-events: none;
  }
</style>