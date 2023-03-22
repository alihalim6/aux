<template>
  <v-app-bar elevation="2" color="white" class="app-bar" short hide-on-scroll ref="appBar" :scroll-threshold="10">
    <div class="logo-container">
      <div class="aux-logo-container">
        <div class="outlined-phrase d-none d-sm-inline">PASS THE</div>
        <div class="inline-display main-label">AUX</div>
      </div>

      <div class="d-flex align-center ml-2">
        <v-icon small class="by-x">mdi-close</v-icon>
        <v-img class="spotify-icon d-inline d-md-none" :src="require('~/assets/Spotify_Logo_Icon.png')"></v-img>
        <v-img class="spotify-full d-none d-md-inline" :src="require('~/assets/Spotify_Logo_Full.png')"></v-img>
      </div>
    </div>

    <Search v-if="!isLoading"/>

    <div class="user-menu-container">
      <v-menu bottom left transition="slide-y-transition" :z-index="zIndex" :close-on-content-click="false" offset-y>
        <template v-slot:activator="{on, attrs}">            
          <div class="clickable on-air-container" v-bind="attrs" v-on="on">
            <v-icon class="live-dot" :color="liveUsers.length ? 'red' : 'gray'" large>mdi-circle-small</v-icon>
            <div class="users-on-air">{{liveUsers.length}}</div>
            <v-icon class="live-info-icon" color="black" large>mdi-chevron-down</v-icon>
          </div>
        </template>

        <v-list>
          <v-list-item>
            <div class="user-list width-100 scroll-shadow">
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
              </div>

              <div v-else>
                <div class="d-flex flex-column align-center">
                  <span class="no-other-users-message">No one else is here.</span>
                  <v-img class="no-other-users-img" :src="require('~/assets/no_other_users.png')"></v-img>
                </div>
              </div>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu bottom left transition="slide-y-transition" :z-index="zIndex" :close-on-content-click="false" offset-y>
        <template v-slot:activator="{on, attrs}">            
          <v-icon v-bind="attrs" v-on="on" color="#191414" class="clickable" large>mdi-menu</v-icon>
        </template>

        <v-list>
          <v-list-item class="clickable menu-option-container">
            <div class="aux-mode-toggle">
              <v-switch v-model="auxModeOn" :hide-details="true" color="#1DB954" @change="auxModeToggled()" label="AUX Mode"></v-switch>              
              <v-icon small class="clickable ml-2" color="#888" id="auxModeTooltipIcon">mdi-help-circle-outline</v-icon>

              <v-tooltip left color="#1DB954" attach="#footer" activator="#auxModeTooltipIcon" :open-on-hover="false">
                <span>When <span class="font-weight-bold">AUX Mode</span> is on, tracks played by others are automatically added to your queue
                  <v-icon small class="ml-1" color="white">mdi-arrow-down</v-icon>
                </span>
              </v-tooltip>
            </div>
          </v-list-item>

          <v-list-item class="clickable menu-option-container" @click="() => {}">
            <span class="menu-label">Feedback/Contact</span>
          </v-list-item>

          <v-list-item class="clickable menu-option-container" @click="logoutPressed()">
            <span class="menu-label">Logout</span>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script>
  import {Component, Vue, Getter, Watch, Mutation, Action} from 'nuxt-property-decorator';
  import {FEED, USER, UI, SPOTIFY} from '~/store/constants';
  import {storageSet, clearStorage, storageGet} from '~/utils/storage';
  import {AUX_MODE, SPLASH, IGNORED_USERS, AUTH} from '~/utils/constants';
  import {ignoredUsers} from '~/utils/helpers';
  import {handleApiError} from '~/api/_utils';
  import spotify from '~/api/spotify';
  import socket from '~/plugins/socket.client.js';
  import {auxApiClient} from '~/auth';

  @Component
  export default class AppHeader extends Vue {
    auxModeOn = true;
    liveUsers = [];
    isIos;
    isAndroid;
    zIndex = 2000;

    @Getter('users', {namespace: FEED})
    users;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('isLoading', {namespace: UI})
    isLoading;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Action('stopPlayback', {namespace: SPOTIFY})
    stopPlayback;

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
    
    @Watch('profile')
    async currentUserProfileSet(){
      if(this.profile){
        const {data} = await auxApiClient.post('/user/initialize', {profile: this.profile});
        storageSet(AUTH.AUX_API_TOKEN, data.token);
        storageSet(AUX_MODE, data.auxModeOn);
        storageSet(IGNORED_USERS, data.ignoredUsers || []);
        this.auxModeOn = data.auxModeOn;
      }
    }
    
    mounted(){
      if(navigator){
        const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
        this.isIos = iosPlatforms.find(platform => navigator.userAgent.includes(platform));

        const ua = navigator.userAgent.toLowerCase();
        this.isAndroid = ua.indexOf('android') > -1;
      }
    }

    auxModeToggled(){
      storageSet(AUX_MODE, this.auxModeOn);

      auxApiClient.post('/user/updateAuxMode', {profile: this.profile, auxModeOn: this.auxModeOn}, {    
        headers: {
          Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
        }
      });
    }

    logoutPressed(){
      this.stopPlayback(true);
      clearStorage();
      $nuxt.$router.push({name: SPLASH, params: {loggedIn: true}});
    }

    ignoreUserToggled(user){
      user.ignored = !user.ignored;

      if(user.ignored){
        storageSet(IGNORED_USERS, [...ignoredUsers(), user.id]);
        this.setToast({text: `Ignoring tracks and comments from ${user.name}`});
      }
      else{
        const userIdIndex = ignoredUsers().findIndex(userId => userId == user.id);
        const ignoredUserIds = ignoredUsers();
        ignoredUserIds.splice(userIdIndex, 1);
        storageSet(IGNORED_USERS, ignoredUserIds);
        this.setToast({text: `No longer ignoring tracks and comments from ${user.name}`});
      }

      auxApiClient.post('/user/updateIgnoredUsers', {profile: this.profile, ignoredUsers: ignoredUsers()}, {
        headers: {
          Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
        }
      });
    }

    async followingUserToggled(user){
      //user.following is v-modeled so value here is the result of the toggle
      const method = user.following ? 'PUT' : 'DELETE';

      try {
        await spotify({url: `/me/following?ids=${user.id}&type=user`, method});
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

    onScroll(){
      // @hack: https://github.com/vuetifyjs/vuetify/issues/9993
      const {appBar} = this.$refs
      if(appBar.currentScroll < appBar.currentThreshold) {
        appBar.isActive = true;
      }
    }
  }
</script>

<style lang="scss">
  .app-bar {
    $phrase-border-size: 2px;
    
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
      margin-top: 1px;

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

    .user-menu-container {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .on-air-container {
        display: flex;
        align-items: center;
        position: relative;
        margin-right: 20px;

        @media(max-width: $max-inner-width){
          margin-right: 14px;
        }

        .users-on-air {
          background-color: $primary-theme-color;
          color: $secondary-theme-color;
          font-size: 32px;
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
          bottom: -6px;
          left: 28px;
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
    
    .v-input--selection-controls {
      margin-top: 0px;
      padding: 16px 0px;
      border-radius: 100%;
    }

    .v-label {
      @extend .menu-label;
      padding-left: 4px;
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
    margin: 16px 0px;
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

  .user-list {
    padding: 16px 24px 0px 8px;
    display: flex;
    flex-direction: column;
    max-height: 400px;
    overflow: scroll;
  }

  .no-other-users-message {
    font-size: 32px;
    font-weight: bold;
  }

  .no-other-users-img {
    $size: 68px;

    width: $size;
    max-width: $size;
    height: auto;
    margin-bottom: 16px;
  }

  .here-now {
    font-weight: bold;
    font-size: 22px;
  }

  .live-dot {
    margin-right: -8px;
    margin-top: 2px;
  }
</style>