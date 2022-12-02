<template>
  <v-snackbar 
    class="clickable feed-alert-container"
    v-model="currentAlert"
    right
    max-width="75vw"
    transition="slide-y-reverse-transition" 
    color="white"
  >
    <div class="d-flex flex-column align-center" @click.stop="alertPressed()">
      <div class="snackbar-container fill-available mb-5">
        <div class="d-flex align-center pr-3" :class="{'align-start': feedAlert.trackAddedToFeed}">
          <v-img v-if="feedAlert.img" :src="feedAlert.img" class="snackbar-img" @click.stop="trackInfoPressed()" :class="{'track-img': feedAlert.trackAddedToFeed}"></v-img>
          
          <span class="alert-text" :class="{'ml-2': feedAlert.activityReaction}">
            <span>{{feedAlert.username}}</span><span class="ml-1 font-weight-regular">{{feedAlert.text}}</span>
          </span>

          <span v-if="feedAlert.trackAddedToFeed" class="clickable font-weight-bold alert-text" @click.stop="trackInfoPressed()">
            {{feedAlert.track.primaryLabel}} /<span class="track-artists"> {{feedAlert.track.secondaryLabel}}</span>
            <v-icon class="clickable play-activity-track" @click.stop="playActivityTrack()" aria-label="play the track just added to feed">mdi-play</v-icon>
          </span>
        </div>

        <v-icon class="clickable" @click.stop="closeAlert()" color="black" aria-label="close the feed alert">mdi-close</v-icon>
      </div>

      <div class="d-flex align-center align-self-end" v-if="feedAlert.trackAddedToFeed">
        <v-img v-if="feedAlert.addedByImg" :src="feedAlert.addedByImg" class="added-by-img"></v-img>
        <div v-else class="round-profile-letter">{{`${feedAlert.addedByName.substring(0, 1).toUpperCase()}`}}</div>

        <span class="added-by-name">{{feedAlert.addedByName}}</span>
      </div>

      <div class="d-flex align-center align-self-end" v-if="feedAlert.activityReaction">
        <v-img :src="feedAlert.track.imgUrl.small" class="small-track-img"></v-img>
        
        <span class="clickable reaction-track-info" @click.stop="trackInfoPressed()">
          {{feedAlert.track.primaryLabel}} /<span class="reaction-track-artists"> {{feedAlert.track.secondaryLabel}}</span>
        </span>
      </div>
    </div>
  </v-snackbar>
</template>

<script>
  import {Component, Vue, Getter, Watch, Action, Mutation} from 'nuxt-property-decorator';
  import {UI, PLAYBACK_QUEUE} from '~/store/constants';

  @Component
  export default class FeedAlert extends Vue {
    currentAlert = null;

    @Getter('feedAlert', {namespace: UI})
    feedAlert;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;

    @Mutation('displayFeed', {namespace: UI})
    displayFeed;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Watch('feedAlert')
    alertChanged(newVal){
      this.currentAlert = {...newVal};
    }

    trackInfoPressed(){
      this.displayDetailOverlays(this.feedAlert.track);
      this.closeAlert();
    }

    playActivityTrack(){
      this.playTrackNow(this.feedAlert.track);
      this.closeAlert();
    }

    alertPressed(){
      this.displayFeed();
      this.closeAlert();
    }
    
    closeAlert(){
      this.currentAlert = null;
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';

  .feed-alert-container {
    $track-info-font-size: 12px;
    $secondary-text-color: #888888;

    .alert-text {
      color: $primary-theme-color;
      font-weight: bold;
      margin-left: 2px;
    }

    .track-img {
      @extend .snackbar-img;
      border-radius: unset !important;
    }

    .small-track-img {
      @extend .track-img;
      $snackbar-img-size: 20px;

      height: $snackbar-img-size;
      max-width: $snackbar-img-size;
    }

    .reaction-track-info {
      margin-left: 8px;
      font-weight: bold;
      font-size: $track-info-font-size;
      color: $secondary-text-color;
    }

    .track-artists {
      font-weight: normal;
      font-size: $track-info-font-size;
    }

    .reaction-track-artists {
      @extend .track-artists;
      font-size: calc(#{$track-info-font-size} - 2px);
    }

    .play-activity-track {
      margin-left: 6px;
      border-radius: 100%;
      padding: 4px;
      color: $secondary-theme-color !important;
      background-color: $spotify-green;
      font-size: 12px !important;
      align-self: flex-start;
    }

    .added-by-img {
      @extend .round-img-icon;
      $added-by-img-size: 18px;

      height: $added-by-img-size;
      max-width: $added-by-img-size;
    }

    .added-by-name {
      font-size: 12px;
      font-weight: bold;
      color: $secondary-text-color;
      padding-left: 6px;
    }
  }
</style>