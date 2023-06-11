<template>
  <v-snackbar 
    class="feed-alert-container"
    :class="{'clickable': !feedAlert.activityReaction}"
    v-model="currentAlert"
    right
    max-width="75vw"
    transition="slide-y-reverse-transition" 
    color="white"
    :timeout="timeout"
  >
    <div class="d-flex flex-column align-center" @click.stop="alertPressed()">
      <div class="d-flex justify-space-between fill-available">
        <span :class="{'no-visibility': !(!feedAlert.activityReaction && auxModeOn && currentlyPlayingItem.uri)}" class="up-next">UP NEXT:</span>
        <v-icon class="clickable mb-2" @click.stop="closeAlert()" color="black" aria-label="close the feed alert">mdi-close</v-icon>
      </div>

      <div class="snackbar-container fill-available" :class="{'mb-5': !repliedToReaction}">    
        <div class="d-flex align-center pr-3" :class="{'align-start': feedAlert.trackAddedToFeed}">
          <v-img v-if="feedAlert.img" :src="feedAlert.img" class="snackbar-img" @click.stop="trackInfoPressed()" :class="{'track-img': feedAlert.trackAddedToFeed}"></v-img>

          <span class="alert-text" :class="{'ml-2': feedAlert.activityReaction}">
            <span>{{feedAlert.username}}</span><span class="ml-1 font-weight-regular">{{feedAlert.text}}</span>
          </span>

          <span v-if="feedAlert.trackAddedToFeed" class="clickable font-weight-bold alert-text" @click.stop="playActivityTrack()">
            {{feedAlert.track.primaryLabel}} /<span class="track-artists"> {{feedAlert.track.secondaryLabel}}</span>
            <v-icon class="clickable play-activity-track" aria-label="play the track just added to feed">mdi-play</v-icon>
          </span>
        </div>
      </div>

      <span v-if="repliedToReaction" class="reaction-reply">
        <span>You:</span><span class="ml-1 font-weight-regular">{{repliedToReaction}}</span>
      </span>

      <div class="d-flex align-center align-self-end" v-if="feedAlert.trackAddedToFeed">
        <v-img v-if="feedAlert.addedByImg" :src="feedAlert.addedByImg" class="round-img-icon"></v-img>
        <span class="added-by-name">{{feedAlert.addedByName}}</span>
      </div>

      <div class="d-flex align-center align-self-end mr-1" v-if="feedAlert.activityReaction">
        <v-img :src="feedAlert.track.imgUrl.small" class="small-track-img"></v-img>
      
        <span class="reaction-track-info" :class="{'clickable': !feedAlert.activityReaction}">
          {{feedAlert.track.primaryLabel}} /<span class="reaction-track-artists"> {{feedAlert.track.secondaryLabel}}</span>
        </span>
      </div>

      <span v-if="feedAlert.activityReaction && !repliedToReaction" @click="replyPressed()" class="clickable reaction-reply-label" :class="{'mb-4': replyingToFeedReaction}">Reply</span>
      
      <div class="align-self-end">
        <FeedChatInput v-show="replyingToFeedReaction" :activity="feedAlert" color="black" :chatOnFeedAlert="true" submitIconColor="black"/>
      </div>
    </div>
  </v-snackbar>
</template>

<script>
  import {Component, Vue, Getter, Watch, Action, Mutation} from 'nuxt-property-decorator';
  import {UI, PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
  import {AUX_MODE} from '~/utils/constants';
  import {storageGetBoolean} from '~/utils/storage';

  @Component
  export default class FeedAlert extends Vue {
    currentAlert = false;
    auxModeOn = false;
    repliedToReaction = false;
    timeout = -1;

    @Getter('feedAlert', {namespace: UI})
    feedAlert;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('replyingToFeedReaction', {namespace: UI})
    replyingToFeedReaction;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;

    @Mutation('displayFeed', {namespace: UI})
    displayFeed;

    @Mutation('toggleReplyingToFeedReaction', {namespace: UI})
    toggleReplyingToFeedReaction;

    @Mutation('unseenActivity', {namespace: UI})
    unseenActivity;

    @Watch('feedAlert')
    alertChanged(alert){
      this.currentAlert = !!alert.track;
      this.auxModeOn = storageGetBoolean(AUX_MODE);
      this.repliedToReaction = false;
      this.resetTimeout();
    }

    beforeMount(){
      this.$nuxt.$root.$on('feedAlertChatSubmitted', message => {
        this.repliedToReaction = message;
        //sets to false
        this.toggleReplyingToFeedReaction();
        this.resetTimeout();
      });
    }

    //reset snackbar timer (value needs to change for vuetify to reset it)
    async resetTimeout(){
      this.timeout = 0;
      await this.$nextTick();
      this.timeout = this.currentAlert.timeout || 7000;
    }

    trackInfoPressed(){
      this.$nuxt.$root.$emit('displayDetailOverlay', this.feedAlert.track);
      this.closeAlert();
    }

    playActivityTrack(){
      this.playTrackNow(this.feedAlert.track);
      this.closeAlert();
      this.unseenActivity(false);
    }

    alertPressed(){
      //for reaction alerts, don't want feed to open when clicked (may seem like supposed to take you directly to that track/its reactions)
      if(!this.feedAlert.activityReaction){
        this.displayFeed();
        this.closeAlert();
      }
    }
    
    closeAlert(){
      this.currentAlert = false;
    }

    async replyPressed(){
      this.toggleReplyingToFeedReaction();
      await this.$nextTick();

      if(this.replyingToFeedReaction){
        this.timeout = -1;
      }
      else {
        this.resetTimeout();
      }
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('feedAlertChatSubmitted');
    }
  }
</script>

<style lang="scss">  
  .feed-alert-container {
    $track-info-font-size: 12px;
    $secondary-text-color: #888888;

    .up-next {
      color: $primary-theme-color;
      align-self: flex-start;
      margin: 0px 0px 6px 8px;
      font-weight: bold;
    }

    .alert-text {
      color: $primary-theme-color;
      font-weight: bold;
      margin-left: 2px;
    }

    .reaction-reply {
      @extend .alert-text;
      align-self: flex-start;
      font-size: 16px;
      margin: 8px $snackbar-side-margin 24px;
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

    .added-by-name {
      font-size: 12px;
      font-weight: bold;
      color: $secondary-text-color;
      padding-left: 6px;
    }

    .reaction-reply-label {
      font-weight: bold;
      color: black;
      font-size: 14px;
      align-self: flex-end;
      margin-top: 6px;
      margin-right: $reaction-emoji-margin;
      text-decoration: underline;
    }
  }
</style>