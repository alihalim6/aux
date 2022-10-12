<template>
  <v-dialog :value="uiFeed.display && !detailOverlays.display" fullscreen transition="fade-transition" persistent :no-click-animation="true">
    <div class="activity-feed">
      <div class="feed-container" id="feedContainer">
        <div class="d-flex flex-column">
          <div class="feed-title-container">
            <v-icon class="close-button" large @click="closeFeed()" aria-label="close feed">mdi-close</v-icon>

            <div class="d-flex align-end justify-space-between">
              <div class="live-now-label">
                <span class="live-now-number">{{users.length}}</span>
                <span class="live-now"> other user<span>{{users.length == 1 ? '' : 's'}}</span> on now</span>
                <v-icon small class="clickable" color="#888">mdi-information-outline</v-icon>
              </div>

              <div class="aux-mode-toggle" v-if="activityFeed.length">
                <v-switch v-model="auxModeOn" :hide-details="true" color="#1DB954" @change="auxModeToggled()"></v-switch>
                <span class="toggle-label">Automatically add tracks from other users to <span class="up-next">UP NEXT</span></span>
              </div>
            </div>
          </div>

          <v-card class="mb-2 pb-2" v-if="activityFeed.length">
            <ActivityItem v-for="item in activityFeed" :key="item.timestamp" :activity="item" :itemSet="activityFeed.map(activity => activity.track)"/>
          </v-card>

          <div v-else class="d-flex flex-column">
            <div class="no-feed-prompt">
              <div>Tracks that you and others play on AUX will show here.</div>
              <div class="sub-prompt">Kick things off by playing something!  Invite others lorem ipsum...</div>
            </div>

            <div class="no-prompt-graphic">
              <v-img id="rotatingEarth" src="http://www.clipartbest.com/cliparts/dT7/6xj/dT76xjjEc.gif"></v-img>
              <v-img class="animated-phrase" :src="require('~/assets/pass_the_aux_cord.png')"></v-img>
            </div>
          </div>
        </div>
        
        <BackToTop elementId="feedContainer"/>
      </div>
    </div>
  </v-dialog>
</template>

<script>
  import {Component, Vue, Getter, Mutation, Watch} from 'nuxt-property-decorator';
  import {UI, USER, FEED} from '~/store/constants';
  import socket from '~/plugins/socket.client.js';
  import {storageGet, storageGetBoolean, storageSet} from '~/utils/storage';
  import {AUX_MODE} from '~/utils/constants';

  @Component
  export default class Feed extends Vue {
    liveStatusInterval;
    auxModeOn;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Getter('feed', {namespace: UI})
    uiFeed;

    @Getter('detailOverlays', {namespace: UI})
    detailOverlays;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('feed', {namespace: FEED})
    activityFeed;
    
    @Getter('users', {namespace: FEED})
    users;

    @Watch('profile')
    currentUserProfileSet(){
      if(this.profile){
        this.liveStatusInterval = setInterval(() => {
          socket.emit('userLive', {userProfile: this.profile})
        }, 5000);
      }
    }

    beforeMount(){
      const auxModeNotSet = !storageGet(AUX_MODE);

      //default to ON if no preference set
      if(auxModeNotSet){
        this.auxModeOn = true;
        storageSet(AUX_MODE, true)
      }

      this.auxModeOn = storageGetBoolean(AUX_MODE);
    }

    auxModeToggled(){
      storageSet(AUX_MODE, this.auxModeOn);
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
    padding: 8px;

    .feed-container {
      background-color: white;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: $base-padding 3vw 0px;
      color: $primary-theme-color;
      overflow: scroll;
      font-weight: bold;
      margin: 0 auto;
      max-width: $max-inner-width;

      .close-button {
        align-self: flex-end;
        color: $primary-theme-color;
      }

      .feed-title-container {
        $title-container-color: #888888;

        display: flex;
        flex-direction: column;
        font-size: 24px;
        margin-bottom: 18px;

        .live-now-label {
          font-size: 14px;

          .live-now-number {
            font-size: 40px;
            color: $primary-theme-color;
          }

          .live-now {
            font-weight: normal;
            color: $title-container-color;
          }
        }

        .aux-mode-toggle {
          padding-right: 8px;
          padding-bottom: 10px;
          display: flex;
          align-items: center;

          .v-input--selection-controls {
            margin-top: 0px;
          }

          @media(max-width: 580px){
            max-width: 35vw;
            flex-direction: column;
            align-items: flex-start;
          }

          .toggle-label {
            padding-top: 4px;
            font-size: 12px;
            color: $title-container-color;
            font-weight: normal;

            .up-next {
              font-weight: bold;
              color: black;
            }
          }
        }
      }

      .no-feed-prompt {
        font-size: 20px;
        font-weight: bold;
        line-height: 1.4;

        .sub-prompt {
          font-size: 16px;
          margin-top: 8px;
          color: #aaaaaa;
        }
      }

      .no-prompt-graphic {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 30px;
        position: relative;

        .animated-phrase {
          position: absolute;
          left: 100%;
          animation: blimp-scroll 3.5s infinite forwards linear;

          @keyframes blimp-scroll {
            from {transform: translateX(0);}
            to {transform: translateX(-205%);}
          }
        }
      }
    }
  }
</style>