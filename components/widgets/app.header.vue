<template>
  <v-app-bar elevation="2" color="white" class="app-bar" short hide-on-scroll>
    <div class="logo-container">
      <div class="aux-logo-container">
        <div class="outlined-phrase d-none d-sm-inline">PASS THE</div>
        <div class="inline-display main-label">AUX</div>
      </div>

      <div class="d-flex align-center ml-2">
        <v-icon small class="by-x">mdi-close</v-icon>
        <v-img class="spotify-icon d-inline d-sm-none" :src="require('~/assets/Spotify_Logo_Icon.png')"></v-img>
        <v-img class="spotify-full d-none d-sm-inline" :src="require('~/assets/Spotify_Logo_Full.png')"></v-img>
      </div>
    </div>

    <div class="user-container">
      <v-menu bottom left transition="slide-y-transition" z-index="900" :close-on-content-click="false" offset-y>
        <template v-slot:activator="{on, attrs}">            
          <div class="clickable on-air-container" v-bind="attrs" v-on="on">
            <div class="users-on-air">{{liveUsers.length}}</div>
            <v-icon class="live-info-icon" color="black" large>mdi-chevron-down</v-icon>
          </div>
        </template>

        <v-list>
          <v-list-item>
            <div class="pt-4 pl-2 pr-6 d-flex flex-column width-100">
              <div class="d-flex justify-end">
                <div v-if="liveUsers.length" class="following-on-container">
                  <span class="following-on">FOLLOWING ON</span>
                  <v-img class="spotify-img d-inline" :src="require('~/assets/Spotify_Logo_Full.png')"></v-img>
                </div>
              </div>

              <div v-if="liveUsers.length" class="cursor-auto">
                <div class="live-user-container" v-for="user in liveUsers" :key="user.id">
                  <v-icon class="clickable mr-3" small color="black" @click="ignoreUserToggled(user)">{{`mdi-eye${user.ignored ? '' : '-off'}`}}</v-icon>

                  <div :class="{'ignored-opacity': user.ignored}">
                    <v-img v-if="user.img" :src="user.img" class="user-img"></v-img>
                    <div v-else class="round-profile-letter small-margin-right">{{`${user.name.substring(0, 1)}`}}</div>
                  </div>
                  
                  <div class="user-name" :class="{'ignored-opacity': user.ignored}">{{user.name}}</div>
                  
                  <v-switch 
                    :class="{'not-following-switch': !user.following, 'ignored-opacity': user.ignored}" 
                    v-model="user.following" 
                    :hide-details="true" 
                    color="#1DB954" 
                    @click="followingUserToggled(user)"
                  >
                  </v-switch>
                </div>

                <div class="aux-mode-toggle">
                  <v-switch v-model="auxModeOn" :hide-details="true" color="#1DB954" @change="auxModeToggled()" label="AUX Mode"></v-switch>              
                  <v-icon small class="ml-2" color="#888" id="auxModeTooltipIcon">mdi-help-circle-outline</v-icon>

                  <v-tooltip left color="#1DB954" attach="#footer" activator="#auxModeTooltipIcon" :open-on-hover="false">
                    <span>When <span class="font-weight-bold">AUX Mode</span> is on, tracks played by others are automatically added to your queue
                      <v-icon small class="ml-1" color="white">mdi-arrow-down</v-icon>
                    </span>
                  </v-tooltip>
                </div>
              </div>

              <div v-else>
                <!-- mjcry -->
              </div>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>

      <span class="clickable menu-label" @click="logoutPressed()">Logout</span>
    </div>
  </v-app-bar>
</template>

<script>
  import {Component, Vue, Getter, Watch, Mutation} from 'nuxt-property-decorator';
  import {FEED, USER, UI} from '~/store/constants';
  import {storageGet, storageGetBoolean, storageSet, clearStorage} from '~/utils/storage';
  import {AUX_MODE, SPLASH, IGNORED_USERS, BLACK} from '~/utils/constants';
  import {ignoredUsers} from '~/utils/helpers';
  import {httpClient, handleApiError} from '~/utils/api';
  import socket from '~/plugins/socket.client.js';

  @Component
  export default class AppHeader extends Vue {
    auxModeOn = true;
    liveUsers = [];

    @Getter('users', {namespace: FEED})
    users;

    @Getter('profile', {namespace: USER})
    profile;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Watch('users', {immediate: true})
    async usersChanged(liveUsers){
      this.liveUsers = liveUsers.map(user => {
        return {
          ...user, 
          selected: false,
          following: user.following,
          ignored: ignoredUsers().find(userId => userId == user.id)
        };
      });
    }
    
    async beforeMount(){
      const auxModeNotSet = !storageGet(AUX_MODE);

      //default to ON if no preference set
      if(auxModeNotSet){
        this.auxModeOn = true;
        storageSet(AUX_MODE, true);
      }

      this.auxModeOn = storageGetBoolean(AUX_MODE);
    }

    auxModeToggled(){
      storageSet(AUX_MODE, this.auxModeOn);
    }

    logoutPressed(){
      clearStorage();
      $nuxt.$router.push(SPLASH);
    }

    ignoreUserToggled(user){
      user.ignored = !user.ignored;

      if(user.ignored){
        storageSet(IGNORED_USERS, [...ignoredUsers(), user.id]);
        this.setToast({text: `Ignoring tracks played by ${user.name}`});
      }
      else{
        const userIdIndex = ignoredUsers().findIndex(userId => userId == user.id);
        const ignoredUserIds = ignoredUsers();
        ignoredUserIds.splice(userIdIndex, 1);
        storageSet(IGNORED_USERS, ignoredUserIds);
        this.setToast({text: `No longer ignoring tracks played by ${user.name}`});
      }
    }

    async followingUserToggled(user){
      //user.following is v-modeled so value here is the result of the toggle
      const method = user.following ? 'PUT' : 'DELETE';

      try {
        await httpClient.post('/passthru', {url: `/me/following?ids=${user.id}&type=user`, method});
        this.setToast({text: `${user.following ? 'Now following' : 'No longer following'} ${user.name} on Spotify`});

        if(user.following){
          socket.emit('userFollowed', {followedById: this.profile.id, followedByName: this.profile.name, followedId: user.id});
        }
      }
      catch(error){
        handleApiError(`Oops! That ${user.following ? 'follow' : 'unfollow'} didn't go thru lorem ipsum...`);
        user.following = !user.following;
      }
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';

  .app-bar {
    $phrase-border-size: 1px;
    
    height: $app-header-height !important;
    max-height: $app-header-height;
    z-index: 30 !important;

    @supports(-webkit-text-stroke: $phrase-border-size $primary-theme-color) {
      .outlined-phrase {
        -webkit-text-stroke: $phrase-border-size $primary-theme-color;
        -webkit-text-fill-color: $secondary-theme-color;
      }
    }

    .logo-container {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      margin: 0px $base-padding 0px 0px;

      .aux-logo-container {
        font-weight: 700;
        font-size: 26px;
        
        .outlined-phrase {
          color: $secondary-theme-color;
        }

        .main-label {
          background-color: $primary-theme-color;
          color: $secondary-theme-color;
          border-radius: 2px;
        }
      }

      .by-x {
        color: $primary-theme-color;
        padding-right: 4px;
      }

      .spotify-full {
        width: 4em;
      }

      .spotify-icon {
        $icon-size: 1.2em;

        width: $icon-size;
        height: $icon-size;
      }
    }

    .user-container {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .on-air-container {
        display: flex;
        align-items: center;
        position: relative;
        margin-right: 16px;

        @media(max-width: $max-inner-width){
          margin-right: 10px;
        }

        .users-on-air {
          background-color: $primary-theme-color;
          color: $secondary-theme-color;
          font-size: 38px;
          font-weight: 600;
          line-height: 0.9;
          padding: 1px;
          border-radius: 2px;

          @media(max-width: $max-inner-width){
            margin-right: 0px;
          }
        }

        .live-info-icon {
          top: 1px;
        }

        &::after {
          content: '';
          position: absolute;
          height: 4px;
          width: 10px;
          bottom: -8px;
          background-color: $spotify-green;
          animation: oscillate-live;
          animation-duration: 4s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-fill-mode: forwards;

          @keyframes oscillate-live {
            0% {transform: scaleX(1) translateX(0);}
            10% {transform: scaleX(1.2) translateX(115%);} 
            20% {transform: scaleX(1) translateX(0%);}
            100% {transform: scaleX(1) translateX(0);} 
          }
        }
      }

      .profile-container {
        $profile-icon-size: 36px;

        margin-left: 18px;

        .round-img-icon {
          max-width: $profile-icon-size;
          height: $profile-icon-size;
          border: 1px solid $spotify-green;
        }

        .round-profile-letter {
          border: 2px solid $spotify-green;
          font-weight: bold;
          padding: 16px;
          color: $primary-theme-color;
        }
      }
    }

    .v-tooltip__content {
      top: 20px !important;
      right: 0px !important;
      max-width: 100%;
      left: auto !important;
      font-size: 12px;
    }
  }

  .menu-label {
    font-weight: bold;
    font-size: 12px;
    color: $primary-theme-color;
  }

  .aux-mode-toggle {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-weight: bold;
    margin-top: 24px;
    border-top: 1px dashed #eee;
    
    .v-input--selection-controls {
      margin-top: 0px;
      padding: 16px 0px;
      border-radius: 100%;
    }

    .v-label {
      @extend .menu-label;
      padding-left: 4px;
      color: #666666 !important;
    }
  }

  .user-img {
    @extend .round-img-icon;
    $icon-size: 24px;
    
    height: $icon-size;
    max-width: $icon-size;
  }

  .user-name {
    font-weight: bold;
    margin-left: 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 75%;
    margin-right: 24px;
  }
  
  .small-margin-right {
    margin-right: 2px;
  }

  .v-input--checkbox {
    margin: 0px !important;
    padding: 0px !important;
  }

  .mdi-checkbox-blank-outline {
    color: $primary-theme-color !important;
  }

  .v-list-item {
    padding-right: 8px;
  }

  .live-user-container {
    display: flex;
    align-items: center;
    margin: 14px 0px;
    font-size: 14px;
  }

  .ignored-opacity {
    opacity: 0.3;
  }

  .v-input--selection-controls {
    margin: 0px;
    padding: 0px;
  }

  .following-on-container {
    font-weight: bold;
    font-size: 10px;
    width: 66px;
    align-self: flex-end;
    line-height: 2;
    margin-bottom: 16px;

    .following-on {
      margin-right: 4px;
      white-space: nowrap;
      color: #666666;
    }

    .v-image {
      padding-top: 4px;
    }

    .v-responsive__sizer {
      padding: 0px !important;
    }

    .v-image__image {
      background-size: 66px;
      width: 77px;
      height: 20px;
    }
  }
</style>