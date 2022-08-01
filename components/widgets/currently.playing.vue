<template>
  <v-footer class="currently-playing-container">
    <div class="clickable view-queue-container" :class="{'off-air': !currentlyPlayingItem.uri}" v-if="profile">      
      <v-btn elevation="4" class="view-queue" aria-label="view playback queue">
        <v-icon small color="white">mdi-format-list-text</v-icon>
      </v-btn>

        <div class="d-flex align-center ml-2"><v-icon x-small color="red">mdi-circle</v-icon><span class="on-air">ON AIR</span></div>
    </div>

    <div class="currently-playing">
      <v-img v-if="currentlyPlayingItem.imgUrl" @click="displayDetailsOverlay(currentlyPlayingItem)" class="clickable item-img" :src="currentlyPlayingItem.imgUrl"></v-img>

      <div class="playback-container">
        <span v-if="currentlyPlayingItem.uri" class="track-info">{{currentlyPlayingItem.primaryLabel}} /<span class="artists"> {{currentlyPlayingItem.secondaryLabel}}</span></span>

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

        <div class="d-flex justify-center">
          <v-icon 
            medium 
            class="clickable queue-control" 
            :class="{'no-visibility': !hasPreviousItem}" 
            @click.stop="playPreviousItem()"
            aria-label="skip to previous track"
          >
            mdi-skip-previous
          </v-icon>
          
          <v-icon 
            large 
            class="clickable control playback-toggle" 
            :class="{'disabled-control': !currentlyPlayingItem.uri}" 
            @click.stop="playbackToggled()"
            :aria-label="`${playbackIcon === 'play' ? 'resume' : 'pause'} track`"
          >
            {{`mdi-${playbackIcon}`}}
          </v-icon>        
          
          <v-icon 
            medium 
            class="clickable queue-control" 
            :class="{'no-visibility': !hasNextItem}" 
            @click.stop="playNextItem()"
            aria-label="skip to next track"
          >
            mdi-skip-next
          </v-icon>
        </div>
      </div>
    </div>
  </v-footer>
</template>

<script>
  import {Component, Vue, Getter, Watch, Action} from 'nuxt-property-decorator';
  import {PLAYBACK_QUEUE, SPOTIFY, UI} from '~/store/constants';
  import {msToDuration} from '~/utils/helpers';
  import {httpClient} from '~/utils/api';

  @Component
  export default class CurrentlyPlaying extends Vue {
    playbackInterval = null;
    playbackIcon = 'play';
    usernameFirstInitial;

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

    @Getter('hasPreviousItem', {namespace: PLAYBACK_QUEUE})
    hasPreviousItem;

    @Getter('hasNextItem', {namespace: PLAYBACK_QUEUE})
    hasNextItem;

    @Getter('profile', {namespace: UI})
    profile;

    @Action('stopPlayback', {namespace: SPOTIFY})
    stopPlayback;

    @Action('playPreviousItem', {namespace: PLAYBACK_QUEUE})
    playPreviousItem;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('playNextItem', {namespace: PLAYBACK_QUEUE})
    playNextItem;

    @Action('seekPlayback', {namespace: SPOTIFY})
    seekPlayback;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    @Watch('audioPlaying')
    async updatePlaybackIcon(){
      await this.$nextTick();
      this.playbackIcon = this.currentlyPlayingItem.playbackIcon || 'play';
    }
    
    @Watch('currentlyPlayingItem')
    async startPlayback(item){
      if(item && item.id){
        //singles (with type 'album') don't have duration
        if(!item.duration_ms){
          const { data } = await httpClient.post('/passthru', {
            url: `/albums/${item.id}/tracks`,
            method: 'GET'
          });

          item.duration_ms = data.items[0].duration_ms;
        }

        //item played directly from new and reco preview e.g. won't have duration
        if(!item.duration){
          item.duration = msToDuration(item.duration_ms);
        }

        this.initializeTiming(item);

        if(!this.playbackInterval){
          this.startInterval();
        }
      }
      else{
        this.stopInterval();
        this.initializeTiming();
        this.playbackIcon = 'play';
      }
    }

    @Watch('profile')
    profileSet(){
      if(this.profile){
        this.usernameFirstInitial = this.profile.username.substring(0, 1);
      }
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

            if(this.hasNextItem){
              this.playNextItem();
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

    unmounted(){
      this.stopInterval();
    }
  }
</script>

<style lang="scss">
  $no-audio-color: #cccccc;

  .currently-playing-container {
    flex-direction: column;
    flex-wrap: nowrap !important;
    width: 100%;
    height: $max-footer-height;
    font-size: 14px;
    position: sticky !important;
    bottom: 0px;
    z-index: 1000;
    background-color: $secondary-theme-color !important;
    box-shadow: 0px 4px 0px -2px rgb(0 0 0 / 17%), 0px -11px 7px -8px rgb(0 0 0 / 22%) !important;

    .view-queue-container {
      align-self: flex-end;
      margin: 6px 12px 0px;
      display: flex;

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

      .view-queue:hover {
        padding: 16px;
      }

      .on-air {
        font-size: 10px;
        color: red;
        padding-left: 4px;
        font-weight: bold;
      }
    }

    .off-air {
      .v-icon, .on-air {
        color: $no-audio-color !important;
      }

      button {
        background-color: white !important;
      }
    }

    .currently-playing {
      display: flex;
      justify-content: center;

      .item-img {
        max-width: 135px;
      }
      
      .playback-container {
        display: flex;
        flex-direction: column;
        min-width: 50vw;
        max-width: 50vw;
        padding: $base-padding;
      
        .track-info {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          .artists {
            font-size: 12px;
            font-weight: normal;
          }
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
        }

        .playback-toggle:hover {
          padding: 10px;
        }

        .disabled-control {
          color: $no-audio-color;
        }

        .playback-toggle.disabled-control {
          border: 1px solid rgba(0, 0, 0, 0.2);
          background-color: $secondary-theme-color;
        }

        .playback-time {
          color: #888888;
          font-size: 12px;
        }
      }
    }
  }
</style>