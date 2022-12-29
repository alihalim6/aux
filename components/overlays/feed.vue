<template>
  <v-slide-y-reverse-transition>
    <div v-show="uiFeed.display" class="activity-feed">
      <div class="feed-container scroll-shadow-on-transparent" id="feedContainer">
        <div class="d-flex flex-column">
          <div class="feed-title-container">
            <v-icon class="close-button" large @click="closeFeed()" aria-label="close feed">mdi-chevron-down</v-icon>
          </div>

          <div class="activity-item" v-if="activityFeed.length">
            <ActivityItem v-for="item in activityFeed" :key="item.track.id" :activity="item" :itemSet="activityFeed.map(activity => activity.track)"/>
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
  import {Component, Vue, Getter, Mutation, Watch} from 'nuxt-property-decorator';
  import {UI, USER, FEED} from '~/store/constants';
  import socket from '~/plugins/socket.client.js';

  @Component
  export default class Feed extends Vue {
    liveStatusInterval;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Getter('feed', {namespace: UI})
    uiFeed;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('feed', {namespace: FEED})
    activityFeed;

    @Watch('profile')
    currentUserProfileSet(){
      if(this.profile){
        this.liveStatusInterval = setInterval(() => {
          socket.emit('userLive', {userProfile: this.profile})
        }, 5000);
      }
    }
    
    unmounted(){
      clearInterval(this.liveStatusInterval);
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
      max-width: $max-inner-width;
      border-radius: 10px;

      .feed-title-container {
        margin: 6px 0px 16px;
        display: flex;
        flex-direction: column;
        font-size: 24px;

        .close-button {
          align-self: flex-end;
          color: $secondary-theme-color;
          margin-right: 4px;
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
</style>