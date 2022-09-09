<template>
  <section>
    <v-dialog :value="auxSession.display && !detailsOverlay.display" fullscreen transition="fade-transition" persistent :no-click-animation="true">
      <div class="session-container">
        <div class="d-flex flex-column">
          <div class="session-title-container">
            <v-icon class="close-button" large @click="closeAuxSession()" aria-label="close aux session">mdi-close</v-icon>

            <div class="d-flex align-start">
              <div class="position-relative">
                <v-icon>mdi-earth</v-icon>
                <v-icon x-small color="red" class="live-circle">mdi-circle</v-icon>
              </div>

              <div class="d-flex flex-column">
                <span v-if="profile" class="session-title">{{profile.name}}</span>

                <div class="live-now-label">
                  <span class="live-now-number">0</span><span class="live-now"> others live right now</span><v-icon small class="clickable ml-1" color="black">mdi-help-circle-outline</v-icon>
                </div>
              </div>
            </div>
          </div>

          <div class="pb-10"  v-if="auxSessionFeed.length">
            <AuxSessionFeedItem v-for="item in auxSessionFeed" :key="item.timestamp" :item="item" :itemSet="auxSessionFeed.map(activity => activity.track)"/>
          </div>

          <div v-else>
            START PLAYING MUSIC TO VIEW YOUR QUEUE LOREM IPSUM...
          </div>
        </div>
      </div>
    </v-dialog>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Mutation} from 'nuxt-property-decorator';
  import {UI, USER, SESSION} from '~/store/constants';

  @Component
  export default class AuxSession extends Vue {
    @Mutation('closeAuxSession', {namespace: UI})
    closeAuxSession;

    @Getter('auxSession', {namespace: UI})
    auxSession;

    @Getter('detailsOverlay', {namespace: UI})
    detailsOverlay;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('auxSessionFeed', {namespace: SESSION})
    auxSessionFeed;
  }
</script>

<style lang="scss">
  .session-container {
    background-color: white;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: $base-padding 24px;
    color: $primary-theme-color;
    overflow: scroll;
    font-weight: bold;
    margin: 0 auto;
    max-width: $max-inner-width;

    .close-button {
      align-self: flex-end;
      color: $primary-theme-color;
    }

    .session-title-container {
      display: flex;
      flex-direction: column;
      font-size: 24px;
      margin-bottom: 8px;

      .live-circle {
        margin-top: 14px;
        margin-right: 6px;
        position: absolute;
        bottom: 4px;
        right: -10px;
      }

      .live-now-label {
        font-size: 14px;

        .live-now-number {
          color: $spotify-green;
        }

        .live-now {
          font-weight: normal;
          color: #888888;
        }
      }
    }
  }
</style>