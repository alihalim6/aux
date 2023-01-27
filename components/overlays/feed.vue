<template>
  <v-slide-y-reverse-transition>
    <div v-show="uiFeed.display" class="activity-feed">
      <div class="feed-container scroll-shadow-on-transparent" id="feedContainer">
        <div class="d-flex flex-column">
          <div class="feed-title-container" id="feedHeader">
            <v-icon class="clickable feed-header-icon" id="feedToolTip" v-show="activityFeed.length" aria-label="feed tooltip">mdi-help-circle-outline</v-icon>

            <v-tooltip bottom color="#1DB954" attach="#feedHeader" activator="#feedToolTip" :open-delay="150">
              <div class="mb-2">Showing AUX activity in the last 24 hours.</div>
              <div>Once you listen to {{minSecsForPlay}} seconds of a track, it's added to everyone's feed. Otherwise it's a skip that's only visible in your feed.</div>
            </v-tooltip>

            <v-icon class="clickable feed-header-icon" large @click="closeFeed()" aria-label="close feed">mdi-chevron-down</v-icon>
          </div>

          <div class="activity-item" v-if="activityFeed.length">
            <FeedItem v-for="item in activityFeed" :key="item.updateTimestamp" :activity="item" :itemSet="activityFeed.map(activity => activity.track)"/>
          </div>

          <div v-else class="d-flex flex-column">
            <div class="no-feed-prompt">
              <div>Tracks that you and others play will show here.</div>
              <div class="sub-prompt">Kick things off by playing something!  Invite others lorem ipsum...</div>
            </div>

            <div class="no-prompt-graphic">
              <v-img src="http://www.clipartbest.com/cliparts/dT7/6xj/dT76xjjEc.gif"></v-img>
              <v-img class="animated-phrase" :src="require('~/assets/pass_the_aux.png')"></v-img>
            </div>
          </div>
        </div>
        
        <BackToTop elementId="feedContainer" arrowColor="white"/>
      </div>
    </div>
  </v-slide-y-reverse-transition>
</template>

<script>
  import {Component, Vue, Getter, Mutation, Watch, Action} from 'nuxt-property-decorator';
  import {UI, USER, FEED, SPOTIFY} from '~/store/constants';
  import socket from '~/plugins/socket.client.js';
  import {isSameTrack} from '~/utils/helpers';
  import {PLAYED_NOT_SKIPPED_THRESHOLD, AUTH} from '~/utils/constants';
  import {auxApiClient} from '~/auth';
  import {storageSet} from '~/utils/storage';

  @Component
  export default class Feed extends Vue {
    liveStatusInterval;
    secsOfTrackPlayed = 0;
    skipOrPlay = {};
    minSecsForPlay = PLAYED_NOT_SKIPPED_THRESHOLD;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Getter('feed', {namespace: UI})
    uiFeed;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Getter('audioPlaying', {namespace: SPOTIFY})
    audioPlaying;

    @Getter('feed', {namespace: FEED})
    activityFeed;

    @Getter('latestActivity', {namespace: FEED})
    latestActivity;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    @Action('setActivitySkipped', {namespace: FEED})
    setActivitySkipped;

    @Action('setActivityPlayed', {namespace: FEED})
    setActivityPlayed;

    @Action('setInitialFeed', {namespace: FEED})
    setInitialFeed;

    @Watch('profile')
    currentUserProfileSet(){
      if(this.profile){
        this.liveStatusInterval = setInterval(() => {
          socket.emit('userLive', {userProfile: this.profile});
        }, 5000);

        this.initializeFeed();
      }
    }

    @Watch('currentlyPlayingItem')
    currentlyPlayingItemChanged(newItem, oldItem){
      //if playback stopped while there was a skip-or-play pending, clear interval and set it skipped
      if(!newItem.id && oldItem.id && this.skipOrPlay.activity){
        this.clearSkipPlayAndSkipLastActivity();
      }
    }
    
    @Watch('latestActivity')
    latestActivityChanged(latestActivity){
      const activityInFeed = this.activityFeed.find(feedActivity => isSameTrack(feedActivity.track, latestActivity.track));

      //TRACK IS ALREADY IN FEED
      const handleActivityAlreadyInFeed = () => {
        //previously played, so just add repeat listen reaction
        if(activityInFeed.played){
          this.addReactionToActivity({activity: activityInFeed, message: `${latestActivity.repeatingOwnTrack ? '' : 'also'} listening${latestActivity.repeatingOwnTrack ? ' again' : ''}`});
        }
        //previously skipped, mark as played now
        else{
          this.emitNewPlay(activityInFeed);
          this.setActivityPlayed(activityInFeed);
        }
      };

      //TRACK IS NEW TO FEED
      const handleNewFeedActivity = () => {
        this.emitNewPlay(latestActivity);
        this.setActivityPlayed(latestActivity);
      };

      const callback = latestActivity.activityAlreadyInFeed ? handleActivityAlreadyInFeed : handleNewFeedActivity;
      this.checkForSkipOrPlay(callback, latestActivity); 
    }

    emitNewPlay(activity){
      socket.emit('activityAdded', {...activity, played: true});
    }

    async initializeFeed(){
      const {data} = await auxApiClient().post('/feed/initialize', {profile: this.profile});
      storageSet(AUTH.AUX_API_TOKEN, data.token);
      this.setInitialFeed(data.activities);
    }

    resetSkipPlayCheck(){
      this.secsOfTrackPlayed = 0;
      clearInterval(this.skipOrPlay.interval);
      this.skipOrPlay = {};
    }

    clearSkipPlayAndSkipLastActivity(){
      this.setActivitySkipped(this.skipOrPlay.activity);
      this.resetSkipPlayCheck();
    }
 
    checkForSkipOrPlay(callback, activity){
      if(this.skipOrPlay.interval){
        this.clearSkipPlayAndSkipLastActivity();
      }

      this.skipOrPlay.activity = activity;

      this.skipOrPlay.interval = setInterval(() => {
        if(this.audioPlaying && this.currentlyPlayingItem.feedId){
          this.secsOfTrackPlayed++;
          
          if(isSameTrack(this.currentlyPlayingItem, activity.track)){
            if(this.secsOfTrackPlayed >= PLAYED_NOT_SKIPPED_THRESHOLD){
              this.resetSkipPlayCheck();
              callback();
            }
          }
          else{
            this.clearSkipPlayAndSkipLastActivity();
          } 
        }
      }, 1000);
    }
    
    beforeDestroy(){
      clearInterval(this.liveStatusInterval);
      clearInterval(this.skipOrPlay.interval);
    }
  }
</script>

<style lang="scss">
  @import '~/styles/simple-styles.scss';

  .activity-feed {
    height: 100%;
    padding: 0px 0px 12px 12px;
    position: fixed;
    right: 8px;
    max-width: 80vw;
    min-width: 40vw;
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(24px);
    color: white;
    z-index: 300;
    border-radius: 6px;

    .feed-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0px 4px;
      overflow: scroll;
      font-weight: bold;
      margin: 0 auto;
      max-width: calc(#{$max-inner-width} - 250px);
      border-radius: 10px;

      .feed-title-container {
        margin: 6px 0px 16px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        font-size: 24px;
        
        .feed-header-icon {
          color: $secondary-theme-color;
          margin-right: 8px;
        }

        .feed-header-icon:hover {
          @extend .hover-scale;
        }
      }

      .activity-item {
        background-color: transparent;
        padding-right: 6px;
      }

      .no-feed-prompt {
        font-size: 20px;
        font-weight: bold;
        line-height: 1.4;
        padding: 0px 14px 0px 2px;

        .sub-prompt {
          font-size: 14px;
          margin-top: 8px;
        }
      }

      .no-prompt-graphic {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 30px;
        position: relative;
        overflow-x: hidden;

        .animated-phrase {
          position: absolute;
          left: 100%;
          animation: blimp-scroll 3.5s infinite forwards linear;

          @keyframes blimp-scroll {
            0% {transform: translateX(0);}
            100% {transform: translateX(-205%);}
          }
        }
      }
    }
  }

  .feed-title-container {
    .v-tooltip__content {
      font-size: 14px;
      left: 10px !important;
      max-width: 90%;
    }
  }
</style>