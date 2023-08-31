<template>
  <v-slide-y-reverse-transition>
    <div v-show="uiFeed.display" class="activity-feed">
      <div class="feed-container scroll-shadow-on-transparent" id="feedContainer">
        <div class="d-flex flex-column">
          <div class="feed-title-container" id="feedHeader">
            <div>
              <v-icon class="clickable feed-header-icon" id="feedToolTip" tabindex="0" aria-label="display feed tooltip">
                mdi-help-circle-outline
              </v-icon>

              <v-tooltip bottom color="#1DB954" attach="#feedHeader" activator="#feedToolTip" :open-delay="150">
                <div role="tooltip" tabindex="0">
                  <div v-if="isSplashPage()" class="mb-6 font-italic">THIS IS A MOCK FEED. LOG IN TO SEE IT FOR REAL!</div>
                  <span>Once you listen to {{minSecsForPlay}} seconds of a track, it's added to everyone's feed where they can see it, play it and comment on it. Otherwise it's a skip that is only visible in your feed.</span>
                  <div class="mt-2">Tracks played more than {{TTL_HOURS}} hours ago are removed from the feed on page refresh / every so often.</div>
                </div>
              </v-tooltip>

              <v-icon class="clickable feed-header-icon" large @click.stop="closeFeed()" aria-label="close feed" tabindex="0">mdi-chevron-down</v-icon>
            </div>
          </div>

          <div class="activity-item" v-if="activityFeed.length">
            <FeedItem v-for="item in activityFeed" :key="item.updateTimestamp" :activity="item"/>
          </div>

          <div v-else class="d-flex flex-column">
            <div class="no-feed-prompt">
              <div>Tracks that you and others play show here.</div>
              <div class="sub-prompt">Nothing's been played in the last {{TTL_HOURS}} hours. Kick things off by playing something and tell a friend!</div>
            </div>

            <div class="no-prompt-graphic" aria-hidden="true">
              <v-img :src="require('~/assets/world.gif')"></v-img>
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
  import {isSameTrack, auxApiClient} from '~/utils/helpers';
  import {PLAYED_NOT_SKIPPED_THRESHOLD, SPLASH} from '~/utils/constants';

  @Component
  export default class Feed extends Vue {
    liveStatusInterval;
    secsOfTrackPlayed = 0;
    skipOrPlay = {};
    minSecsForPlay = PLAYED_NOT_SKIPPED_THRESHOLD;
    TTL_HOURS = 12;

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
        }, 15000);

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

    async beforeMount(){
      if(this.isSplashPage()){
        await this.initializeFeed();
        return;
      }
      
      window.addEventListener('popstate', () => {
        this.closeFeed();
      });
    }

    isSplashPage(){
      return this.$route.path == `/${SPLASH}`;
    }

    async initializeFeed(){
      const {data} = await auxApiClient.post('/feed/initialize', {profile: this.profile, splash: this.isSplashPage()});
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
        if(this.audioPlaying && this.currentlyPlayingItem.queueId){
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
  @import './styles';
  @import '~/components/styles';

  .activity-feed {
    height: 100%;
    padding: 0px 0px 12px 16px;
    position: fixed;
    right: 8px;
    max-width: 50vw;
    min-width: 40vw;
    background-color: rgba(0, 0, 0, 0.28);
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
      border-radius: 10px;

      .feed-title-container {
        margin: 6px 0px 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        font-size: 24px;
        
        .feed-header-icon {
          color: $secondary-theme-color;
          margin-right: 8px;
        }
      }

      .activity-item {
        background-color: transparent;
        padding-right: 6px;
      }

      .no-feed-prompt {
        font-size: 26px;
        font-weight: bold;
        line-height: 1.4;
        padding: 0px 14px 0px 2px;
        color: $off-white;

        .sub-prompt {
          font-size: 14px;
          margin-top: 8px;
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

  .scroll-shadow-on-transparent {
    background:
      /* Shadow Cover TOP */
      linear-gradient(
        rgba(255, 255, 255, 0),
        transparent 30%
      ) center top,
      
      /* Shadow Cover BOTTOM */
      linear-gradient(
        transparent 70%,
        rgba(255, 255, 255, 0)
      ) center bottom,
      
      /* Shadow TOP */
      radial-gradient(
        farthest-side at 50% 0,
        rgba(0, 0, 0, 0.2),
        rgba(0, 0, 0, 0)
      ) center top,
      
      /* Shadow BOTTOM */
      radial-gradient(
        farthest-side at 50% 100%,
        rgba(0, 0, 0, 0.2),
        rgba(0, 0, 0, 0)
      ) center bottom;

    background-repeat: no-repeat;
    background-size: 100% 40px, 100% 40px, 100% 8px, 100% 8px;
    background-attachment: local, local, scroll, scroll;
  }
</style>