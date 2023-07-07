<template>
  <section>
    <ActionDialog/>

    <v-app-bar elevation="2" class="app-bar" :dark="darkMode" short hide-on-scroll :scroll-threshold="10">
      <div class="aux-logo-container" aria-hidden="true" v-if="!showEasterEgg" @click="() => showEasterEgg = true">
        <div class="outlined-pass-phrase pass-the-phrase">PASS THE</div>
        <div class="inline-display outlined-phrase main-label">AUX</div>
      </div>

      <div class="aux-logo-container" aria-hidden="true" v-if="showEasterEgg" @click="() => showEasterEgg = false">
        <span class="outlined-phrase easter-egg">100% TAFETTA</span>
      </div>

      <Search v-if="!isLoading"/>

      <div class="user-menu-container">
        <button class="clickable on-air-container" @click="() => showUserMenu = !showUserMenu" :aria-label="`there are currently ${liveUsers.length} other users on AUX`">
          <v-icon class="live-dot" :color="liveUsers.length ? 'red' : 'grey'" large>mdi-circle-small</v-icon>
          <div class="users-on-air">{{liveUsers.length}}</div>
          <v-icon class="live-info-icon" :color="darkMode ? 'white' : 'black'" large>{{`mdi-chevron-${showUserMenu ? 'up' : 'down'}`}}</v-icon>
        </button>

        <div class="user-menu" :class="{'no-other-users': !liveUsers.length}">
          <v-snackbar v-model="showUserMenu" :timeout="-1" transition="slide-y-transition" absolute app>
            <div v-show="liveUsers.length" class="user-list width-100">
              <div class="d-flex flex-column">
                <div class="following-on">FOLLOW ON SPOTIFY</div>
                
                <div class="live-user-container" v-for="user in liveUsers" :key="user.id">
                  <v-icon class="clickable mr-3" small :color="darkMode ? 'white' : 'black'" @click="ignoreUserToggled(user)">{{`mdi-eye${user.ignored ? '' : '-off'}`}}</v-icon>

                  <div class="d-flex align-center justify-start width-fit" :class="{'ignored-opacity': user.ignored}" aria-hidden="true">
                    <div>
                      <v-img v-show="user.img" :src="user.img" class="user-img"></v-img>
                      <div v-show="!user.img" class="round-profile-letter">{{`${user.name.substring(0, 1)}`}}</div>
                    </div>
                  
                    <div class="user-name" :class="{'ignored-opacity': user.ignored}">{{user.name}}</div>
                  </div>

                  <v-switch 
                    :class="{'ignored-opacity': user.ignored}" 
                    v-model="user.following" 
                    :hide-details="true" 
                    color="#1DB954" 
                    @click="followingUserToggled(user)"
                  >
                  </v-switch>
                </div>
              </div>
            </div>

            <div v-show="!liveUsers.length">
              <div class="d-flex flex-column align-center">
                <span class="no-other-users-message">No one else is here.</span>
                <v-img class="no-other-users-img" :eager="true" :src="require('~/assets/no_other_users.png')" alt=""></v-img>
              </div>
            </div>
          </v-snackbar>
        </div>

        <!-- couldn't get shitty vuetify to handle pressing enter for app header menus-->
        <v-menu v-if="profile" bottom left transition="slide-y-transition" :z-index="zIndex" offset-y :nudge-bottom="8">
          <template v-slot:activator="{on, attrs}">
            <div v-bind="attrs" v-on="on" class="profile-menu-icon" aria-hidden="true">     
              <v-img v-if="profile.img" :src="profile.img" class="round-img-icon menu-img"></v-img>

              <div v-else class="profile-name-letter">
                <span >{{profile.name.substring(0, 1)}}</span>
              </div>
            </div>
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

            <v-list-item class="clickable menu-option-container" @click="lightOrDarkModePressed()">
              <button class="d-flex align-center">
                <v-icon 
                  class="clickable ml-3 mr-4 dark-mode-toggle"
                  id="auxModeTooltipIcon"
                >
                  {{`mdi-${darkMode ? 'white-balance-sunny' : 'power-sleep'}`}}
                </v-icon>

                <span :id="`${darkMode}-darkModeLabel`" class="menu-label">Lights {{darkMode ? 'On' : 'Out'}}</span>
              </button>
            </v-list-item>

            <v-list-item class="clickable menu-option-container mb-5" @click="bookmarksPressed()">
              <button>
                <v-icon class="clickable bookmarks-icon" :color="darkMode ? '#fcfce0' : 'black'">mdi-bookmark</v-icon>
                <span class="menu-label">Bookmarks</span>
              </button>
            </v-list-item>

            <v-list-item v-if="!runningInPwa && isMobile()" class="clickable menu-option-container" @click="installPwaPressed()">
              <span class="install-pwa-label on-air">Install as an App</span>
            </v-list-item>

            <v-list-item class="clickable menu-option-container" @click="logout()">
              <span class="menu-label">Logout</span>
            </v-list-item> 

            <v-list-item class="clickable menu-option-container danger" @click="deleteUserActivity()">
              <span class="menu-label">Delete AUX Activity...</span>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Watch, Mutation} from 'nuxt-property-decorator';
  import {FEED, USER, UI} from '~/store/constants';
  import {storageSet, clearStorage, storageGet} from '~/utils/storage';
  import {AUX_MODE, SPLASH, IGNORED_USERS, AUTH} from '~/utils/constants';
  import {ignoredUsers, auxApiClient} from '~/utils/helpers';
  import {handleApiError} from '~/api/_utils';
  import spotify from '~/api/spotify';
  import socket from '~/plugins/socket.client.js';

  @Component
  export default class AppHeader extends Vue {
    auxModeOn = true;
    isIos = false;
    isAndroid = false;
    zIndex = 2000;
    runningInPwa = false;
    showUserMenu = false;
    showEasterEgg = false;

    @Getter('users', {namespace: FEED})
    users;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('isLoading', {namespace: UI})
    isLoading;

    @Getter('darkMode', {namespace: UI})
    darkMode;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Mutation('setActionDialog', {namespace: UI})
    setActionDialog;

    @Mutation('setDarkMode', {namespace: UI})
    setDarkMode;

    @Mutation('toggleDarkMode', {namespace: UI})
    toggleDarkMode;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

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

      this.$forceUpdate();
    }
    
    @Watch('profile')
    async currentUserProfileSet(){
      if(this.profile){
        const {data} = await auxApiClient.post('/user/initialize', {profile: this.profile});
        this.$vuetify.theme.dark = data.darkModeOn;
        this.setDarkMode(data.darkModeOn);
        storageSet(AUTH.AUX_API_TOKEN, data.token);
        storageSet(AUX_MODE, data.auxModeOn);
        storageSet(IGNORED_USERS, data.ignoredUsers || []);
        this.auxModeOn = data.auxModeOn;
      }
    }
    
    beforeMount(){
      if(navigator){
        const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
        this.isIos = iosPlatforms.find(platform => navigator.userAgent.includes(platform));
        this.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;

        this.runningInPwa = window.matchMedia('(display-mode: standalone)').matches || document.referrer.startsWith('android-app://') || navigator.standalone;
      }
    }

    auxModeToggled(){
      storageSet(AUX_MODE, this.auxModeOn);

      auxApiClient.post('/user/updateAuxMode', {profile: this.profile, auxModeOn: this.auxModeOn}, {    
        headers: {
          Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
        }
      });

      this.$forceUpdate();
    }

    logout(deletedActivity){
      $nuxt.$router.replace({name: SPLASH, params: {loggedIn: !deletedActivity}});
      clearStorage();
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

      this.$forceUpdate();
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
        handleApiError(`Oops! That ${user.following ? 'follow' : 'unfollow'} didn't go thru. Please try again.`);
        user.following = !user.following;
      }
    }

    deleteUserActivity(){
      this.setActionDialog({
        text: `Delete tracks I've played, comments I've made, and profile info that AUX has saved (bars?):`,
        cancellable: true,
        confirmLabel: 'CONFIRM AND LOGOUT',
        confirmFn: async () => {
          await auxApiClient.post('/user/delete', {profile: this.profile}, {    
            headers: {
              Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
            }
          });

          try {
            await auxApiClient.post('/feed/deleteUserActivity', {profile: this.profile}, {    
              headers: {
                Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
              }
            });

            this.logout(true);
          }
          catch(error){
            this.setToast({text: 'Sorry, there was an issue deleting your data. Please try again!', error: true})
          }
        } 
      });
    }

    isMobile(){
      return this.isIos || this.isAndroid;
    }

    installPwaPressed(){
      this.setActionDialog({isIosPwaInstall: this.isIos, isAndroidPwaInstall: this.isAndroid, confirmLabel: 'GOT IT'});
    }

    bookmarksPressed(){
      this.closeFeed();
      this.$nuxt.$root.$emit('showBookmarks');
    }

    lightOrDarkModePressed(){
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
      this.toggleDarkMode();

      auxApiClient.post('/user/updateDarkMode', {profile: this.profile, darkModeOn: this.$vuetify.theme.dark}, {    
        headers: {
          Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
        }
      });
    }
  }
</script>

<style lang="scss">
  .app-bar {
    height: $app-header-height !important;
    max-height: $app-header-height;
    z-index: 30 !important;
    background-color: white !important;

    @supports(-webkit-text-stroke: 2px $cream) {
      .outlined-phrase {
        -webkit-text-stroke: 2px $cream;
        -webkit-text-fill-color: $cream;
      }
    }

    @supports(-webkit-text-stroke: 1px $rose-red) {
      .outlined-pass-phrase {
        -webkit-text-stroke: 1.3px $rose-red;
        -webkit-text-fill-color: $rose-red;
      }
    }

    .aux-logo-container {
      margin-top: 8px;
      font-weight: 700;
      display: flex;
      align-items: center;
      
      .pass-the-phrase {
        color: $rose-red;
        transform: rotate(-80deg) scaleY(1.2) scaleX(1.1);
        font-size: 10px;
        white-space: nowrap;
        font-style: italic;
        letter-spacing: 0.75px;
      }

      .main-label {
        background-color: $rose-red;
        color: $cream;
        transform: skewX(-9.9deg);
        font-size: 26px;
        margin-left: -24px;
        padding: 0px 2px 0px 5px;
        letter-spacing: 4px;
        line-height: 1.7;
        margin-top: 4px;

          @media(max-width: $max-inner-width){ 
            font-size: 22px;
          }
      }

      .easter-egg {
        font-size: 14px;
        line-height: 1.7;
        margin-left: 3px;
        opacity: 0;
        animation-duration: 500ms;
        animation-delay: 0;
        @extend .fade-in-animation;
      }

      @supports(-webkit-text-fill-color: $rose-red) {
        .easter-egg {
          -webkit-text-stroke: 2px $rose-red;
          -webkit-text-fill-color:  $rose-red;
        }
      }
    }

    .divider {
      color: $primary-theme-color;
      padding-right: 6px;
      font-weight: bold;
      font-size: 8px;
    }
  
    .user-menu-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 13px;
      position: relative;

      @media(max-width: $max-inner-width){
        margin-top: 7px;
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

      .user-menu {   
        position: absolute;
        right: 55px;
        top: calc(#{$app-header-height} - 24px);
        max-width: 50vw;

        .v-snack {
          position: relative;
        }
                  
        .v-snack__wrapper {
          background-color: white;
          color: $primary-theme-color;
          border: none;
          max-width: none;
          min-width: max-content;
        }

        .theme--dark.v-input--switch .v-input--switch__track {
          color: #ccc;
        }
      }

      .no-other-users {
        max-width: none;
        right: 0px;
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
    color: $primary-theme-color !important;
    text-decoration: none;
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
      padding-left: 6px;
    }
  }

  .user-img {
    @extend .round-img-icon;
    $icon-size: 28px;
    
    height: $icon-size;
    max-width: $icon-size;
  }

  .user-name {
    font-weight: bold;
    margin-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 160px;
    margin-right: 18px;
    text-align: left;
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
    margin: 12px 0px;
    font-size: 14px;

    .v-input--switch__track {
      color: rgba(0, 0, 0, 0.21);
    }
  }

  .ignored-opacity {
    opacity: 0.3;
  }

  .v-input--selection-controls {
    margin: 0px;
    padding: 0px;
  }

  .following-on {
    white-space: nowrap;
    color: #666666;
    font-weight: bold;
    font-size: 10px;
    align-self: flex-end;
    line-height: 2;
    border-bottom: 2px solid $primary-theme-color;
    align-self: flex-end;
  }

  .user-list {
    padding: 8px 12px 0px 2px;
    display: flex;
    flex-direction: column;
    max-height: 400px;
    overflow: scroll;
    background-color: white;
    overflow-x: hidden;
  }

  .no-other-users-message {
    font-size: 32px;
    font-weight: bold;
    padding: 10px 0px 16px;
  }

  .no-other-users-img {
    $size: 54px;

    width: $size;
    max-width: $size;
    height: auto;
  }

  .here-now {
    font-weight: bold;
    font-size: 22px;
  }

  .live-dot {
    margin-right: -8px;
    margin-top: 2px;
  }

  .danger {
    background-color: $cream;

    .menu-label {
      color: $rose-red !important;
    }
  }

  .profile-name-letter {
    font-weight: bold;
    border: 3px solid $primary-theme-color;
    font-size: 16px;
    border-radius: 100%;
    padding: 2px 7px;
    width: 100%;
    min-width: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-img {
    $icon-size: 32px !important;

    height: $icon-size;
    max-width: $icon-size;
  }

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
      animation-duration: 3s;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
      animation-fill-mode: backwards;

      @keyframes oscillate-live {
        0% {transform: scaleX(1) translateX(0);}
        10% {transform: scaleX(1.3) translateX(115%);} 
        20% {transform: scaleX(1) translateX(0);} 
      }
    }
  }

  .on-air-container:focus-visible {
    @extend .focused;
  }

  .bookmarks-icon {
    margin-left: 11px;
    margin-right: 13px;
  }

  .dark-mode-toggle {
    color: black !important;
  }
</style>